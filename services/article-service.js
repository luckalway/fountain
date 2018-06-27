const env = require(ROOT_PATH + '/env-'+app.get('env'));
const nano = require('nano')(env.couchdb.url);
const couchdb = nano.db.use(env.couchdb.db);
const articledb = nano.db.use('yuan-article');
const mpArticledb = nano.db.use('yuan-mp-article');

exports.moveArticles = function(bookId, articleTitles, callback){
	let simpleArticleMap = new Map();
	for(let simpleArticle of articleTitles){
		simpleArticleMap.set(simpleArticle.id, simpleArticle.title);
	}

	let addArticle = function(err, mpArticle){
		if(err){
			log.err('Occured error while getting a doc from yuan-mp-article, ' + err);
		}
		let article = mpArticle;
		delete article._rev;
		article.title = simpleArticleMap.get(mpArticle._id);
		article.bookId = bookId;
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
