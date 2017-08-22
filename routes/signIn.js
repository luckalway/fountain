var express = require('express');
var router = express.Router();
/**
const { createCanvas, loadImage } = require('canvas')
const canvas = createCanvas(200, 200)
const ctx = canvas.getContext('2d')
**/

var accounts = {
	'meigong' : {
		pwd : 'mgdpy@2017',
		role : 'meigong',
		name : '美工001'
	},
	'shipin' : {
		pwd : 'spdpy@2017',
		role : 'shipin',
		name : '视频001'
	}
}

router.get('/', function(req, res, next) {
	res.render('sign-in', {
		error : '',
		redirectUrl : req.query.redirectUrl
	});
});

router.post('/', function(req, res, next) {
	var username = req.body.username;
	var pwd = req.body.password;
	if (accounts[username] && accounts[username].pwd == pwd) {
		req.session.signedIn = accounts[username];
		res.redirect(decodeURI(req.body.redirectUrl));
	} else {
		res.render('sign-in', {
			error : '用户名或密码错误！请重新输入.'
		});
	}
});

router.get('/captcha', function(req, res, next) {
	// Write "Awesome!"
	ctx.font = '30px Impact'
	ctx.rotate(0.1)
	ctx.fillText('Awesome!', 50, 100)

	// Draw line under text
	var text = ctx.measureText('Awesome!')
	ctx.strokeStyle = 'rgba(0,0,0,0.5)'
	ctx.beginPath()
	ctx.lineTo(50, 102)
	ctx.lineTo(50 + text.width, 102)
	ctx.stroke();
	
	res.send(body);
	res.status(canvas.toDataURL()).end();
});

module.exports = router;
