var express = require('express');
var router = express.Router();
var captchapng = require('captchapng');

router.get('/', function(req, res, next) {
	res.render('sign-in', {
		error : '',
		redirectUrl : req.query.redirectUrl
	});
});

router.post('/', function(req, res, next) {
	var username = req.body.username;
	var pwd = req.body.password;
	var authCode = req.body.authCode;
	
	if(app.get('env') === 'production'){
		if (req.session['authCode'] != authCode) {
			res.render('sign-in', {
				error : '验证码输入有误.',
				redirectUrl: req.body.redirectUrl
			});
			return;
		}
	}
	
	if (accounts[username] && accounts[username].pwd == pwd) {
		req.session.signedIn = accounts[username];
		if (req.body.redirectUrl){
			res.redirect(decodeURI(req.body.redirectUrl));
		} else {
			res.redirect("/");
		}
	} else {
		res.render('sign-in', {
			error : '用户名或密码错误！请重新输入.',
			redirectUrl: req.body.redirectUrl
		});
	}
});

router.get('/captcha', function(req, res, next) {
	var authCode = parseInt(Math.random() * 9000 + 1000);
	var p = new captchapng(80, 30, authCode); 
	p.color(0, 0, 0, 0);
	p.color(80, 80, 80, 255);
	
	req.session['authCode'] = authCode;
	
	res.writeHead(200, {
		'Content-Type' : 'image/png'
	});
	res.end(new Buffer(p.getBase64(), 'base64'));
});

module.exports = router;
