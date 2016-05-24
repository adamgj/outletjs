var outlet = require('outletjs')();

outlet
	.connect('test')
	.connect('test2')
	.trigger('test');

// test device connected
console.log(JSON.stringify(outlet.devices));

console.log(outlet.devices[0].name+
	outlet.devices[0].version);

// test device config loaded
console.log(outlet.conf.get('device:test'));
console.log(outlet.conf.get('device:test2'));

outlet.disconnect('test');

// test device disconnected
console.log(JSON.stringify(outlet.devices));