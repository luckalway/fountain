var express = require('express');
var router = express.Router();
var path = require('path');

module.exports = router;


router.get('/', function(req, res, next) {
	res.send(req.query.echostr);
	res.status(200).end();
});

router.get('/download/*', function(req, res) {

	var url = req.originalUrl.replace('/data','')
	var downloadPath = path.join(CONF.baseUploadDir, url.replace('download',''));
	res.download(decodeURIComponent(downloadPath), decodeURIComponent(path.basename(downloadPath)));
});
