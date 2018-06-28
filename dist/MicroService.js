const Server = require('./Server')

class Microservice {
	constructor (name, config = {}) {
		config = config || { host: '0.0.0.0', port: 9250 }

		this.name = name
		this.config = config

		this.serverEvents = {
			connect: [],
			disconnect: [],
			data: [],
			send: []
		}
		this.serverClients = []
		this.clientsHandlers = {}

		this.runServer()
	}

	runServer () {
		this.server = new Server(this.config)

		this.server.on('connect', socket => {
			if (!socket.__id__) socket.__id__ = this.getHash()
		})

		this.server.on('data', (result, socket) => {
			if(result.type === '__register_client__') {
				socket.__name__ = result.data.name
				this.serverClients.push(socket)

				console.log(`Microservice '${this.name}' → register '${socket.__name__}' client!`)

				let clientHandler = this.clientsHandlers[socket.__name__]
				if (clientHandler) {
					clientHandler.setSocket(socket)
					clientHandler.send('__register_success__', {})
					clientHandler.events.connect.map(event => event())
				} else {
					this.clientsHandlers[socket.__name__] = new ConnectHandler(socket.__name__)
					let clientHandler = this.clientsHandlers[socket.__name__]
					clientHandler.setSocket(socket)
					clientHandler.send('__register_success__', {})
				}
			} else {
				let clientHandler = this.clientsHandlers[socket.__name__]

				if (clientHandler && clientHandler.socket) {
					if (result.serverHash) {
						clientHandler.events.send.map((event, index) => {
							clientHandler.events.send.splice(index, 1)
							if (event.hash === result.hash) event.callback({ result: result.data })
						})
					} else {
						clientHandler.events.data.map(event => {
							if (event.type === result.type) {
								if(result.clientHash) {
									 event.callback(new ReplyHandler(result, socket))
								} else {
									event.callback({ result: result.data })
								}
							}
						})
					}
				}
			}
		})

		this.server.on('disconnect', socket => {
			let clientHandler = this.clientsHandlers[socket.__name__]
			if (clientHandler) {
				clientHandler.setSocket(null)
				clientHandler.events.disconnect.map(event => event())
			}

			this.serverClients.map((client, index) => {
				if (client.__name__ === socket.__name__) {
					this.serverClients.splice(index, 1)
				}
			})
		})
	}

	send (name, type, data = {}, callback = null) {
		if(!this.clientsHandlers[name]) throw new Error(`Client '${name}' not found`)
		this.clientsHandlers[name].send(type, data, callback)
	}

	get (name, callback = null) {
		if (!this.clientsHandlers[name]) {
			this.clientsHandlers[name] = new ConnectHandler(name)
		}

		if(callback) {
			callback(this.clientsHandlers[name])
			return this
		} else {
			return this.clientsHandlers[name]
		}
	}

	getHash (min = 10000000, max = 90000000) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}
}

class ConnectHandler {
	constructor (name) {
		this.name = name
		this.socket = null

		this.events = {
			connect: [],
			data: [],
			send: [],
			disconnect: []
		}
	}

	setSocket (socket) {
		this.socket = socket
	}

	open (callback) {
		this.events.connect.push(callback)
		return this
	}

	close (callback) {
		this.events.disconnect.push(callback)
		return this
	}

	on (type, callback) {
		this.events.data.push({ type, callback })
		return this
	}

	send (type, data, callback) {
		if(!this.socket) {
			console.error(`Dont set socket in '${this.name}'`)
		}

		let send = {
			type,
			data
		}

		if(callback) {
			let serverHash = this.getHash()

			this.events.send.push({
				serverHash,
				callback
			})

			send.serverHash = serverHash
		}

		this.socket.write(JSON.stringify(send))

		return this
	}

	getHash (min = 10000000, max = 90000000) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}
}

class ReplyHandler {
	constructor (response, socket) {
		this.socket = socket
		this.response = response
		this.result = this.response.data
		this.type = this.response.type
		this.clientHash = this.response.clientHash
	}

	reply (data) {
		this.socket.write(JSON.stringify({
			type: this.type,
			clientHash: this.clientHash,
			data
		}))
	}
}

module.exports = Microservice
