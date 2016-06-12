var _ = require('lodash');
var ee = require('event-emitter');
var path = require('path');

var OUTLET_CONFIG = 'outlet.json';

var defaults = {
	'outlet' : {
		'connect': {
			'path': 'devices',
			'node_modules': true,
			'prefix': 'device-'
		}
	},
	'device': {}
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
	var description, conf, uses, listeners, workflows, keywords;

	return({
		name: name,
		dir: dir,
		description: description,
		conf: conf,
		uses: uses,
		listeners: listeners,
		workflows: workflows,
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

			if (defaults.outlet.connect.node_modules) {
				try {
					requireDevice('/node_modules');
				}
				catch (err) {
					try {
						requireDevice(defaults.outlet.connect.path);
					}
					catch (e) {
						console.error('Device not found: '+device.name);
					}
				}
			}
			else {
				requireDevice(defaults.outlet.connect.path);
			}
		}

		function requireDevice(folder) {
			device.dir = path.join(process.cwd(), folder, device.name);
			package = require(path.join(device.dir, '/package.json'));
		}

		device = _.assign(device,
			require(device.dir),
			_.pick(package, ['name', 'version', 'description', 'keywords']),
			_.pick(package.device, ['conf', 'uses', 'listeners', 'workflows'])
			);
		
		// remove prefix (ie. device-test -> test)
		device.name = _.trimStart(device.name, defaults.outlet.connect.prefix);

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
	var defaultConf = defaults;

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
		trigger: trigger,
		flow: flow
	});

	function createStack(input) {
		var stackBefore = [];
		var stack = [];
		var stackAfter = [];
		var arr = _.split(input, '/');

		var i, s;

		// create before and middle stacks
		for (i = 0; i <= arr.length; i++) {
			s = _.join(_.take(arr, i), '/');
			if (!_.isEmpty(s)) {
				stackBefore.push(s+':before');
				stack.push(s);
			}
			if (i < arr.length) {
				s = _.isEmpty(s) ? '*' : s+'/*';
				stackBefore.push(s+':before');
				stack.push(s);
			}	
		}

		// create after stack in reverse order
		for (i = arr.length; i >= 0; i--) {
			s = _.join(_.take(arr, i), '/');
			if (i < arr.length) {
				var wild = _.isEmpty(s) ? '*' : s+'/*';
				stackAfter.push(wild+':after');
			}
			if (!_.isEmpty(s)) {
				stackAfter.push(s+':after');
			}
		}

		// merge stacks
		stack = _.concat(stackBefore, stack, stackAfter);

		return stack;
	}

	function flow(names, args) {
		var funcs = [];
		var outlet = this;

		// build trigger stack
		var stack = createStack(names);

		_.forEach(stack, function(name) {
			_.forEach(devices, function(device) {
				if (_.isArray(device.workflows)) {
					_.forEach(device.workflows, function(workflow) {
						// poly support for simple string def or object
						var action = _.isString(workflow) ? workflow : workflow.action;
						var trigger = _.isString(workflow) ? workflow : workflow.trigger;
						if (trigger === name) {
							var func = device[action];
							// add function to the action stack
							funcs.push(function(o, a) { func(o, a); });
						}
					});
				}
			});
		});

		// setup next control flow
		function next(o, a) {
			var func = funcs.shift();
			if (func){
				o.next = next;
				func(o, a);
			}
		}
		// initiate control flow
		next(this, args);

		return this;
	}

	function trigger(events, args) {
		// init if not defined
		args = args?args:{};
		// add extra args passed
		args.args = _.drop(arguments, 2);

		var stack = createStack(events);

		_.forEach(stack, function(event){
			handler.emit(event, this, args);
		});

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

		// load current defaults conf
		var dconf = defaultConf;
		// namespace device conf under 'device' and name
		dconf.device[device.name] = device.conf;
		// apply new conf defaults
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