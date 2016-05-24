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
	}
};