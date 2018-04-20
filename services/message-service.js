var moment = require('moment');
var merge = require('merge');

var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var generateId = function(length) {
  var rtn = '';
  for (var i = 0; i < length; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
};

exports.getMessageWithoutParts = function(callback){
  couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
    if(err){
      callback(err);
      return;
    }

    var docs = [];
    body.rows.forEach(function(doc) {
      docs.push(doc.value);
    });
    callback(null, docs);
  });
};

exports.getMessages = function(callback){
  couchdb.view("messages", "by_created_date", {descending:true}, function(err, body) {
    if(err){
      callback(err);
      return;
    }
    var docsMap = {};
    var messageIds = [];
    body.rows.forEach(function(doc) {
      doc.value.createdDate = moment(doc.value.createdDate).format('YYYY-MM-DD');
      docsMap[doc.value._id] = doc.value;
      messageIds.push(doc.value._id);
      docsMap[doc.value._id].countOfUploaded = 0;
      docsMap[doc.value._id].publishDates = [];
    });

    couchdb.view("message_parts", "by_message_id", {keys:messageIds}, function(err, body) {
      if(err){
        callback(err);
        return;
      }

      body.rows.forEach(function(doc) {
        docsMap[doc.value.messageId].countOfUploaded++;
        docsMap[doc.value.messageId].publishDates.push(doc.value.publishDate);
      });

      var docs = [];
      for(var key in docsMap){
        docsMap[key].publishDates = docsMap[key].publishDates.sort();
        docs.push(docsMap[key]);
      }
      callback(null, docs);
    });
  });
};

exports.getMessage = function (messageId, callback) {
  couchdb.get(messageId, {
    revs_info : true
  }, function(err, messageBody) {
    if(err){
      callback(err);
      return;
    }

    couchdb.view("message_parts", "by_message_id", {keys:[messageId]}, function(err, body) {
      if(err){
        callback(err);
        return;
      }

      messageBody.parts = [];
      body.rows.forEach(function(doc) {
        doc.value.uploaded = true;
        doc.value.scripture = doc.value.scripture.trim();
        messageBody.parts.push(doc.value);
      });

      callback(null, messageBody);
    });
  });
};

// @Deprecated
exports.getMessageVideos = function(resourceId , callback){
  var messageId;
  if(/\w{8}_\d{1,2}/.test(resourceId)){
    messageId = resourceId.split("_")[0];
  } else {
    messageId = resourceId;
  }

  couchdb.view("messages", "by_message_id", {
    startkey : [ messageId ],
    endkey : [ messageId, {} ]
  }, function(err, body) {
    if(err){
      callback(err);
      return;
    }

    var messageBody, currentPart;
    var allMessageParts = [];
    body.rows.forEach(function(doc) {
      if(doc.value.table == 'message_part'){
        var isBeforeToday = moment(doc.value.publishDate, "YYYY-MM-DD").isBefore(moment().add(1, 'days'),'day');
        if(isBeforeToday)
        allMessageParts.push(doc.value);
      } else if (doc.value.table == 'message'){
        messageBody = doc.value;
      }
    });

    callback(null, {
      message : messageBody,
      currentPart: currentPart,
      messageParts : allMessageParts
    });
  });

};

exports.createMessage = function(message, callback){
  message.createdDate = Date.parse(new Date());
  message.modifiedDate= Date.parse(new Date());

  var id = generateId(8);
  couchdb.insert(merge(message, {table:"message", _id:id}), callback(null, id));
};

exports.createMessagePart = function(part, callback){
  couchdb.insert(merge(part, {
    _id: part.messageId + "_" + part.partNo,
    table: "message_part",
    createdDate: Date.parse(new Date()),
    modifiedDate: Date.parse(new Date())
  }), callback);
};

exports.removeMessage = function(messageId, callback){
  if(/\w{8}_\d{1,2}/.test(messageId)){
    couchdb.get(messageId, {
      revs_info : true
    }, function(err, part) {
      if(err){
        callback(err);
        return;
      }
      var isBeforeToday = moment(part.publishDate, "YYYY-MM-DD").isBefore(moment(),'day');
      if(isBeforeToday){
        callback({error: 'before_today'});
        return;
      }

      couchdb.destroy(part._id, part._rev, function(err, body) {
        if(err){
          callback(err);
          return;
        }
        callback(null, {
          status:'success'
        });
      });
    });
  } else {
    this.getMessage(messageId.split("_")[0], function(err, body){
      if(err){
        callback(err);
        return;
      }
      if(body.parts.length > 0){
        callback('has_parts');
        return;
      }

      couchdb.destroy(body._id, body._rev, function(err, body) {
        if(err){
          callback(err);
          return;
        }
        callback(null, {
          status:'success'
        });
      });
    });
  }
};
