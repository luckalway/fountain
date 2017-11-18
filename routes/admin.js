var express = require('express');
var upload = require('../my_node_modules/jquery-file-upload-middleware');
var path = require('path');
var fs = require("fs");
var merge = require('merge');
var messageService = require('../services/message-service');
var commonService = require('../services/common-service');
var jimp = require("jimp");

var router = express.Router();

var baseUploadDir = path.join(CONF.baseUploadDir, 'messages');
var baseUploadUrl = path.join(CONF.baseUploadUrl, 'messages');

upload.on('end', function (fileInfo, req, res) {
	req.session.messagePart = req.session.messagePart || {};

	if(req.uploadedFileType == "multi-media"){
		var simpleFile = {
			title: fileInfo.originalName.split(".")[0],
			filename: fileInfo.originalName,
			url: fileInfo.url
		}
		if(fileInfo.name.endsWith('mp4')){
			req.session.messagePart.video = simpleFile;
		}else if(fileInfo.name.endsWith('mp3')){
			req.session.messagePart.audio = simpleFile;
		}
	}else if(req.uploadedFileType == "summary-ppt"){
		req.session.messagePart.summary = req.session.messagePart.summary || {type: "ppt"};
		var summary = req.session.messagePart.summary;
		summary.ppt = fileInfo;
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

router.use('/*', function(req, res, next) {
	if(req.session.signedIn){
		next();
	}else{
		res.redirect('/sign-in?redirectUrl='+encodeURI(req.originalUrl));
	}
});

router.put('/doc/:docId', function(req, res, next) {
	var nameValues = {};
	nameValues[req.body.name] = req.body.value;
	commonService.partiallyUpdate(req.body.pk, nameValues, function(error, body) {
		log.info(req.session.signedIn.username + ' updated the '
		+ req.body.name + ' to "' + req.body.value
		+ '" for document of id ' + req.body.pk);
		res.status(200).end();
	});
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
		messageService.getMessage(messageId,function(err, message){
			if(err){
				next(err);
				return;
			}


			path.join(baseUploadDir, message._id,'video_cover.png');

			var weixinCoverStat = fs.statSync(path.join(baseUploadDir, message._id,'weixin_cover.png'));
			var videoCoverStat = fs.statSync(path.join(baseUploadDir, message._id,'video_cover.png'));
			if(weixinCoverStat.isFile()&&videoCoverStat.isFile()){
					message.coverUploaded = true;
			}

			for (var i = message.parts.length; i < message.countOfParts; i++) {
				message.parts.push({
					uploaded: false
				});
			}

			res.render('admin/messages/message-detail', {
				message : message,
				messageParts : message.parts
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

router.post('/messages/:messageId/cover', function (req, res, next) {
	req.uploadedFileType = "cover";
	upload.fileHandler({
		uploadDir: function () {
			return path.join(baseUploadDir, req.params.messageId);
		},
		uploadUrl: function () {
			return  path.join(baseUploadUrl, req.params.messageId);
		}
	})(req, res, next);
});

router.post('/messages/:messageId/parts/:partNo/multi-media', function (req, res, next) {
	req.uploadedFileType = "multi-media";
	upload.fileHandler({
		uploadDir: function () {
			return path.join(baseUploadDir, req.params.messageId, req.params.partNo);
		},
		uploadUrl: function () {
			return  path.join(baseUploadUrl, req.params.messageId, req.params.partNo);
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

router.get('/messages/delete', function(req, res, next) {
	req.session.message = req.session.message || {id:(new Date()).getTime()};
	res.render('admin/messages/message-delete', {messageId:req.session.message.id});
});

router.delete('/messages/:id', function(req, res, next) {
	var id = req.params.id.substring(3);
	messageService.removeMessage(id,function(err, body){
		if(err){
			res.send(err.error);
			res.status(200).end();
		}else{
			res.send('success');
			res.status(200).end();
		}
	});
});

router.post('/messages', function(req, res, next) {
	messageService.createMessage(req.body, function(err, id) {
		if(!err){
			res.redirect('/admin/messages/' + id);
		}
	});
});


router.post('/messages/:messageId/parts', function(req, res, next) {
	console.log(merge(req.body, req.session.messagePart));
	messageService.createMessagePart(merge(req.body, req.session.messagePart),function(err){
		if(!err){
			req.session.messagePart = null;
			res.redirect('/admin/messages/' + req.body.messageId);
		}
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

router.post('/messages/:messageId/covers', function(req, res){
	var bufferImages = [{
		type:'video',
		data: Buffer.from(req.body.videoCover, "base64")},
		{
			type:'weixin',
			data:Buffer.from(req.body.weixinCover, "base64")
		}];
		var i=0;
		bufferImages.map(function(bufferImage){
			jimp.read(bufferImage.data, function (err, image) {
				if (err) {
					log.error('Occured error while prasing image, '+err);
					res.send('error');
					res.status(200).end();
					return;
				}

				if(bufferImage.type == 'weixin'){
					image.resize(1080, jimp.AUTO).write(path.join(baseUploadDir, req.params.messageId,'weixin_cover.png'));
				}else{
					image.resize(100, jimp.AUTO).write(path.join(baseUploadDir, req.params.messageId,'video_cover.png'));
				}
			});
		});
		res.send('success');
		res.status(200).end();
	});

	module.exports = router;
