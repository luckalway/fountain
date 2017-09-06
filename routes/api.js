var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");

var baseUploadUrl = CONF.videoSourceUrl;

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "by_message_id", function(err, body) {
		if (!err) {
			var docs = [];
			body.rows.forEach(function(doc) {
				docs.push(doc.value);
			});
			res.send(docs);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id/videos', function(req, res, next) {
	couchdb.view("messages", "by_message_id", {
		startkey : [ req.params.id ],
		endkey : [ req.params.id, {} ]
	}, function(err, body) {
		if (!err) {
			if (body.rows.length == 0) {
				res.send([]);
				res.status(200).end();
			}

			var message = body.rows[0].value;
			var messageVideos = [];
			for (var i = 1; i < body.rows.length; i++) {
				var part = body.rows[i].value;
				messageVideos.push({
					id :  part._id,
					videoUrl : baseUploadUrl + part.video.url,
					title : message.title + '(' + part.partNo + '/'
							+ message.countOfParts + ')',
					date:message.date
				});
			}

			res.send(messageVideos);
			res.status(200).end();
		}
	});
});

module.exports = router;