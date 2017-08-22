var express = require('express');
var router = express.Router();

router.use('/signout', function(req, res, next) {
	req.session.signedIn = undefined;
	res.redirect(req.headers.referer);
});

module.exports = router;
