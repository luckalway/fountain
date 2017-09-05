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
		startKey:[messageId],
		endKey:[messageId, {}]
	}, function(err, body) {
		if (!err) {
			var messageBody, currentPart;
			var allMessageParts = [];
			body.rows.forEach(function(doc) {
				if(doc.value.table == 'message_part'){
					allMessageParts.push(doc.value);
				}else if(doc.value.table == 'message'){
					messageBody = doc.value;
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
			
			res.render('message-video', {
				message : messageBody,
				currentPart: currentPart,
				messageParts : displayedMessageParts
			});
		}
	});	
	

});

module.exports = router;