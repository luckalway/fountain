var env = require(ROOT_PATH + '/env-'+app.get('env'));
var nano = require('nano')(env.couchdb.url);
var couchdb = nano.db.use(env.couchdb.db);
var ebookdb = nano.db.use('e_book');

exports.getDoc = function(id, callback){
	ebookdb.get(id, {
		revs_info : true
	}, callback);
}

exports.createDoc = function(dataType, doc, callback){
	doc.createdDate = Date.parse(new Date());
	doc.modifiedDate = Date.parse(new Date());
	doc.dataType = dataType;
	if(!idGenerator[dataType]){
		return callback({error: 'No idGenerator for ' + dataType});
	}
	doc._id = idGenerator[dataType].call();
	ebookdb.insert(doc, callback(null, doc));
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

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var generateId = function(length) {
	var rtn = '';
	for (var i = 0; i < length; i++) {
		rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
	}
	return rtn;
}

var idGenerator = {
	message:function(){
		return generateId(8);
	},
	user:function(){
		return generateId(6);
	}
}
