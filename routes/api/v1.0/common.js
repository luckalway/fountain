
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

router.get('/:dataTypes', function(req, res, next) {
  var dataTypes = req.params.dataTypes;
  var view = req.params.view || 'default';
  commonService.getDocs(dataTypes, view, {}, function(err, body){
    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId', function(req, res, next) {
  commonService.getDoc(req.params.docId, function(err, body){
    if(err){
      return;
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
  commonService.getDocs(dataType, view, {}, function(err, body){
    res.send(body);
    res.status(200).end();
  });
});

router.get('/:dataType/:docId/:subDataType/:docId', function(req, res, next) {
  var dataType = getDataTypeName(req.params.dataType, req.params.subDataType);
  commonService.getDoc(req.params.docId, function(err, body){
    res.send(body);
    res.status(200).end();
  });
});

module.exports = router;
