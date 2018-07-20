const commonService = require('./common-service');

exports.getSermons = function(){
  const promise = new Promise(function(resolve, reject){
    commonService.view('sermon', 'sermons', 'created_date',{descending:true},
    function(err, sermons){
      if(err){
        return reject(err);
      }
      resolve(sermons);
    });
  });
  return promise;
};

exports.getSermon = function (sermonId) {
  const promise = new Promise(function(resolve, reject){
    commonService.get('main', sermonId).then(function(sermon){
      couchdb.view("sermon_parts", "sermon_id", {keys:[sermonId]}, function(err, body) {
        if(err){
          return reject(err);
        }

        sermon.parts = [];
        body.rows.forEach(function(doc) {
          sermon.parts.push(doc.value);
        });

        resolve(sermon);
      });
    }, function(err){
      reject(err);
    });
  });
  return promise;
};
