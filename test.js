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
	util.ajax('get', 'https://httpbin.org/get', {i:1}, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, '1' === obj.args.i)
	})
})
test('ensure ajax post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, '1' === obj.form.i)
	})
})
test('ensure ajax json post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, {headers:{'Content-Type': 'application/json'}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, 1 === obj.json.i)
	})
})
test('ensure ajax get ip', function(cb){
	util.ajax('get', 'https://httpbin.org/ip', null, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var obj=JSON.parse(res)
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
		util.ajax('get', path, null, {socketPath}, (err,code,res)=>{
			if (4!==code) return
			if (err) return cb(err)
			server.close(() => {
				cb(null, 0 === res.indexOf('/echo'))
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
	util.ajax('get', 'https://httpbin.org/anything', {q1:1}, {query: {q2:2}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, args.q1 === '1' && args.q2 === '2')
	})
})
test('ensure ajax post with opt.query', function(cb){
	util.ajax('post', 'https://httpbin.org/anything', {q1:1}, {query: {q2:2}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, !args.q1 && args.q2 === '2')
	})
})
test('ensure mixed query string works', function(cb){
	util.ajax('get', 'https://httpbin.org/anything?q1=1', {q2:2}, {query: {q3:3}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, args.q1 === '1' && args.q2 === '2' && args.q3 === '3')
	})
})
test('ensure no over encodeURLComponent', function(cb){
	util.ajax('get', 'https://httpbin.org/anything?<h1>=a,b', {'<h2>': 'idx,id'}, {query: {'<h3>':'1,2,3'}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{
			var {args}=JSON.parse(res)
		} catch(e){
			cb(e)
		}
		cb(null, args['<h1>'] === 'a,b' && args['<h2>'] === 'idx,id' && args['<h3>'] === '1,2,3')
	})
})
test('ensure error object is safe to stringify', function(cb){
	util.ajax('get', 'https://httpbin.org/status/400', null, null, (err,code,res)=>{
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
	util.ajax('get', './test.js', null, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(null, false)
		cb(null, !!res.length)
	})
})
