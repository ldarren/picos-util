const fs = require('fs')
const pico = require('pico-common/bin/pico-cli')
const {test} = pico.export('pico/test')
const util = require('./index')

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
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.args.i)
	})
})
test('ensure ajax post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.form.i)
	})
})
test('ensure ajax json post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, {headers:{'Content-Type': 'application/json'}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.json.i)
	})
})
test('ensure ajax get ip', function(cb){
	util.ajax('get', 'https://httpbin.org/ip', null, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, obj.origin)
	})
})
test('ensure ajax unix socket', function(cb){
	const http = require('http')
	const socketPath = '/tmp/picos-util-test'
	const path = '/echo'

	fs.unlinkSync(socketPath)
	const server = http.createServer( (req, res) => {
		res.writeHead(200, {'Content-Type': 'text/plain'})
		res.end(req.url)
	});
	server.listen(socketPath, () => {
		util.ajax('get', path, null, {socketPath, path}, (err,code,res)=>{
			if (4!==code) return
			if (err) return cb(err)
			cb(null, '/echo' === res)
		})
	})
})
