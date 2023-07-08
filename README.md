# picos-util

This is a JavaScript module that provides utility functions for making HTTP requests, handling data compression, and managing environment variables. It utilizes the `zlib`, `http`, `https`, `fs`, `querystring`, and `pico-common` libraries.

## Installation

To use this module, you need to have Node.js installed. You can install the required dependencies by running the following command:

```
npm i picos-util
```

## Usage

To use this module in your JavaScript code, require it using `require('http-utils')`. The module exports the following functions:

### zip(str, cb)

This function compresses a string using `zlib`'s `deflateRaw` method and returns the compressed data as a Base64-encoded string.

- `str` (string): The string to be compressed.
- `cb` (function): The callback function that will be called with the compressed data or an error.

### unzip(str, cb)

This function decompresses a Base64-encoded string using `zlib`'s `inflateRaw` method and returns the decompressed data as a string.

- `str` (string): The Base64-encoded string to be decompressed.
- `cb` (function): The callback function that will be called with the decompressed data or an error.

### ajax(method, href, params, opt, cb, userData)

This function sends an HTTP request to the specified URL with the given parameters and options.

- `method` (string): The HTTP method to be used (`get`, `post`, `put`, `delete`, `patch`).
- `href` (string): The URL path.
- `params` (object or array): The parameters to be sent with the request. If it is an array, the objects will be merged, and overlapping keys will be overridden by the later object.
- `opt` (object, optional): Additional options for the HTTP request. See the [Node.js documentation](https://nodejs.org/api/http.html#http_http_request_options_callback) for available options.
- `cb` (function): The callback function that will be called with the response or an error.
- `userData` (object, optional): Optional user data that will be passed to the callback function.

### env(obj)

This function sets environment variables based on the provided object.

- `obj` (object): An object containing key-value pairs representing environment variable names and their corresponding values.

## Example

Here's an example of how to use this module:

```javascript
const pu = require('picos-utils')

pu.zip('Hello, World!', (err, compressedData) => {
  if (err) {
    console.error('Compression error:', err)
    return
  }

  console.log('Compressed data:', compressedData)

  pu.unzip(compressedData, (err, decompressedData) => {
    if (err) {
      console.error('Decompression error:', err)
      return
    }

    console.log('Decompressed data:', decompressedData)
  })
})

pu.ajax('get', 'https://api.example.com/users', null, {}, (err, state, resBody, res, userData) => {
	if (4 === state) return // support response streaming
  if (err) {
    console.error('Request error:', err)
    return
  }

  console.log('Response body:', resBody)
})
```

Note: Make sure to replace `'https://api.example.com/users'` with the actual API endpoint you want to request.

## License

This module is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
