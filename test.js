const
pico=require('pico-common/bin/pico-cli'),
ensure= pico.export('pico/test').ensure,
util=require('./index')

ensure('ensure unzip the zip', function(cb){
	const secret='helloworld'
	util.zip(secret, (err,z)=>{
		if (err) return cb(err)
		util.unzip(z, (err, msg)=>{
			if (err) return cb(err)
			cb(null, secret === msg)
		})
	})
})
ensure('ensure ajax get work', function(cb){
	util.ajax('get', 'https://httpbin.org/get', {i:1}, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.args.i)
	})
})
ensure('ensure ajax post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.form.i)
	})
})
ensure('ensure ajax json post work', function(cb){
	util.ajax('post', 'https://httpbin.org/post', {i:1}, {headers:{'Content-Type': 'application/json'}}, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, 1==obj.json.i)
	})
})
ensure('ensure ajax get ip', function(cb){
	util.ajax('get', 'https://httpbin.org/ip', null, null, (err,code,res)=>{
		if (4!==code) return
		if (err) return cb(err)
		try{var obj=JSON.parse(res)}
		catch(e){cb(e)}
		cb(null, obj.origin)
	})
})
