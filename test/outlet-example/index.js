var outlet = require('outletjs')();

outlet
	.plug('test')
	.plug('test2')
	.trigger('test')
	.trigger('one/two/three/four/five');

outlet.settings.set('device:test:increment:step', 10);
var args = {count: 10};
outlet.trigger('math/count/inc', args);
console.log(args);

console.log(outlet.settings.get('outlet'));

// test device connected
console.log(JSON.stringify(outlet.devices));

console.log(outlet.devices[0].name+
	outlet.devices[0].version);

// test device config loaded
console.log(outlet.settings.get('device:test'));
console.log(outlet.settings.get('device:test2'));

try {
	outlet.plug('doesnotexist');
} catch (e) {
	console.log(e.stack);
}

outlet.unplug('test');

// test device disconnected
console.log(JSON.stringify(outlet.devices));