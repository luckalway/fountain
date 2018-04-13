ebookdb
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var ebookService = require('../../../services/ebook-service');;

function getSingularNoun(pluralNoun){
  if(pluralNoun.endsWith('s')){
    return pluralNoun.substring(0,pluralNoun.length-1);
  }
  return pluralNoun;
}

function getDataTypeName(dataType1, dataType2, dataType3){
  var dataType = getSingularNoun(dataType1);
  if(dataType2){
    dataType+='_'+getSingularNoun(dataType2);
  }
  if(dataType3){
    dataType+='_'+getSingularNoun(dataType3);
  }
  return dataType;
}

function getDesignName(dataType1, dataType2, dataType3){
  return getDataTypeName(dataType1, dataType2, dataType3)+'s';
}

function isValidDoc(doc, dataType){
  console.log(doc.dataType,dataType)
  if(doc.table == dataType || doc.dataType == dataType){
    return true;
  }
}

router.post('/:dataTypes', function(req, res, next) {
  var dataType = getDataTypeName(req.params.dataTypes);
  ebookService.createDoc(dataType, req.body, function(err, body){
    if(err){
      return next(err);
    }
    res.send(body);
    res.status(200).end();
  })
});

router.patch('/:dataTypes/:docId', function(req, res, next) {
  var dataType = getDataTypeName(req.params.dataTypes);
  ebookService.patchUpdateDoc(dataType, req.params.docId, req.body, function(err, body){
    if(err){
      return next(err);
    }
    res.status(200).end();
  });
});

router.get('/articles', function(req, res, next) {
  var descending = req.query.descending;
  var params = {};
  if(descending){
    params.descending = descending;
  }
  var view = req.params.view || 'default';
  ebookService.getDocs('articles', view, params, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/articles/:id', function(req, res, next) {
  ebookService.getDoc(req.params.id, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId/:subDataType', function(req, res, next) {
  var dataType = getDesignName(req.params.dataType, req.params.subDataType);
  var view = req.params.view || 'default';
  ebookService.getDocs(dataType, view, {key: req.params.docId}, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId/:subDataType/:subDocId', function(req, res, next) {
  ebookService.getDoc(req.params.subDocId, function(err, body){
    if(err){
      return next(err);
    }
    var fieldName = getDataTypeName(req.params.dataType)+'Id';
    if(body[fieldName] != req.params.docId){
      return res.status(404).end();
    }
    res.send(body);
    res.status(200).end();
  });
});

module.exports = router;
