# node-microservices

Using microservices on node.js
Size: 11.6 Kb
`0` dependencies

# install

```shell
$ npm i @nauma/node-microservice --save
```

# using
### require
```js
const ms = require('@nauma/node-microservice')
```

### create Serverservice(server)
```js
const databaseServer = new ms.Serverservice('databaseServer', { host: 'localhost', port: 9250 })
```

### create Clientservice(client)
```js
const restServer = new ms.Clientservice('restServer', [
  { name: 'databaseServer', host: 'localhost', port: 9250 }
])
```

#### create server listeners to clients
```js
databaseServer.get('restServer', server => {
  server.open(() => { // new connection
    console.log(server.name, 'connected!')
  })
})
```
or
```js
databaseServer.get('restServer')
  .open(() => { // new connection
    console.log(server.name, 'connected!')
  })
```

#### add message listeners
```js
databaseServer.get('restServer', server => {
  server.on('hello', response => { // new connection
    console.log(response.result)
  })
})
```

#### send message
```js
databaseServer.get('restServer', server => {
  // send message if client is connected
  server.open(() => {
    server.send('hello', { testData: 1 })
  })
})
```

#### full example
```js
const ms = require('@nauma/node-microservice')

const restServer = new ms.Clientservice('restServer', [
  { name: 'databaseServer', host: 'localhost', port: 9250 }
  // etc connections
])

// add connection listener
restServer.get('databaseServer', database => {
  database.open(() => {
    console.log(database.name, 'connected!')
  })

  database.on('test', response => {
    console.log(database.name, 'send', response.result)
  })

  database.on('reply', response => {
    // reply message
    response.reply(response.result)
  })
})


const databaseServer = new ms.Serverservice('databaseServer', { host: '0.0.0.0', port: 9250 })

databaseServer.get('restServer', server => {
  server.open(() => {
    console.log(server.name, 'connected!')
    // send data
    server.send('test', { data: 228 })

    // send data & get reply
    server.send('reply', { data: 'hello' }, response => {
      console.log(server.name, 'reply:', response.result)
    })
  })
})

```
License
----
ISC
