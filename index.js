const zlib = require('zlib')
const http = require('http')
const https = require('https')
const fs = require('fs')
const qs = require('querystring')
const pObj = require('pico-common').export('pico/obj')

const extendOpt = {tidy:1, mergeArr:1}

module.exports = {

	zip(str, cb){
		if (!str || !str.charAt) return cb(`zip err: no payload: ${typeof str}`)
		zlib.deflateRaw(str, (err, buf)=>{
			cb(err, err || buf.toString('base64'))
		})
	},

	unzip(str, cb){
		if (!str || !str.charAt) return cb(`unzip err: no payload: ${typeof str}`)
		zlib.inflateRaw(Buffer.from(str, 'base64'), (err, buf)=>{
			cb(err, err || buf.toString())
		})
	},

	/**
	 * params can be an object or an array of objects
	 * if it is an array, objects will be merged, overlapped key will be overrided by later object
	 *
	 * @param {string} method - get/post/put/delete/patch
	 * @param {string} href - path,
	 * @param {object|Array} [params] - null/parameters (optional),
	 * @param {object} [opt={}] - see https://nodejs.org/api/http.html#http_http_request_options_callback
	 * @param {object} [opt.query] - query string to be included regardless of request method
	 * @param {Function} [opt.request] - alternative http request function
	 * @param {string} [opt.socketPath] - unix domain socket path
	 * @param {number} [opt.ttl] - after connected request timeout, for before connected timeout, see options
	 * @param {Function} cb - callback(err, state, resBody, res, userData),
	 * @param {object} [userData] - optional user data
	 *
	 * returns {void} - undefined
	 */
	ajax:function callee(method, href, params, opt, cb, userData){
		cb = cb || ((err)=>{
			if (err) console.error(method, href, params, opt, userData, err)
		})
		if (!href) return cb('href not defined', 4, null, null, userData)
		const options = Object.assign({
			method: method.toUpperCase(),
			headers: {},
			redirect: 1
		}, opt || {})

		let urlobj = {}
		if (options.socketPath){
			options.path = href
		}else{
			try{
				urlobj = new URL(href)
			} catch(ex){
				fs.readFile(href, 'utf8', (err, data)=>{
					cb(err, 4, data, null, userData)
				})
				return
			}
		}
		let protocol = options

		if (!options.request){
			switch(urlobj.protocol){
			case 'http:': protocol=http; break
			case 'https:': protocol=https; break
			default:
				if (!options.socketPath) return cb('unsupported protocol: ' + urlobj.protocol, 4, null, null, userData)
				protocol=http
				break
			}
		}

		const isGet = 'GET' === options.method
		let body = Array.isArray(params) ? pObj.extends({}, params, extendOpt) : params || {}
		let sep = null != urlobj.search && -1=== urlobj.search.indexOf('?')?'?':'&'
		let query

		if (options.socketPath){
			query = qs.stringify(pObj.extends({}, [body, options.query || {}], extendOpt))
			options.path += query ? sep + query : ''
		}else if (isGet){
			query = qs.stringify(pObj.extends({}, [body, options.query || {}], extendOpt))
			urlobj.search += query ? sep + query : ''
		}else{
			query = qs.stringify(options.query || {})
			urlobj.search += query ? sep + query : ''
			options.headers = Object.assign({
				'Content-Type': 'application/x-www-form-urlencoded'
			},options.headers||{})
			switch(options.headers['Content-Type']){
			case 'application/json': body = JSON.stringify(body); break
			case 'plain/text': body = body.toString(); break
			default: body = qs.stringify(body); break
			}
		}

		const handler = res => {
			const st=res.statusCode
			const loc=res.headers.location
			if (st>=300 && st<400 && options.redirect && loc) return callee(method,loc,params,opt,cb,userData)
			res.setEncoding('utf8')
			const err=(399>st || !st) ? null : {error:res.statusMessage,code:st,params:arguments}
			cb(err, 2, null, res, userData)
			let data = ''
			res.on('data', (chunk)=>{
				data += chunk
				cb(err, 3, data, res, userData)
			})
			res.on('end', ()=>{
				cb(err, 4, data, res, userData)
			})
		}
		const req = options.socketPath ? protocol.request(options, handler) : protocol.request(urlobj, options, handler)

		req.setTimeout(options.ttl||0, err => {
			cb({error:err.message,code:599,src:err,params:arguments}, 4, null, null, userData)
		})
		req.on('error', err => {
			cb({error:err.message,code:500,src:err,params:arguments}, 4, null, null, userData)
		})

		if (isGet) req.end()
		else req.end(body)
		return req
	},

	env(obj){
		const keys = Object.keys(obj)
		const env = process.env
		for (let i = 0, l = keys.length, k; i < l; i++){
			k = keys[i]
			env[k] = String(obj[k])
		}
	}
}
