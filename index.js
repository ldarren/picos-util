const zlib = require('zlib')
const http = require('http')
const https = require('https')
const fs = require('fs')
const url = require('url')
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

	// params can be an object or an array of objects
	// if it is an array, objects will be merged, overlapped key will be overrided by later object
	ajax:function callee(method, href, params, opt, cb, userData){
		cb = cb || ((err)=>{
			if (err) console.error(method, href, params, opt, userData, err)
		})
		if (!href) return cb('url not defined')
		opt=opt||{}

		const urlobj = url.parse(href)
		let protocol = opt

		if (!protocol.request){
			switch(urlobj.protocol){
			case 'http:': protocol=http; break
			case 'https:': protocol=https; break
			default:
				if (opt.socketPath){
					protocol=http
					urlobj.protocol = 'http:'
					urlobj.socketPath = opt.socketPath
					break
				}
				fs.readFile(href, 'utf8', (err, data)=>{
					cb(err, 4, data, userData)
				}); return
			}
		}

		const isGet = 'GET' === (urlobj.method = method.toUpperCase())
		let body = Array.isArray(params) ? pObj.extends({}, params, extendOpt) : params || {}
		let query

		if (isGet){
			query = qs.stringify(pObj.extends({}, [body, opt.query || {}], extendOpt))
			urlobj.path += query ? '?' + query : ''
			urlobj.headers = opt.headers||{}
		}else{
			query = qs.stringify(opt.query || {})
			urlobj.path += query ? '?' + query : ''
			urlobj.headers = Object.assign({
				'Content-Type': 'application/x-www-form-urlencoded'
			},opt.headers||{})
			switch(urlobj.headers['Content-Type']){
			case 'application/json': body = JSON.stringify(body); break
			case 'plain/text': body = body.toString(); break
			default: body = qs.stringify(body); break
			}
		}

		const req = protocol.request(urlobj, res => {
			const st=res.statusCode
			const loc=res.headers.location
			if (st>=300 && st<400 && loc) return callee(method,loc,params,opt,cb,userData)
			res.setEncoding('utf8')
			const err=(300>st || !st) ? null : {error:res.statusMessage,code:st,params:arguments}
			cb(err, 2, null, userData)
			let data = ''
			res.on('data', (chunk)=>{
				data += chunk
				cb(err, 3, data, userData)
			})
			res.on('end', ()=>{
				cb(err, 4, data, userData)
			})
		})

		req.setTimeout(opt.timeout||0, err => {
			cb({error:err.message,code:599,src:err,params:arguments}, 4, null, userData)
		})
		req.on('error', err => {
			cb({error:err.message,code:500,src:err,params:arguments}, 4, null, userData)
		})

		if (isGet) req.end()
		else req.end(body)
		return req
	}
}
