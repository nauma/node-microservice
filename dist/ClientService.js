'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Clientservice = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Client = require('./Client');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Clientservice = exports.Clientservice = function () {
	function Clientservice(name) {
		var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

		_classCallCheck(this, Clientservice);

		this.name = name;
		this.config = config;

		this.connections = {};
		this.connectionsHandler = {};

		this.runConnect();
	}

	_createClass(Clientservice, [{
		key: 'runConnect',
		value: function runConnect() {
			var _this = this;

			this.config.map(function (address) {
				var clientName = address.split('@')[0];
				var clientHost = address.split('@')[1].split(':')[0];
				var clientPort = address.split('@')[1].split(':')[1];

				var client = _this.connections[clientName];
				client = new _Client.Client({ host: clientHost, port: clientPort });
				client.on('connect', function () {
					client.send({
						type: '__register_client__',
						data: {
							name: _this.name
						}
					});
				});

				client.on('data', function (result) {
					if (result.type === '__register_success__') {
						if (_this.connectionsHandler[clientName]) {
							var handler = _this.connectionsHandler[clientName];
							handler.setSocket(client);
							handler.events.connect.map(function (event) {
								return event();
							});
						}
					} else {
						if (_this.connectionsHandler[clientName]) {
							var _handler = _this.connectionsHandler[clientName];
							if (result.clientHash) {
								_handler.events.send.map(function (event, index) {
									if (event.clientHash === result.clientHash) {
										_handler.events.send.splice(index, 1);
										event.callback(result.data);
									}
								});
							} else {
								_handler.events.data.map(function (event, index) {
									if (event.type === result.type) {
										if (result.serverHash) {
											event.callback(new ReplyHandler(result, client));
										} else {
											event.callback({ result: result.data });
										}
									}
								});
							}
						}
					}
				});

				client.on('disconnect', function () {
					var clientHandler = _this.connectionsHandler[clientName];
					if (clientHandler) {
						clientHandler.setSocket(null);
						clientHandler.events.disconnect.map(function (event) {
							return event();
						});
					}
				});
			});
		}
	}, {
		key: 'get',
		value: function get(name) {
			var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			if (!this.connectionsHandler[name]) {
				this.connectionsHandler[name] = new ClientHandler(name);
			}

			if (callback) {
				callback(this.connectionsHandler[name]);
				return this;
			} else {
				return this.connectionsHandler[name];
			}
		}
	}, {
		key: 'send',
		value: function send(name, type) {
			var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
			var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

			if (!this.clientsHandlers[name]) throw new Error('Server \'' + name + '\' not found');
			this.connectionsHandler[name].send(type, data, callback);
		}
	}]);

	return Clientservice;
}();

var ClientHandler = function () {
	function ClientHandler(name) {
		_classCallCheck(this, ClientHandler);

		this.name = name;
		this.socket = null;
		this.events = {
			connect: [],
			disconnect: [],
			data: [],
			send: []
		};
	}

	_createClass(ClientHandler, [{
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
		value: function send(type, data) {
			var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

			if (!this.socket) {
				console.error('Dont set socket in \'' + this.name + '\'');
			}

			var send = {
				type: type,
				data: data
			};

			if (callback) {
				var clientHash = this.getHash();

				this.events.send.push({
					clientHash: clientHash,
					callback: callback
				});

				send.clientHash = clientHash;
			}

			this.socket.send(send);

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

	return ClientHandler;
}();

var ReplyHandler = function () {
	function ReplyHandler(response, socket) {
		_classCallCheck(this, ReplyHandler);

		this.socket = socket;
		this.response = response;
		this.result = this.response.data;
		this.type = this.response.type;
		this.serverHash = this.response.serverHash;
	}

	_createClass(ReplyHandler, [{
		key: 'reply',
		value: function reply(data) {
			this.socket.send({
				type: this.type,
				serverHash: this.serverHash,
				data: data
			});
		}
	}]);

	return ReplyHandler;
}();