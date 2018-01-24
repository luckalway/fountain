exports.partiallyUpdate = function(id, nameValues, callback){
	couchdb.get(id, {
		revs_info : true
	}, function(err, body) {
		if(err){
			callback(err);
			return;
		}
		for(var name in nameValues){
			body[name] = nameValues[name];
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

exports.getDocs = function(designname, viewname, params, callback){
	couchdb.view(designname, viewname, params || {}, function(err, body) {
		if(err){
			console.log(err);
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
