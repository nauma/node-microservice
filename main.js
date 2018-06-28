const ms = require('./dist')

let restServer = new ms.Clientservice('restServer', [
	'databaseServer@localhost:9250'
])

restServer.get('databaseServer', database => {
	database.open(() => {
		console.log(database.name + ' connected')
	})

	database.on('test', response => {
		console.log(database.name + ' send ', response.result)
	})

	database.on('reply', response => {
		response.reply(response.result)
	})
})


let databaseServer = new ms.Microservice('databaseServer', { host: '0.0.0.0', port: 9250 })

databaseServer.get('restServer', server => {
	server.open(() => {
		console.log(server.name + ' connected')

		server.send('test', { data: 228 })
		
		server.send('reply', { data: 'hello' }, response => {
			console.log(server.name + ' reply: ', response.result)
		})
	})
})
