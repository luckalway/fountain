var env = require(ROOT_PATH + '/env-'+app.get('env'));
var nano = require('nano')(env.couchdb.url);
var couchdb = nano.db.use(env.couchdb.db);
var ebookdb = nano.db.use('yuan-book');

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
