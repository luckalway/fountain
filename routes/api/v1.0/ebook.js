var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var ebookService = require('../../../services/ebook-service');

router.get('/articles', function(req, res, next) {
  var descending = req.query.descending;
  var params = {};
  if(descending){
    params.descending = descending;
  }
  if(req.query.keys){
    params.keys = req.query.keys.split(',');
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

router.get('/mp-articles', function(req, res, next) {
  ebookService.getMpArticles(req.query.category, function(err, body){
    if(err){
      return next(err);
    }

    res.send(body);
    res.status(200).end();
  });
});

router.post('/books', function(req, res){
  ebookService.createDoc(req.body,function(err,body){
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

module.exports = router;
