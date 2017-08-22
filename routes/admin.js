var express = require('express');
var router = express.Router();
var upload = require('jquery-file-upload-middleware');
var path = require('path');
var fs = require("fs");
var merge = require('merge')

var BASE_UPLOAD_DIR = '/public/upload/messages/';
var BASE_UPLOAD_URL = '/upload/messages/';

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var generateId = function(length) {
  var rtn = '';
  for (var i = 0; i < length; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

upload.on('end', function (fileInfo, req, res) {
	req.session.message = req.session.message || {};
	
	if(req.uploadedFileType == "video"){
		req.session.message.video = {
				title: fileInfo.originalName.split(".")[0],
				filename: fileInfo.originalName,
				url: fileInfo.url
		}
	}else if(req.uploadedFileType == "summary-ppt"){
    	req.session.message.summary = req.session.message.summary || {type: "ppt"};
    	var summary = req.session.message.summary;
    	summary.ppt = fileInfo;
	}else if(req.uploadedFileType == "audio"){
		req.session.message = req.session.message || {};
		req.session.message.audio = {
				title: fileInfo.originalName.split(".")[0],
				filename: fileInfo.originalName,
				url: fileInfo.url
		}
	}else if(req.uploadedFileType == "summary-images"){
    	req.session.message.summary = req.session.message.summary || {type: "image"};
    	var summary = req.session.message.summary;
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
	if(req.params.id.length == 8){
		couchdb.get(req.params.id, {
			revs_info : true
		}, function(err, body) {
			res.render('admin/messages/message-detail',{ message: body, host:req.headers.host});
		});
	}else{
		next();
	}
});

router.post('/messages/:messageId/videos', function (req, res, next) {
	req.uploadedFileType = "video";
	upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
            return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);
    
});

router.post('/messages/:messageId/audios', function (req, res, next) {
	req.uploadedFileType = "audio";
	upload.fileHandler({
		uploadDir: function () {
			return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
		},
		uploadUrl: function () {
			return  BASE_UPLOAD_URL + "/" + req.params.messageId;
		}
	})(req, res, next);
	
});

router.post('/messages/:messageId/summary-ppts', function (req, res, next) {
	req.uploadedFileType = "summary-ppt";
    upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
        	return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);

});

router.post('/messages/:messageId/summary-images', function (req, res, next) {
	req.uploadedFileType = "summary-images";
    upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
        	return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);

});

router.delete('/messages/:messageId/videos/:filename', function (req, res, next) {
	fs.unlinkSync(path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.filename));
	res.status(200).end();
});

router.get('/messages/create', function(req, res, next) {
	req.session.message = req.session.message || {id:(new Date()).getTime()};
	res.render('admin/messages/message-create', {messageId:req.session.message.id});
});

router.post('/messages/create', function(req, res, next) {
	req.body.table = 'message';
	req.body.createdDate = Date.parse(new Date());
	req.body.modifiedDate= Date.parse(new Date());
	
	couchdb.insert(merge(req.body, req.session.message,{table:"message", _id:generateId(8)}));
	res.redirect('/admin/messages');
});

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "message", function(err, body) {
		if (!err) {
			var docs = [];
			body.rows.forEach(function(doc) {
				docs.push(doc.value);
			});
			res.render('admin/messages/messages', { messages: docs });
		}
	});	
});


module.exports = router;
