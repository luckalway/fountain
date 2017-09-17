var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var messageService = require('../services/message-service');

var baseUploadUrl = CONF.videoSourceUrl;

router.get('/messages', function(req, res, next) {
	messageService.getMessagesSortedById(function(err,body){
		if(!err){
			res.send(body);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id/videos', function(req, res, next) {
	messageService.getMessageVideos(req.params.id, function(err, body) {
		res.send(body);
		res.status(200).end();
	});
});

module.exports = router;