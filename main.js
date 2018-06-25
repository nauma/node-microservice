const ms = require('./dist')

let restServer = new ms.Clientservice('restServer', [
	'databaseServer@localhost:9250'
])

restServer.get('databaseServer', database => {
	database.open(() => {
		console.log('database connected')
	})
})


let databaseServer = new ms.Microservice('databaseServer', {
	server: { host: '0.0.0.0', port: 9250 }
})

databaseServer.get('restServer', server => {
	server.open(() => {
		console.log('server connected')
	})
})
