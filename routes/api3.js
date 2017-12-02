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
			//res.send(body);
      res.send([]);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id/videos', function(req, res, next) {
	var partId = req.params.id;
	var messageId = partId.split('_')[0];
	messageService.getMessage(messageId, function(err, message) {
		var partNo = partId.split('_')[1];
		var messageParts = [];
		for (var i = 0; i < message.parts.length; i++) {
			var part = message.parts[i];
			var isBeforeToday = moment(part.publishDate, "YYYY-MM-DD").endOf('day').isBefore(new Date());
			var isBeforeOrSameCurrent = parseInt(partNo) >= parseInt(part.partNo);
			if(isBeforeToday || isBeforeOrSameCurrent){
				messageParts.push({
					id : part._id,
					videoUrl : baseUploadUrl + part.video.url,
					audioUrl: baseUploadUrl + part.audio.url,
					partNo: part.partNo,
					title : message.title + '(' + part.partNo + '/'
							+ message.countOfParts + ')',
					date : message.date || ""
				});
			}
		}

		message.summary = '<b>ddd</b>'
		res.send({
			message:message,
			parts:messageParts
		});
		res.status(200).end();
	});
});

module.exports = router;
