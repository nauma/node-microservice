'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Microservice = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Server = require('./Server');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Microservice = exports.Microservice = function () {
	function Microservice(name) {
		var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck(this, Microservice);

		config.server = config.server || { host: '0.0.0.0', port: 9250 };
		config.connections = config.connections || [];

		this.name = name;
		this.config = config;

		this.serverEvents = {
			connect: [],
			disconnect: [],
			data: [],
			send: []
		};
		this.serverClients = [];
		this.clientsHandlers = {};

		this.runServer();
	}

	_createClass(Microservice, [{
		key: 'runServer',
		value: function runServer() {
			var _this = this;

			this.server = new _Server.Server(this.config.server);

			this.server.on('connect', function (socket) {
				if (!socket.__id__) socket.__id__ = _this.getHash();
			});

			this.server.on('data', function (result, socket) {
				if (result.type === '__register_client__') {
					socket.__name__ = result.data.name;
					_this.serverClients.push(socket);

					console.log('Microservice \'' + _this.name + '\' \u2192 register \'' + socket.__name__ + '\' client!');

					var clientHandler = _this.clientsHandlers[socket.__name__];
					if (clientHandler) {
						clientHandler.setSocket(socket);
						clientHandler.send('__register_success__', {});
						clientHandler.events.connect.map(function (event) {
							return event();
						});
					}
				} else {
					var _clientHandler = _this.clientsHandlers[socket.__name__];

					if (_clientHandler && _clientHandler.socket) {
						if (result.serverHash) {
							_clientHandler.events.send.map(function (event, index) {
								_clientHandler.events.send.splice(index, 1);
								if (event.hash === result.hash) event.callback({ result: result.data });
							});
						} else {
							_clientHandler.events.data.map(function (event) {
								if (event.type === result.type) {
									if (result.clientHash) {
										event.callback(new ReplyHandler(result, socket));
									} else {
										event.callback({ result: result.data });
									}
								}
							});
						}
					}
				}
			});

			this.server.on('disconnect', function (socket) {
				var clientHandler = _this.clientsHandlers[socket.__name__];
				if (clientHandler) {
					clientHandler.setSocket(null);
					clientHandler.events.disconnect.map(function (event) {
						return event();
					});
				}

				_this.serverClients.map(function (client, index) {
					if (client.__name__ === socket.__name__) {
						_this.serverClients.splice(index, 1);
					}
				});
			});
		}
	}, {
		key: 'send',
		value: function send(name, type) {
			var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
			var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

			if (!this.clientsHandlers[name]) throw new Error('Client \'' + name + '\' not found');
			this.clientsHandlers[name].send(type, data, callback);
		}
	}, {
		key: 'get',
		value: function get(name) {
			var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			if (!this.clientsHandlers[name]) {
				this.clientsHandlers[name] = new ConnectHandler(name);
			}

			if (callback) {
				callback(this.clientsHandlers[name]);
				return this;
			} else {
				return this.clientsHandlers[name];
			}
		}
	}, {
		key: 'getHash',
		value: function getHash() {
			var min = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10000000;
			var max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 90000000;

			return Math.floor(Math.random() * (max - min)) + min;
		}
	}]);

	return Microservice;
}();

var ConnectHandler = function () {
	function ConnectHandler(name) {
		_classCallCheck(this, ConnectHandler);

		this.name = name;
		this.socket = null;

		this.events = {
			connect: [],
			data: [],
			send: [],
			disconnect: []
		};
	}

	_createClass(ConnectHandler, [{
		key: 'setSocket',
		value: function setSocket(socket) {
			this.socket = socket;
		}
	}, {
		key: 'open',
		value: function open(callback) {
			this.events.connect.push(callback);
			return this;
		}
	}, {
		key: 'close',
		value: function close(callback) {
			this.events.disconnect.push(callback);
			return this;
		}
	}, {
		key: 'on',
		value: function on(type, callback) {
			this.events.data.push({ type: type, callback: callback });
			return this;
		}
	}, {
		key: 'send',
		value: function send(type, data, callback) {
			if (!this.socket) {
				console.error('Dont set socket in \'' + this.name + '\'');
			}

			var send = {
				type: type,
				data: data
			};

			if (callback) {
				var serverHash = this.getHash();

				this.events.send.push({
					serverHash: serverHash,
					callback: callback
				});

				send.serverHash = serverHash;
			}

			this.socket.write(JSON.stringify(send));

			return this;
		}
	}, {
		key: 'getHash',
		value: function getHash() {
			var min = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10000000;
			var max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 90000000;

			return Math.floor(Math.random() * (max - min)) + min;
		}
	}]);

	return ConnectHandler;
}();

var ReplyHandler = function () {
	function ReplyHandler(response, socket) {
		_classCallCheck(this, ReplyHandler);

		this.socket = socket;
		this.response = response;
		this.result = this.response.data;
		this.type = this.response.type;
		this.clientHash = this.response.clientHash;
	}

	_createClass(ReplyHandler, [{
		key: 'reply',
		value: function reply(data) {
			this.socket.write(JSON.stringify({
				type: this.type,
				clientHash: this.clientHash,
				data: data
			}));
		}
	}]);

	return ReplyHandler;
}();