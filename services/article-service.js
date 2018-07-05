const nano = require('nano')(env.couchdb.url);
const commonService = require('./common-service');

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

exports.rearrangeArticles = function(bookId, articleIds, callback){
	let patchDocsMap = new Map();
	let lastArticleId;
	let orderNo = 1;
	for(let articleId of articleIds){
		var patchDoc = {orderNo: orderNo++};
		if(lastArticleId && patchDocsMap.has(lastArticleId)){
			patchDoc.prev = lastArticleId;
			patchDocsMap.get(lastArticleId).next = articleId;
		}
		patchDocsMap.set(articleId, patchDoc);
		lastArticleId = articleId;
	}
	for(let [key, value] of patchDocsMap){
		commonService.patchUpdateDoc('article', key, value, function(error, body){
			if(error){
				return log.error(error);
			}
			log.info(body);
		});
	}
};

exports.getArticlesByBookId = function(bookId){
	const promise = new Promise(function(resolve, reject){
		commonService.view('article', 'articles', 'bookId', {}, function(err, body){
			if(err){
				return reject(err);
			}
			resolve(body);
		});
	});
	return promise;
};

exports.getArticle = function(articleId){
	return commonService.get('article', articleId);
};
