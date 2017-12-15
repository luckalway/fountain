var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var moment = require('moment');
var messageService = require('../services/message-service');

var baseUploadUrl = CONF.videoSourceUrl;

router.get('/messages', function(req, res, next) {
	messageService.getMessageWithoutParts(function(err,body){
		if(!err){
			var test = [];
			test.push(body[0]);
			res.send(test);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id/videos', function(req, res, next) {
	var partId = req.params.id;
	var messageId = partId.split('_')[0];
	messageService.getMessage(messageId, function(err, message) {
		if(err){
			return next(err);
		}

		var partNo = partId.split('_')[1];
		var messageParts = [];
		for (var i = 0; i < message.parts.length; i++) {
			var part = message.parts[i];
			var isBeforeToday = moment(part.publishDate, "YYYY-MM-DD").endOf('day').isBefore(new Date());
			var isBeforeOrSameCurrent = parseInt(partNo) >= parseInt(part.partNo);
			if(isBeforeToday || isBeforeOrSameCurrent){
				if(part.audio && part.audio.url){
					part.audio.url = baseUploadUrl + part.audio.url;
				}
				if(part.video && part.video.url){
					part.video.url = baseUploadUrl + part.video.url;
				}
				messageParts.push(part);
			}
		}

		delete message.parts;
		res.send({
			message:message,
			parts:messageParts
		});
		res.status(200).end();
	});
});

module.exports = router;
