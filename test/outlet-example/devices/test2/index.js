module.exports = {
	connect: function(outlet, args) {
		console.log('Test2 CONNECTED');
	},
	disconnect: function(outlet, args) {
		console.log('Test2 DISCONNECTED');
	},
	deviceConnect: function(outlet, args) {
		console.log('Test2 saw '+args.device.name+' connected!');
	},
	test: function(outlet, args) {
		console.log('TEST2 ACTION');
	}
};