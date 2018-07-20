const nano = require('nano')(env.couchdb.url);
const maindb = nano.db.use(env.couchdb.db);
const ebookdb = nano.db.use('yuan-book');
const userdb = nano.db.use('spring_user');
const articledb = nano.db.use('yuan-article');
const mpArticledb = nano.db.use('yuan-mp-article');

const databasesMap = new Map();
databasesMap.set('user', userdb);
databasesMap.set('book', ebookdb);
databasesMap.set('article', articledb);
databasesMap.set('mpArticle', mpArticledb);

function getCouchdb(dataType) {
  return databasesMap.get(dataType) || maindb;
}

exports.patchUpdateDoc = function(dataType, id, patchDoc, callback) {
  let couchdb = getCouchdb(dataType);
  couchdb.get(id, function(err, body) {
    if (err) {
      return callback(err);
    }
    for (var key in patchDoc) {
      body[key] = patchDoc[key];
    }
    couchdb.insert(body, body._id, callback);
  });
};


exports.get = function(dataType, id, callback){
  const promise = new Promise(function(resolve, reject){
    getCouchdb(dataType).get(id, function(err, body){
      if(err){
        reject(err);
      }else{
        resolve(body);
      }
      if(callback){
          callback(err,body);
      }
    });
  });
  return promise;
};

exports.createDoc = function(dataType, doc, callback) {
  doc.createdDate = Date.parse(new Date());
  doc.modifiedDate = Date.parse(new Date());
  doc.dataType = dataType;
  getCouchdb(dataType).insert(doc, callback(null, doc));
};

exports.view = function(dataType, designname, viewname, params, callback) {
  getCouchdb(dataType).view(designname, viewname, params || {}, function(err, body) {
    if (err) {
      return callback(err);
    }

    var docs = [];
    body.rows.forEach(function(doc) {
      docs.push(doc.value);
    });
    callback(null, docs);
  });
};
