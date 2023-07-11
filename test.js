const fs = require('fs')
const pico = require('pico-common/bin/pico-cli')
const {test} = pico.export('pico/test')
const util = require('./index')

const dummyCB = () => {}

function echo(urlobj, options, cb){
	cb({headers: {}, setEncoding: dummyCB, on: dummyCB, statusCode: 400, statusMessage: urlobj})
	return {
		setTimeout: dummyCB,
		on: dummyCB,
		end: dummyCB
	}
}
test('ensure unzip the zip', function(cb){
	const secret='helloworld'
	util.zip(secret, (err,z)=>{
		if (err) return cb(err)
		util.unzip(z, (err, msg)=>{
			if (err) return cb(err)
			cb(null, secret === msg)
		})
	})
})
test('ensure ajax get work', function(cb){
	util.ajax('get', 'https://httpbin.org/get', {i:1}, null, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, '1' === obj.args.i)
	})
})
test('ensure ajax post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, null, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, '1' === obj.form.i)
	})
})
test('ensure ajax json post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, {headers:{'Content-Type': 'application/json'}}, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, 1 === obj.json.i)
	})
})
test('ensure ajax get ip', function(cb){
	util.ajax('get', 'https://httpbin.org/ip', null, null, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, obj.origin)
	})
})
test('ensure ajax unix socket', function(cb){
	const http = require('http')
	const socketPath = '/tmp/picos-util-socket'
	const path = '/echo'

	const server = http.createServer( (req, res) => {
		res.writeHead(200, {'Content-Type': 'text/plain'})
		res.end(req.url)
	})
	try{
		fs.unlinkSync(socketPath)
	} catch(ex) {
		console.error(ex)
	}
	server.listen(socketPath, () => {
		util.ajax('get', path, null, {socketPath}, (err,code,body)=>{
			if (4!==code) return
			if (err) return cb(err)
			server.close(() => {
				cb(null, 0 === body.indexOf('/echo'))
			})
		})
	})
})
test('ensure get ajax doesnt add tailing ?', function(cb){
	util.ajax('get', 'https://httpbin.org/anything', {}, {request: echo}, ({error: urlobj})=>{
		cb(null, '?' !== urlobj.search.charAt(urlobj.search.length - 1))
	})
})
test('ensure post ajax doesnt add tailing ?', function(cb){
	util.ajax('post', 'https://httpbin.org/anything', {}, {request: echo}, ({error: urlobj})=>{
		cb(null, '?' !== urlobj.search.charAt(urlobj.search.length - 1))
	})
})
test('ensure ajax get with opt.query', function(cb){
	util.ajax('get', 'https://httpbin.org/anything', {q1:1}, {query: {q2:2}}, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, args.q1 === '1' && args.q2 === '2')
	})
})
test('ensure ajax post with opt.query', function(cb){
	util.ajax('post', 'https://httpbin.org/anything', {q1:1}, {query: {q2:2}}, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, !args.q1 && args.q2 === '2')
	})
})
test('ensure mixed query string works', function(cb){
	util.ajax('get', 'https://httpbin.org/anything?q1=1', {q2:2}, {query: {q3:3}}, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, args.q1 === '1' && args.q2 === '2' && args.q3 === '3')
	})
})
test('ensure no over encodeURLComponent', function(cb){
	util.ajax('get', 'https://httpbin.org/anything?<h1>=a,b', {'<h2>': 'idx,id'}, {query: {'<h3>':'1,2,3'}}, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(body)
		} catch(e){
			cb(e)
		}
		cb(null, args['<h1>'] === 'a,b' && args['<h2>'] === 'idx,id' && args['<h3>'] === '1,2,3')
	})
})
test('ensure error object is safe to stringify', function(cb){
	util.ajax('get', 'https://httpbin.org/status/400', null, null, (err,code,body)=>{
		if (4!==code) return
		if (!err) return cb(null, false)
		try{
			var json=JSON.stringify(err)
		} catch(e){
			return cb(e)
		}
		cb(null, null != json.charAt)
	})
})
test('ensure local files are handled', function(cb){
	util.ajax('get', './test.js', null, null, (err,code,body)=>{
		if (4!==code) return
		if (err) return cb(null, false)
		cb(null, !!body.length)
	})
})
test('ensure export to environment variable works', function(cb){
	const env = {
		mod_ps_str: ':hel.lo',
		mod_ps_b: false,
		mod_ps_n: 3.142,
		mod_ps_a: [1,2,3],
		mod_ps_null: null
	}
	util.env(env)
	if (process.env.mod_ps_str !== String(env.mod_ps_str)) return cb(null, false)
	if (process.env.mod_ps_b !== String(env.mod_ps_b)) return cb(null, false)
	if (process.env.mod_ps_n !== String(env.mod_ps_n)) return cb(null, false)
	if (process.env.mod_ps_a !== String(env.mod_ps_a)) return cb(null, false)
	if (process.env.mod_ps_null !== String(env.mod_ps_null)) return cb(null, false)
	cb(null, true)
})
test('ensure redirect by default', function(cb){
	util.ajax('get', 'https://httpbin.org/redirect-to', {url: 'http://checkip.amazonaws.com',status_code: 302}, null, (err,code,body,res)=>{
		if (4!==code) return
		if (err) return cb(null, false. err)
		const ip = body.replace(/(\r\n|\n|\r)/gm, '')
		cb(null, 200 === res.statusCode && /^((\d\d?|1\d\d|2([0-4]\d|5[0-5]))\.){3}(\d\d?|1\d\d|2([0-4]\d|5[0-5]))$/.test(ip))
	})
})
test('ensure redirect can be turn off', function(cb){
	const reqBody = {url: 'http://checkip.amazonaws.com',status_code: 302}
	util.ajax('get', 'https://httpbin.org/redirect-to', reqBody, {redirect: 0}, (err,code,body,res)=>{
		if (4!==code) return
		if (err) return cb(err, false)
		cb(null, reqBody.status_code === res.statusCode && res.headers.location === reqBody.url)
	})
})
test('ensure userData returns in error', function(cb){
	util.ajax('get', '//httpbin.org/get', null, null, (err,code,body,res,userData)=>{
		if (4!==code) return
		if (!err) return cb(null, false)
		cb(null, 'UD' === userData)
	}, 'UD')
})
