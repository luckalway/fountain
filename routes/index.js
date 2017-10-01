var express = require('express');
var router = express.Router();

module.exports = router;


router.get('/', function(req, res, next) {
	res.send(req.query.echostr);
	res.status(200).end();
});