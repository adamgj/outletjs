var _ = require('lodash');
var ee = require('event-emitter');
var path = require('path');

var OUTLET_CONFIG = 'outlet.json';

var defaults = {
	'connect': {
		'path': 'devices',
		'node_modules': true,
		'prefix': 'device-'
	}
};

function Outlet(opt)
{
	var devices = [];

	// init new event emitter
	var handler = ee();

	// init new configuration
	var conf = require('nconf');
	conf.overrides(opt).argv().env();
	conf.file(path.join(process.cwd(), OUTLET_CONFIG));
	conf.defaults(defaults);

	return({
		conf: conf,
		handler: handler,
		devices: devices,
		connect: connect,
		on: on,
		trigger: trigger
	});

	function trigger(event) {
		var args = _.drop(arguments, 1);

		handler.emit(event, args);

		return this;
	}

	function load(device) {
		if (!device.path) {
			throw new Error('Device not connected: '+JSON.stringify(device));
		}

		device.device = require(device.path);

		return device;
	}

	function on(name, args) {
		args = args ? args : {};

		// turn on all devices
		if (!name || name == '*') {
			_.forEach(devices, function(device) {
				var onArgs = args;
				onArgs.name = device.name;
				onArgs.path = device.path;
				device = load(device);
				if (device.device.on) {
					device.device.on(this, onArgs);
				}
			});
		}

		// TODO: find device by name

		return this;
	}

	function connect(name) {
		var device = null;

		var dir = path.join(process.cwd(), conf.get('connect:path'), name);

		var moduleName = conf.get('connect:prefix')+name;
		var moduleDir = path.join(process.cwd(), '/node_modules/', moduleName);

		try {
			device = {
				name: name,
				path: moduleDir
			};
			device.package = require(path.join(moduleDir, '/package.json'));
		}
		catch (e) {
			device = {
				name: name,
				path: dir
			};
			device.package = require(path.join(dir, '/package.json'));
		}

		devices.push(device);

		return this;
	}
}

module.exports = Outlet;