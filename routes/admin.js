var express = require('express');
var upload = require('../my_node_modules/jquery-file-upload-middleware');
var path = require('path');
var fs = require("fs");
var merge = require('merge');
var moment = require('moment');

var router = express.Router();

var baseUploadDir = path.join(CONF.baseUploadDir, 'messages');
var baseUploadUrl = path.join(CONF.baseUploadUrl, 'messages');

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var generateId = function(length) {
  var rtn = '';
  for (var i = 0; i < length; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

upload.on('end', function (fileInfo, req, res) {
	req.session.messagePart = req.session.messagePart || {};
	
	if(req.uploadedFileType == "video"){
		req.session.messagePart.video = {
				title: fileInfo.originalName.split(".")[0],
				filename: fileInfo.originalName,
				url: fileInfo.url
		}
	}else if(req.uploadedFileType == "summary-ppt"){
    	req.session.messagePart.summary = req.session.messagePart.summary || {type: "ppt"};
    	var summary = req.session.messagePart.summary;
    	summary.ppt = fileInfo;
	}else if(req.uploadedFileType == "audio"){
		req.session.messagePart = req.session.messagePart || {};
		req.session.messagePart.audio = {
				title: fileInfo.originalName.split(".")[0],
				filename: fileInfo.originalName,
				url: fileInfo.url
		}
	}else if(req.uploadedFileType == "summary-images"){
    	req.session.messagePart.summary = req.session.messagePart.summary || {type: "image"};
    	var summary = req.session.messagePart.summary;
    	summary.images = summary.images || [];
    	summary.imageNames = summary.imageNames || [];
    	if(summary.imageNames.indexOf(fileInfo.name) == -1){
    		summary.images.push(merge({},fileInfo));
    		summary.imageNames.push(fileInfo.name);
    	}
	}
});

router.use('/messages*', function(req, res, next) {
	if(req.session.signedIn){
		next();
	}else{
		res.redirect('/sign-in?redirectUrl='+encodeURI(req.originalUrl));
	}
});

router.use('/messages/create*', function(req, res, next) {
	if(req.session.signedIn.role == 'shipin'){
		next();
	}else{
		res.redirect('/admin/messages');
	}
});

router.get('/messages/:id', function(req, res, next) {
	var messageId = req.params.id;
	if(messageId.length == 8){
		couchdb.get(messageId, {
			revs_info : true
		}, function(err, messageBody) {
			couchdb.view("message_parts", "by_message_id", {keys:[messageId]}, function(err, body) {
				if (!err) {
					var messageParts = [];
					body.rows.forEach(function(doc) {
						doc.value.uploaded = true;
						messageParts.push(doc.value);
					});
					for (var i = messageParts.length; i < messageBody.countOfParts; i++) {
						messageParts.push({
							uploaded: false
						});
					}
					
					res.render('admin/messages/message-detail', {
						message : messageBody,
						messageParts : messageParts
					});
				}
			});	
		});
	}else{
		next();
	}
});

router.get('/download/:messageId/:partNo/:fileName', function(req, res) {
	var file = path.join(baseUploadDir, req.params.messageId, req.params.partNo, req.params.fileName); 
	res.download(file, req.params.fileName);    
});

router.post('/messages/:messageId/parts/:partNo/videos', function (req, res, next) {
	req.uploadedFileType = "video";
	upload.fileHandler({
        uploadDir: function () {
            return path.join(baseUploadDir, req.params.messageId, req.params.partNo); 
        },
        uploadUrl: function () {
            return  path.join(baseUploadUrl, req.params.messageId, req.params.partNo);
        }
    })(req, res, next);
    
});

router.post('/messages/:messageId/parts/:partNo/audios', function (req, res, next) {
	req.uploadedFileType = "audio";
	upload.fileHandler({
		uploadDir: function () {
			return path.join(baseUploadDir, req.params.messageId, req.params.partNo); 
		},
		uploadUrl: function () {
            return path.join(baseUploadUrl, req.params.messageId, req.params.partNo);
        }
	})(req, res, next);
	
});

router.post('/messages/:messageId/parts/:partNo/summary-ppts', function (req, res, next) {
	req.uploadedFileType = "summary-ppt";
    upload.fileHandler({
        uploadDir: function () {
            return path.join(baseUploadDir, req.params.messageId, req.params.partNo); 
        },
        uploadUrl: function () {
            return path.join(baseUploadUrl, req.params.messageId, req.params.partNo);
        }
    })(req, res, next);

});

router.post('/messages/:messageId/parts/:partNo/summary-images', function (req, res, next) {
	req.uploadedFileType = "summary-images";
    upload.fileHandler({
        uploadDir: function () {
            return path.join(baseUploadDir, req.params.messageId, req.params.partNo); 
        },
        uploadUrl: function () {
            return  path.join(baseUploadUrl, req.params.messageId, req.params.partNo);
        }
    })(req, res, next);

});

router.get('/messages/new', function(req, res, next) {
	req.session.message = req.session.message || {id:(new Date()).getTime()};
	res.render('admin/messages/message-new', {messageId:req.session.message.id});
});

router.post('/messages', function(req, res, next) {
	req.body.createdDate = Date.parse(new Date());
	req.body.modifiedDate= Date.parse(new Date());
	
	var id = generateId(8);
	couchdb.insert(merge(req.body, {table:"message", _id:id}));
	res.redirect('/admin/messages/' + id);
});

router.post('/messages/:messageId/parts', function(req, res, next) {
	
	couchdb.insert(merge(req.body, req.session.messagePart, {
		_id: req.body.messageId + "_" + req.body.partNo,
		table: "message_part", 
		createdDate: Date.parse(new Date()),
		modifiedDate: Date.parse(new Date())
	}));
	
	req.session.messagePart = null;
	res.redirect('/admin/messages/' + req.body.messageId);
});

router.put('/messages/:messageId/parts/:partId', function(req, res, next) {
	couchdb.get(req.body.pk, {
		revs_info : true
	}, function(err, body) {
		body[req.body.name] = req.body.value;
		delete body['_revs_info'];
		couchdb.update(body, body._id, function(err, response) {
			log.info(req.session.signedIn.username + ' updated the '
					+ req.body.name + ' to "' + req.body.value
					+ '" for messagePart of id ' + req.params.partId);
			res.status(200).end();
		});
	});

	
});

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
		if (!err) {
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
				if (!err) {
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
					res.render('admin/messages/messages', { messages: docs });
				}
			});	
		
			
		}
	});	
});

router.get('/messages/:messageId/parts/:partNo', function(req, res, next) {
	var messageId = req.params.messageId;
	var partNo = req.params.partNo;
	res.render('admin/messages/message-part-new', { messageId: messageId, partNo:partNo });
});

module.exports = router;
