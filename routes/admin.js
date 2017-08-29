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
		console.log(fileInfo);
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
						console.log(doc.value);
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

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
		if (!err) {
			var docs = [];
			body.rows.forEach(function(doc) {
				doc.value.createdDate = moment(doc.value.createdDate).format('YYYY-MM-DD');
				docs.push(doc.value);
			});
			res.render('admin/messages/messages', { messages: docs });
		}
	});	
});

router.get('/messages/:messageId/parts/:partNo', function(req, res, next) {
	var messageId = req.params.messageId;
	var partNo = req.params.partNo;
	res.render('admin/messages/message-part-new', { messageId: messageId, partNo:partNo });
});

module.exports = router;
