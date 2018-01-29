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
		delete body['_revs_info'];
		couchdb.update(body, body._id, callback);
	});
} 


exports.getDoc = function(id, callback){
	couchdb.get(id, {
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
	doc.id = idGenerator[dataType].call();

	couchdb.insert(doc, callback(null, id));
}

exports.getDocs = function(designname, viewname, params, callback){
	couchdb.view(designname, viewname, params || {}, function(err, body) {
		if(err){
			//console.log(err);
			callback(err);
			return;
		}

		var docs = [];
		body.rows.forEach(function(doc) {
			docs.push(doc.value);
		});
		callback(null, docs);
	});
}

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
	}
}
