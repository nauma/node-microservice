const net = require('net')

class Server {
	constructor (config = { host: 'localhost', port: 9250 }) {
		this.host = config.host
		this.port = config.port

		this.events = {
			connect: [],
			disconnect: [],
			listener: [],
			error: [],
			data: [],
		}

		this.server = net.createServer()
		this.__serverConnection()
		this.__runServer()
	}

	__serverConnection () {
		this.server.on('connection', socket => {
				this.events.connect.map(event => event(socket))

				socket.on('data', data => {
					let callback = data => {
						let result = JSON.parse(data)

						this.events.data.map(event => {
							event(result, socket)
						})
					}

					let result = data.toString('utf8')

					if (result.indexOf('}{') === -1) {
						callback(result)
					} else {
						let listMessage = result.replace(/\}\{/g, '}:;:{')
						let messages = listMessage.split(':;:')

						for (var i = 0; i < messages.length; i++) {
							callback(messages[i])
						}
					}

				})

				socket.on('close', () => this.events.disconnect.map(event => event(socket)))
				socket.on('error', error => this.events.error.map(event => event(error)))
		})
	}

	__runServer () {
		this.server.listen(this.port, this.host, error => {
			if(error) {
				throw new Error(`Server (${this.config.host}:${this.config.port}) start error: ${error}`)
			} else {
				this.events.listener.map(event => event())
			}
		})
	}

	on (name, callback) {
		if(!this.events[name]) throw new Error(`Server → error → not found '${name}' event`)
		this.events[name].push(callback)
		return this
	}
}

module.exports = Server
