
var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var commonService = require('../../../services/common-service');;

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

function isInvalidDoc(doc, dataType){
  if(doc.table == dataType || doc.dataType == dataType){
    return true;
  }
}

router.post('/:dataTypes', function(req, res, next) {
  var dataType = getDataTypeName(req.params.dataTypes);
  commonService.createDoc(dataType, req.body, function(err, body){
    if(err){
      return next(err);
    }
    res.send(body);
    res.status(200).end();
  })
});

router.patch('/:dataTypes/:docId', function(req, res, next) {
  var dataType = getDataTypeName(req.params.dataTypes);
  commonService.patchUpdateDoc(dataType, req.params.docId, req.body, function(err, body){
    if(err){
      return next(err);
    }
    console.log(body);
    res.status(200).end();
  });
});

router.get('/:dataTypes', function(req, res, next) {
  var designName = req.params.dataTypes;
  var dataType = getDataTypeName(req.params.dataTypes);
  var view = req.params.view || 'default';
  commonService.getDocs(dataType, designName, view, {}, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId', function(req, res, next) {
  commonService.getDoc(req.params.docId, function(err, body){
    if(err){
      return next(err);
    }

    var invalidDoc = isInvalidDoc(body, req.params.dataType);
    if(invalidDoc){
      next(invalidDoc);
      return;
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId/:subDataType', function(req, res, next) {
  var dataType = getDesignName(req.params.dataType, req.params.subDataType);
  var view = req.params.view || 'default';
  commonService.getDocs(dataType, view, {key: req.params.docId}, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId/:subDataType/:subDocId', function(req, res, next) {
  commonService.getDoc(req.params.subDocId, function(err, body){
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
