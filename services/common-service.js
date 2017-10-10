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