var express = require('express');
var router = express.Router();
var upload = require('jquery-file-upload-middleware');
var path = require('path');
var fs = require("fs");
var merge = require('merge')

var BASE_UPLOAD_DIR = '/public/upload/messages/';
var BASE_UPLOAD_URL = '/upload/messages/';

router.get('/messages/pending-videos', function(req, res, next) {
	couchdb.view("message_videos", "message_video", function(err, body) {
		if (!err) {
			var docs = [];
			body.rows.forEach(function(doc) {
				docs.push(doc.value);
			});
			res.render('admin/messages/pending-videos', { message_videos: docs });
		}
	});	
});

router.delete('/messages/pending-videos/:id', function(req, res, next) {
	couchdb.get(req.params.id, {
		revs_info : true
	}, function(err, body) {
		fs.unlinkSync(path.join(ROOT_PATH, BASE_UPLOAD_DIR, body.filename));
		couchdb.destroy(body._id, body._rev, function(err, body) {
			  if (!err)
			    console.log(body);
		});
		res.status(200).end();
	});
});

router.get('/messages/videos/upload', function(req, res, next) {
  res.render('admin/messages/video-upload');
});

router.get('/messages/:id', function(req, res, next) {
	if(req.params.id.length == 32){
		couchdb.get(req.params.id, {
			revs_info : true
		}, function(err, body) {
			console.log(body);
			res.render('admin/messages/message-detail',{ message: body });
		});
	}else{
		next();
	}
});

router.post('/messages/:messageId/videos', function (req, res, next) {
    upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
            return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);
    
    upload.on('end', function (fileInfo, req, res) {
    	req.session.message = req.session.message || {};
    	req.session.message.video = {
			title: fileInfo.originalName.split(".")[0],
    		filename: fileInfo.originalName,
    		url: fileInfo.url
        }
    });

});

router.post('/messages/:messageId/summary-ppts', function (req, res, next) {
    upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
        	return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);
    
    upload.on('end', function (fileInfo, req, res) {
    	req.session.message = req.session.message || {};
    	req.session.message.summary = req.session.message.summary || {type: "ppt"};
    	var summary = req.session.message.summary;
    	summary.ppt = fileInfo;
    	
    	console.log(req.session.message.summary);
    });

});

router.post('/messages/:messageId/summary-images', function (req, res, next) {
    upload.fileHandler({
        uploadDir: function () {
            return path.join(ROOT_PATH, BASE_UPLOAD_DIR, req.params.messageId); 
        },
        uploadUrl: function () {
        	return  BASE_UPLOAD_URL + "/" + req.params.messageId;
        }
    })(req, res, next);
    
    upload.on('end', function (fileInfo, req, res) {
    	req.session.message = req.session.message || {};
    	req.session.message.summary = req.session.message.summary || {type: "image"};
    	var summary = req.session.message.summary;
    	summary.images = summary.images || [];
    	summary.imageNames = summary.imageNames || [];
    	if(summary.imageNames.indexOf(fileInfo.name) == -1){
    		summary.images.push(fileInfo);
    		summary.imageNames.push(fileInfo.name);
    	}
    });

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
	
	req.session.message.table = "message";
	console.log(merge(req.body,req.session.message));
	//couchdb.insert(merge(req.session.message,body));
	res.redirect('/admin/messages');
});

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "message", function(err, body) {
		console.log(err);
		if (!err) {
			var docs = [];
			body.rows.forEach(function(doc) {
				docs.push(doc.value);
			});
			res.render('admin/messages', { messages: docs });
		}
	});	
});


module.exports = router;
