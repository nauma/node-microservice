'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Client = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = exports.Client = function () {
	function Client() {
		var _this = this;

		var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, Client);

		this.config = config;

		this.events = {
			connect: [],
			disconnect: [],
			error: [],
			data: []
		};

		this.connection = new _net2.default.Socket();

		this.connection.on('data', function (data) {
			var callback = function callback(data) {
				var result = JSON.parse(data);

				_this.events.data.map(function (event) {
					event(result);
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

		this.connection.on('connect', function () {
			_this.events.connect.map(function (event) {
				return event();
			});
		});

		this.connection.on('close', function () {
			_this.events.disconnect.map(function (event) {
				return event();
			});
		});

		this.connection.on('error', function (error) {
			_this.events.error.map(function (event) {
				return event(error);
			});
			console.log(error);

			// reconnecting
			setTimeout(function () {
				_this._reconnect();
			}, 500);
		});

		this._reconnect();
	}

	_createClass(Client, [{
		key: '_reconnect',
		value: function _reconnect() {
			this.connection.connect(this.config.port, this.config.host);
		}
	}, {
		key: 'on',
		value: function on(name, callback) {
			if (!this.events[name]) throw new Error('Server \u2192 error \u2192 not found \'' + name + '\' event');
			this.events[name].push(callback);
			return this;
		}
	}, {
		key: 'send',
		value: function send() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
			var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			this.connection.write(JSON.stringify(data), callback);
		}
	}, {
		key: 'getHash',
		value: function getHash(min, max) {
			return '' + Math.floor(Math.random() * (max - min)) + min;
		}
	}]);

	return Client;
}();