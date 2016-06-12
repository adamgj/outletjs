module.exports = {
	connect: function(outlet, args) {
		console.log('Test CONNECTED');
	},
	disconnect: function(outlet, args) {
		console.log('Test DISCONNECTED');
	},
	deviceConnect: function(outlet, args) {
		console.log('Test saw '+args.device.name+' connected!');
	},
	test: function(outlet, args) {
		console.log('TEST ACTION');
	},
	increment: function(outlet, args) {
		console.log('test1 increment');

		// get 'step' config value from test plugin
		var step = outlet.conf.get('device:test:increment:step');

		// init count if not passed
		args.count = args.count?args.count:0;
		// increment count by step
		args.count = args.count+step;

		// trigger the next workflow with updated args
		outlet.next(outlet, args);
	},
	dontRun: function(outlet, args) {
		console.log('SHOULD NOT RUN!');
		args.dontRun = true;
		outlet.next(outlet, args);
	}
};