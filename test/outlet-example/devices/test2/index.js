module.exports = {
	plug: function(outlet, args) {
		console.log('Test2 PLUGGED IN');
	},
	unplug: function(outlet, args) {
		console.log('Test2 UNPLUGGED');
	},
	deviceConnect: function(outlet, args) {
		console.log('Test2 saw '+args.device.name+' connected!');
	},
	test: function(outlet, args) {
		console.log('TEST2 ACTION');
	},
	increment: function(outlet, args) {
		console.log('test2 increment');
		
		// get 'step' config value from test plugin
		var step = outlet.conf.get('device:test:increment:step');
		step = step?step:1;

		// init count if not passed
		args.count = args.count?args.count:0;
		// increment count by step
		args.count = args.count+step;

		// trigger the next workflow with updated args
		outlet.next(outlet, args);
	}
};