var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var messageService = require('../services/message-service');

var baseUploadUrl = CONF.videoSourceUrl;

router.get('/messages', function(req, res, next) {
	messageService.getMessageWithoutParts(function(err,body){
		if(!err){
			res.send(body);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id/videos', function(req, res, next) {
	messageService.getMessageVideos(req.params.id, function(err, body) {
		var messageVideos = [];
		var message = body.message;
		for (var i = 0; i < body.messageParts.length; i++) {
			var part = body.messageParts[i];
			messageVideos.push({
				id : part._id,
				videoUrl : baseUploadUrl + part.video.url,
				title : message.title + '(' + part.partNo + '/'
						+ message.countOfParts + ')',
				date : message.date || ""
			});
		}
		
		res.send(messageVideos);
		res.status(200).end();
	});
});

module.exports = router;