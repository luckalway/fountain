var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");

router.get('/messages', function(req, res, next) {
	couchdb.view("messages", "message", function(err, body) {
		console.log(err);
		if (!err) {
			var docs = [];
			console.log(docs);
			body.rows.forEach(function(doc) {
				docs.push(doc.value);
			});
			res.send(docs);
			res.status(200).end();
		}
	});
});

router.get('/messages/:id', function(req, res, next) {
	couchdb.get(req.params.id, {
		revs_info : true
	}, function(err, body) {
		res.send(body);
		res.status(200).end();
	});
});

module.exports = router;