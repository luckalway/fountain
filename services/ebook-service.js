const env = require(ROOT_PATH + '/env-'+app.get('env'));
const nano = require('nano')(env.couchdb.url);
const couchdb = nano.db.use(env.couchdb.db);
const ebookdb = nano.db.use('yuan-book');
const mpArticledb = nano.db.use('yuan-mp-article');

exports.getDoc = function(id, callback){
	ebookdb.get(id, {
		revs_info : true
	}, callback);
};

exports.createDoc = function(doc, callback){
	doc.createdDate = Date.parse(new Date());
	doc.modifiedDate = Date.parse(new Date());
	ebookdb.insert(doc, callback);
};

exports.getDocs = function(designname, viewname, params, callback){
	ebookdb.view(designname, viewname, params || {}, function(err, body) {
		if(err){
			return	callback(err);
		}

		var docs = [];
		body.rows.forEach(function(doc) {
			docs.push(doc.value);
		});
		callback(null, docs);
	});
};

exports.getMpArticles=function(category, callback){
	mpArticledb.view('articles', 'default', {key:category}, function(err, body) {
		if(err){
			return	callback(err);
		}

		let docs = [];
		body.rows.forEach(function(doc) {
			docs.push(doc.value);
		});
		callback(null, docs);
	});
};
