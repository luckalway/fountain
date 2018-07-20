var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var moment = require('moment');
const sermonService = require('../../../services/sermon-service');

router.get('/sermons', function(req, res, next) {
	sermonService.getSermons().then(function(sermons){
		res.send(sermons);
		res.status(200).end();
	},function(err){
		next(err);
	});
});

router.get('/sermons/:id', function(req, res, next) {
	sermonService.getSermon(req.params.id).then(function(sermon){
		if(req.query.partId){
			let newSermonParts = [];
			let partNo = req.query.partId.replace(req.params.id+'_', '');
			if(isNaN(partNo)){
				res.send([]);
				res.status(200).end();
				return;
			}
			for(let part of sermon.parts){
				let isBeforeToday = moment(part.publishDate, "YYYY-MM-DD").endOf('day').isBefore(new Date());
				let isBeforeOrSameCurrent = parseInt(partNo) >= parseInt(part.partNo);
				if(isBeforeToday || isBeforeOrSameCurrent){
					newSermonParts.push(part);
				}
			}
			sermon.parts = newSermonParts;
		}
		res.send(sermon);
		res.status(200).end();
	}, function(err){
		next(err);
	})
});

module.exports = router;
