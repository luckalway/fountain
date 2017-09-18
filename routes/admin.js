var express = require('express');
var upload = require('../my_node_modules/jquery-file-upload-middleware');
var path = require('path');
var messageService = require('../services/message-service');
var fs = require("fs");


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
			messageService.getMessage(messageId,function(error, body){
				res.render('admin/messages/message-detail', {
					message : body,
					messageParts : body.parts
				});
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
	messageService.createMessage(req.body,function(){
		res.redirect('/admin/messages/' + id);
	});
});

router.post('/messages/:messageId/parts', function(req, res, next) {
	messageService.createMessagePart(merge(req.body, req.session.messagePart),function(err){
		if(!err){
			req.session.messagePart = null;
			res.redirect('/admin/messages/' + req.body.messageId);
		}
	});
});

router.put('/messages/:messageId/parts/:partId', function(req, res, next) {
	var fieldName = req.body.name;
	messageService.partiallyUpdateMessage(req.body.pk, {
		fieldName : req.body.value
	}, function(error, body) {
		log.info(req.session.signedIn.username + ' updated the '
				+ req.body.name + ' to "' + req.body.value
				+ '" for messagePart of id ' + req.params.partId);
		res.status(200).end();
	});

});

router.get('/messages', function(req, res, next) {
	messageService.getMessages(function(err,body){
		res.render('admin/messages/messages', { messages: body });
	});
});

router.get('/messages/:messageId/parts/:partNo', function(req, res, next) {
	var messageId = req.params.messageId;
	var partNo = req.params.partNo;
	res.render('admin/messages/message-part-new', { messageId: messageId, partNo:partNo });
});

module.exports = router;
