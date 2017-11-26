var express = require('express');
var moment = require('moment');

var router = express.Router();

router.get('messages', function(req, res, next) {

});

router.get('/messages/:resourceId/video', function(req, res, next) {
	var resourceId = req.params.resourceId;
	var messageId;
	if(/\w{8}_\d{1,2}/.test(resourceId)){
		messageId = resourceId.split("_")[0]
	} else {
		messageId = resourceId;
	}

	couchdb.view("messages", "by_message_id", {
		startkey:[messageId],
		endkey:[messageId, {}]
	}, function(err, body) {
		if (!err) {
			var messageBody, currentPart;
			var allMessageParts = [];

			body.rows.forEach(function(doc) {
				if(doc.value.table == 'message_part'){
					var part = doc.value;
					allMessageParts.push(part);
				}else if(doc.value.table == 'message'){
					messageBody = doc.value;
					messageBody['scripture'] = messageBody.scripture.replace(/[\r\n]+/g, "<br/>");
				}
				if(doc.value._id == resourceId){
					currentPart = doc.value;
				}
			});

			var displayedMessageParts = [];
			for(var i=0;i<allMessageParts.length;i++){
				var isBeforeToday = moment(allMessageParts[i].publishDate, "YYYY-MM-DD").endOf('day').isBefore(new Date());
				var isBeforeOrSameCurrent = parseInt(currentPart.partNo) >= parseInt(allMessageParts[i].partNo);
				if(isBeforeToday || isBeforeOrSameCurrent){
					displayedMessageParts.push(allMessageParts[i]);
				}
			}

			var viewTemplate = 'message-video';
			if(messageBody.title.trim().startsWith('【讲台】')){
				viewTemplate = 'message-video-jiangtai';
			}

			res.render(viewTemplate, {
				message : messageBody,
				summary: getSummary(displayedMessageParts),
				currentPart: currentPart,
				messageParts : displayedMessageParts
			});
		}
	});

	function getSummary(messageParts){
		var summary = {};
		messageParts.forEach(function(part){
			if(!summary['type']){
				if(!part.summary.type){
					summary.type = 'text';
					summary.texts = [];
					summary.texts.push(part.summary);
				}else if(part.summary.type == 'image'){
					summary.images = [];
					summary.images.push(part.summary.imageNames);
				}
			}else if(summary['type'] == 'image'){
				summary.images.push(part.summary.imageNames);
			}else if(summary['type'] == 'text'){
				summary.texts.push(part.summary);
			}
		});
		console.log(summary);
		return summary;
	}

});

module.exports = router;
