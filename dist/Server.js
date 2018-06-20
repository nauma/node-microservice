'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Server = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Server = exports.Server = function () {
	function Server() {
		var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { host: 'localhost', port: 9250 };

		_classCallCheck(this, Server);

		this.host = config.host;
		this.port = config.port;

		this.events = {
			connect: [],
			disconnect: [],
			listener: [],
			error: [],
			data: []
		};

		this.server = _net2.default.createServer();
		this.__serverConnection();
		this.__runServer();
	}

	_createClass(Server, [{
		key: '__serverConnection',
		value: function __serverConnection() {
			var _this = this;

			this.server.on('connection', function (socket) {
				_this.events.connect.map(function (event) {
					return event(socket);
				});

				socket.on('data', function (data) {
					var callback = function callback(data) {
						var result = JSON.parse(data);

						_this.events.data.map(function (event) {
							event(result, socket);
						});
					};

					var result = data.toString('utf8');

					if (result.indexOf('}{') === -1) {
						callback(result);
					} else {
						var listMessage = result.replace(/\}\{/g, '}:;:{');
						var messages = listMessage.split(':;:');

						for (var i = 0; i < messages.length; i++) {
							callback(messages[i]);
						}
					}
				});

				socket.on('close', function () {
					return _this.events.disconnect.map(function (event) {
						return event(socket);
					});
				});
				socket.on('error', function (error) {
					return _this.events.error.map(function (event) {
						return event(error);
					});
				});
			});
		}
	}, {
		key: '__runServer',
		value: function __runServer() {
			var _this2 = this;

			this.server.listen(this.port, this.host, function (error) {
				if (error) {
					throw new Error('Server (' + _this2.config.host + ':' + _this2.config.port + ') start error: ' + error);
				} else {
					_this2.events.listener.map(function (event) {
						return event();
					});
				}
			});
		}
	}, {
		key: 'on',
		value: function on(name, callback) {
			if (!this.events[name]) throw new Error('Server \u2192 error \u2192 not found \'' + name + '\' event');
			this.events[name].push(callback);
			return this;
		}
	}]);

	return Server;
}();