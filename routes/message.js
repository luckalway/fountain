var express = require('express');
var router = express.Router();

router.get('messages', function(req, res, next) {

});

router.get('/messages/:messageId/video', function(req, res, next) {
	couchdb.get(req.params.messageId, {
		revs_info : true
	}, function(err, body) {
		console.log(body);
		res.render('message-video', { message: body});
	});
});

module.exports = router;