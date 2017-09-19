var moment = require('moment');
var merge = require('merge');

exports.getMessageWithoutParts = function(callback){
	couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
		if(err){
			callback(err);
			return;
		}

		var docs = [];
		body.rows.forEach(function(doc) {
			docs.push(doc.value);
		});
		callback(null, docs);
	});
}

exports.getMessages = function(callback){
	couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
		if(err){
			callback(err);
			return;
		}
		var docsMap = {};
		var messageIds = [];
		body.rows.forEach(function(doc) {
			doc.value.createdDate = moment(doc.value.createdDate).format('YYYY-MM-DD');
			docsMap[doc.value._id] = doc.value;
			messageIds.push(doc.value._id);
			docsMap[doc.value._id]['countOfUploaded'] = 0;
			docsMap[doc.value._id]['publishDates'] = [];
		});

		couchdb.view("message_parts", "by_message_id", {keys:messageIds}, function(err, body) {
			if(err){
				callback(err);
				return;
			}

			var messageParts = [];
			body.rows.forEach(function(doc) {
				docsMap[doc.value.messageId]['countOfUploaded']++;
				docsMap[doc.value.messageId]['publishDates'].push(doc.value.publishDate);
			});

			var docs = [];
			for(var key in docsMap){
				docsMap[key]['publishDates'] = docsMap[key]['publishDates'].sort();
				docs.push(docsMap[key]);
			}
			callback(null, docs);
		});
	});

}

exports.getMessage = function (messageId, callback) {
	couchdb.get(messageId, {
		revs_info : true
	}, function(err, messageBody) {
		if(err){
			callback(err);
			return;
		}

		couchdb.view("message_parts", "by_message_id", {keys:[messageId]}, function(err, body) {
			if(err){
				callback(err);
				return;
			}

			messageBody.parts = [];
			body.rows.forEach(function(doc) {
				doc.value.uploaded = true;
				messageBody.parts.push(doc.value);
			});
			for (var i = messageBody.parts.length; i < messageBody.countOfParts; i++) {
				messageBody.parts.push({
					uploaded: false
				});
			}
			callback(null, messageBody);
		});
	});
}

exports.getMessageVideos = function(resourceId , callback){
	var messageId;
	if(/\w{8}_\d{1,2}/.test(resourceId)){
		messageId = resourceId.split("_")[0]
	} else {
		messageId = resourceId;
	}

	couchdb.view("messages", "by_message_id", {
		startkey : [ messageId ],
		endkey : [ messageId, {} ]
	}, function(err, body) {
		if(err){
			callback(err);
			return;
		}

		var messageBody, currentPart;
		var allMessageParts = [];
		body.rows.forEach(function(doc) {
			if(doc.value.table == 'message_part'){
				var isBeforeToday = moment(doc.value.publishDate, "YYYY-MM-DD").isBefore(moment().add(1, 'days'),'day');
				console.log(moment(doc.value.publishDate, "YYYY-MM-DD"),moment().add(1, 'days'))
				if(isBeforeToday)
					allMessageParts.push(doc.value);
			} else if (doc.value.table == 'message'){
				messageBody = doc.value;
			}
		});

		callback(null, {
			message : messageBody,
			currentPart: currentPart,
			messageParts : allMessageParts
		});
	});

}

exports.createMessage = function(message, callback){
	message.createdDate = Date.parse(new Date());
	message.modifiedDate= Date.parse(new Date());

	var id = generateId(8);
	couchdb.insert(merge(message, {table:"message", _id:id}), callback);
}

exports.createMessagePart = function(part, callback){
	couchdb.insert(merge(part, {
		_id: req.body.messageId + "_" + req.body.partNo,
		table: "message_part",
		createdDate: Date.parse(new Date()),
		modifiedDate: Date.parse(new Date())
	}), callback);
}

exports.partiallyUpdateMessage = function(id, nameValues, callback){
	couchdb.get(id, {
		revs_info : true
	}, function(err, body) {
		for(var name in nameValues){
			body[name] = nameValues[name];
		}
		delete body['_revs_info'];
		couchdb.update(body, body._id, callback);
	});


}
