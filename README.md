# picos-util
utility functions for nodejs, tested with [pico-api](https://github.com/ldarren/pico-api)

## feature
- zip
- unzip
- ajax (nodejs), client side conterpart can be found [here](https://github.com/ldarren/lean/blob/master/src/js/__.js#L43)

## usage
```javascript
const util = require('picos-util')

// Method, URL, Params/Payload, Options, Callback
util.ajax('GET', '/echo', null, {socketPath:'/run/app.sock', (err, state, res) => {
	if (4 === state) return // support response streaming
	if (err) return console.error(err)
	console.log(res)
}}
```
