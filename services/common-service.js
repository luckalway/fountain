function getCouchdb(dataType){
	return dataType == 'user' ? couchdb_user: couchdb;
}

exports.patchUpdateDoc = function(dataType, id, patchDoc, callback){
	couchdb.get(id, {
		revs_info : true
	}, function(err, body) {
		if(err){
			callback(err);
			return;
		}
		for(var key in patchDoc){
			body[key] = patchDoc[key];
		} 
		delete body._revs_info;
		getCouchdb(dataType).update(body, body._id, callback);
	});
};


exports.getDoc = function(id, dataType, callback){
	getCouchdb(dataType).get(id, {
		revs_info : true
	}, callback);
};

exports.createDoc = function(dataType, doc, callback){
	doc.createdDate = Date.parse(new Date());
	doc.modifiedDate = Date.parse(new Date());
	doc.dataType = dataType;
	if(!idGenerator[dataType]){
		return callback({error: 'No idGenerator for ' + dataType});
	}
	doc._id = idGenerator[dataType].call();
	getCouchdb(dataType).insert(doc, callback(null, doc));
};

exports.getDocs = function(dataType, designname, viewname, params, callback){
	getCouchdb(dataType).view(designname, viewname, params || {}, function(err, body) {
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
};

var idGenerator = {
	message:function(){
		return generateId(8);
	},
	user:function(){
		return generateId(6);
	}
};
