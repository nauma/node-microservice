const net = require('net')

class Client {
	constructor (config = {}) {
		this.config = config

		this.events = {
			connect: [],
			disconnect: [],
			error: [],
			data: [],
		}

		this.connection = new net.Socket();

		this.connection.on('data', data => {
				let callback = data => {
					let result = JSON.parse(data)

					this.events.data.map(event => {
						event(result)
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
		});

		this.connection.on('connect', () => {
			this.events.connect.map(event => event())
		});

		this.connection.on('close', () => {
			this.events.disconnect.map(event => event())
		});

		this.connection.on('error', error => {
			this.events.error.map(event => event(error))
			console.log(error)

			// reconnecting
			setTimeout(() => {
				this._reconnect()
			}, 500)
		});

		this._reconnect()
	}

	_reconnect () {
		this.connection.connect(this.config.port, this.config.host)
	}

	on (name, callback) {
		if(!this.events[name]) throw new Error(`Server → error → not found '${name}' event`)
		this.events[name].push(callback)
		return this
	}

	send (data = {}, callback = null) {
		this.connection.write(JSON.stringify(data), callback)
	}

	getHash (min, max) {
	  return '' + Math.floor(Math.random() * (max - min)) + min;
	}
}

module.exports = Client
