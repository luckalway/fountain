const env = require(ROOT_PATH + '/env-'+app.get('env'));
const nano = require('nano')(env.couchdb.url);
const couchdb = nano.db.use(env.couchdb.db);
const articledb = nano.db.use('yuan-article');
const mpArticledb = nano.db.use('yuan-mp-article');

exports.moveArticles = function(bookId, articleTitles, callback){
	let simpleArticleMap = new Map();
	var lastSimpleArticle;
	for(let simpleArticle of articleTitles){
		if(lastSimpleArticle){
			lastSimpleArticle.next = simpleArticle.id;
			simpleArticle.prev = lastSimpleArticle.id;
		}
		lastSimpleArticle = simpleArticle;
		simpleArticleMap.set(simpleArticle.id, simpleArticle);
	}

	let addArticle = function(err, mpArticle){
		if(err){
			log.err('Occured error while getting a doc from yuan-mp-article, ' + err);
		}
		let article = mpArticle;
		delete article._rev;
		let simpleArticle = simpleArticleMap.get(mpArticle._id);
		article.title = simpleArticle.title;
		article.bookId = bookId;
		if(simpleArticle.next){
			article.next = simpleArticle.next;
		}
		if(simpleArticle.prev){
			article.prev = simpleArticle.prev;
		}
		article.createdDate = Date.parse(new Date());
		article.modifiedDate = Date.parse(new Date());
		//log.info(article);
		articledb.insert(article, function(err){
			if(err){
				log.error(err);
			}
		});
	}

	for(let simpleArticle of articleTitles){
		mpArticledb.get(simpleArticle.id, {
			revs_info : true
		}, addArticle);
	}

	callback({
		status: 'success'
	})
};

exports.getDoc = function(id, callback){
	articledb.get(id, {
		revs_info : true
	}, callback);
};

exports.getDocs = function(designname, viewname, params, callback){
	articledb.view(designname, viewname, params || {}, function(err, body) {
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
