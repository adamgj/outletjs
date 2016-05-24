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


function registerListener(handler, emit, trigger, func) {
	emit = emit ? emit : "on";

	return handler[emit](trigger, func);
}

function unregisterListener(handler, func) {
	return handler.off(func);
}

function Device(nameIn, dirIn)
{
	var name = nameIn;
	var dir = dirIn; 
	var description, conf, uses, listeners, keywords;

	return({
		name: name,
		dir: dir,
		description: description,
		conf: conf,
		uses: uses,
		listeners: listeners,
		keywords: keywords,
		load: load
	});

	function load() {
		var device = this;
		var package;


		if (!_.isEmpty(device.dir)) {
			package = require(path.join(device.dir, '/package.json'));
		}
		else {
			if (_.isEmpty(device.name)) {
				throw new Error('Device name or path must be specified');
			}

			try {
				device.dir = path.join(process.cwd(), '/node_modules/', device.name);
				package = require(path.join(device.dir, '/package.json'));
			}
			catch (err) {
				// TODO: from config
				try {
					device.dir = path.join(process.cwd(), defaults.connect.path, device.name);
					package = require(path.join(this.dir, '/package.json'));
				}
				catch (e) {
					console.error('Device not found: '+device.name);
				}
			}
		}

		device = _.assign(device,
			require(device.dir),
			_.pick(package, ['name', 'version', 'description', 'keywords']),
			_.pick(package.device, ['conf', 'uses', 'listeners'])
			);
		
		// remove prefix (ie. device-test -> test)
		device.name = _.trimStart(device.name, defaults.connect.prefix);

		_.forEach(device, function(prop) {
			this[prop] = prop;
		});

		return this;
	}
}

function Outlet(opt) 
{
	var devices = [];
	var registry = {};

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
		disconnect: disconnect,
		trigger: trigger
	});

	function trigger(event, args) {
		// init if not defined
		args = args?args:{};
		// add extra args passed
		args.args = _.drop(arguments, 2);

		handler.emit(event, this, args);

		return this;
	}

	function connect(name) {
		// find & require module
		var device = Device(name).load();

		// register all listeners
		if (_.isArray(device.listeners)) {
			_.forEach(device.listeners, function(listener) {
				registerListener(handler, listener.emit, listener.trigger, device[listener.action]);
			});
		}

		// FIXME
		var dconf = {"device": {}[device.name] = device.conf};
		this.conf.defaults(dconf);

		// add device to registry
		devices.push(device);
		registry[device.name] = devices.length-1;

		// fire connect action if defined
		if (_.isFunction(device.connect)) {
			device.connect(this, {name: name, dir: device.dir});
		}

		// emit global connect event
		trigger('connect', {device: device});

		return this;
	}

	function disconnect(name) {
		// find device
		var device = devices[registry[name]];

		if (!_.isObject(device)) {
			throw new Error("Device not found: "+name);
		}

		// un-register all listeners
		if (_.isArray(device.listeners)) {
			_.forEach(device.listeners, function(listener) {
				// FIXME
				//unregisterListener(handler, device[listener.action]);
			});
		}

		// remove device from registry
		this.devices = _.pullAt(devices, registry[name]+1);
		delete registry[name];

		// fire disconnect action if defined
		if (_.isFunction(device.disconnect)) {
			device.disconnect(this, {name: name, dir: device.dir});
		}

		// emit global disconnect event
		trigger('disconnect', {device: device});

		device = null;

		return this;
	}
}

module.exports = Outlet;