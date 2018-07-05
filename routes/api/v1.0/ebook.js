var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var ebookService = require('../../../services/ebook-service');
const articleService = require('../../../services/article-service');

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

router.get('/books', function(req, res, next){
  ebookService.getDocs('books', 'default', {}, function(err, body){
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

router.get('/books/:id', function(req, res, next){
  Promise.all([
    ebookService.getBook(req.params.id),
    articleService.getArticlesByBookId(req.params.id)
  ]).then(function(results){
    const book = results[0];
    const articles = results[1];
    book.articles = articles;
    res.send(book);
    res.status(200).end();
  }, function(errs){
    next(errs);
  });
});



router.put('/books/:id', function(req, res){
  var callback =  function(body){
    res.send(body);
    res.status(200).end();
  };

  if(req.body.action == 'addArticles'){
    articleService.moveArticles(req.params.id, req.body.articles, callback);
  }else if(req.body.action == 'rearrange'){
    articleService.rearrangeArticles(req.params.id, req.body.articles, callback);
  }else{
    res.status(404).end();
  }
});

router.get('/books/:bookId/articles/:articleId', function(req, res, next) {
  Promise.all([
    articleService.getArticle(req.params.articleId),
    ebookService.getBook(req.params.bookId)
  ]).then(function(results){
    const article = results[0];
    const book = results[1];
    article.bookTitle = book.title;
    res.send(article);
    res.status(200).end();
  }, function(err){
    next(err);
  });
});

module.exports = router;
