const Client = require('./Client')

class Clientservice {
	constructor (name, config = []) {
		this.name = name
		this.config = config

		this.connections = {}
		this.connectionsHandler = {}

		this.runConnect()
	}

	runConnect () {
		this.config.map(address => {
			let clientName = address.split('@')[0]
			let clientHost = address.split('@')[1].split(':')[0]
			let clientPort = address.split('@')[1].split(':')[1]

			let client = this.connections[clientName]
			client = new Client({ host: clientHost, port: clientPort })
			client.on('connect', () => {
				client.send({
					type: '__register_client__',
					data: {
						name: this.name
					}
				})
			})

			client.on('data', result => {
				if(result.type === '__register_success__') {
					if (this.connectionsHandler[clientName]) {
						let handler = this.connectionsHandler[clientName]
						handler.setSocket(client)
						handler.events.connect.map(event => event())
					} else {
						this.connectionsHandler[clientName] = new ClientHandler(clientName)
						let handler = this.connectionsHandler[clientName]
						handler.setSocket(client)
						handler.send('__register_success__', {})
					}

					console.log(`Client '${this.name}' regiter to '${clientName}' success!`)
				} else {
					if (this.connectionsHandler[clientName]) {
						let handler = this.connectionsHandler[clientName]
						if(result.clientHash) {
							handler.events.send.map((event, index) => {
								if(event.clientHash === result.clientHash) {
									handler.events.send.splice(index, 1)
									event.callback(result.data)
								}
							})
						} else {
							handler.events.data.map((event, index) => {
								if(event.type === result.type) {
									if(result.serverHash) {
										 event.callback(new ReplyHandler(result, client))
									} else {
										event.callback({ result: result.data })
									}
								}
							})
						}

					}
				}
			})

			client.on('disconnect', () => {
				let clientHandler = this.connectionsHandler[clientName]
				if (clientHandler) {
					clientHandler.setSocket(null)
					clientHandler.events.disconnect.map(event => event())
				}
			})

			client.on('error', () => {
				console.log(`${this.name} error! Reconnecting...`)
			})
		})
	}

	get (name, callback = null) {
		if (!this.connectionsHandler[name]) {
			this.connectionsHandler[name] = new ClientHandler(name)
		}

		if(callback) {
			callback(this.connectionsHandler[name])
			return this
		} else {
			return this.connectionsHandler[name]
		}
	}

	send (name, type, data = {}, callback = null) {
		if(!this.clientsHandlers[name]) throw new Error(`Server '${name}' not found`)
		this.connectionsHandler[name].send(type, data, callback)
	}
}

class ClientHandler {
	constructor(name) {
		this.name = name
		this.socket = null
		this.events = {
			connect: [],
			disconnect: [],
			data: [],
			send: [],
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

	send (type, data, callback = null) {
		if(!this.socket) {
			console.error(`Dont set socket in '${this.name}'`)
		}

		let send = {
			type,
			data
		}

		if(callback) {
			let clientHash = this.getHash()

			this.events.send.push({
				clientHash,
				callback
			})

			send.clientHash = clientHash
		}


		this.socket.send(send)

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
		this.serverHash = this.response.serverHash
	}

	reply (data) {
		this.socket.send({
			type: this.type,
			serverHash: this.serverHash,
			data
		})
	}
}

module.exports = Clientservice
