var outlet = require('outletjs')();

outlet
	.plug('test')
	.plug('test2')
	.trigger('test')
	.trigger('one/two/three/four/five');

outlet.conf.set('device:test:increment:step', 10);
var args = {count: 10};
outlet.flow('math/count/inc', args);
console.log(args);

console.log(outlet.conf.get('outlet'));

// test device connected
console.log(JSON.stringify(outlet.devices));

console.log(outlet.devices[0].name+
	outlet.devices[0].version);

// test device config loaded
console.log(outlet.conf.get('device:test'));
console.log(outlet.conf.get('device:test2'));

outlet.unplug('test');

// test device disconnected
console.log(JSON.stringify(outlet.devices));