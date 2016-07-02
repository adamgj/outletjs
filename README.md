# Outlet

Plugin architecture w/ control flow model

WIP: Do not use!
Unlicensed

## Features
### Hierarchical stack syntax for triggers
Example
```
outlet.trigger('math/count/inc');
```
Triggers the follow stack. Calls an ordered control flow stack with passable arguments between functions in the stack. After the control flow registered listeners are called with the arguments object.
```
[ '*:before',
  'math:before',
  'math/*:before',
  'math/count:before',
  'math/count/*:before',
  'math/count/inc:before',
  '*',
  'math',
  'math/*',
  'math/count',
  'math/count/*',
  'math/count/inc',
  'math/count/inc:after',
  'math/count/*:after',
  'math/count:after',
  'math/*:after',
  'math:after',
  '*:after' ]
```
### Simple control flow
Trigger the control flow with initial arguments and log our results
```
var args = {count: 1};
outlet.trigger('math/count/inc', args);
console.log(args);
// {count: 2}
```
Export the increment function from our plugin (index.js)
```
module.exports = {
    increment: function(outlet, args) {
        // get 'step' config value from test plugin
        var step = outlet.settings.get('device:test:increment:step');

        // init count if not passed
        args.count = args.count?args.count:0;
        // increment count by step
        args.count = args.count+step;

        // trigger the next workflow with updated args
        outlet.next(outlet, args);
    }
};
```
Declare our settings and 'wiring' in our plugins package.json
```
{
  "name": "device-inc",
  "version": "0.2.0",
  "device": {
    "settings": {
      "increment": {
        "step": 1
      }
    },
    "wiring": [
      {
        "type": "workflow",
        "trigger": "math/count/inc",
        "action": "increment"
      }
    ]
  },
  "main": "index.js"
}
```
## TODO:
- namespacing w/ sockets
- documentation
- larger examples
- unit / integration tests