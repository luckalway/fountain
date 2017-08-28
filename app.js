var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');

var app = express();
var env = require('./env-'+app.get('env'));
global.ROOT_PATH = __dirname;
global.nano = require('nano')(env.couchdb.url);
global.couchdb = nano.db.use(env.couchdb.db);
global.CONF = env.conf;


var index = require('./routes/index');
var admin = require('./routes/admin');
var signIn = require('./routes/signIn');
var message = require('./routes/message');
var api = require('./routes/api');


// view engine setup
app.engine('html', ejs.__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	  secret: 'keyboard cat',
	  resave: false,
	  saveUninitialized: false,
	  cookie: { secure: false }
}));

app.use(function(req, res, next) {
	res.locals.signedIn = req.session.signedIn;
	res.locals.videoPlayerUrl = CONF.videoPlayerUrl;
	next();
});

app.use('/', index);
app.use('/sign-in', signIn);
app.use('/admin', admin);
app.use('/api', api);
app.use('/', message);
app.use('/signout', function(req, res, next) {
	req.session.signedIn = undefined;
	res.redirect(req.headers.referer);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('uncaughtException', function(err) {
	console.log(err);
	console.log(err.stack);
});

module.exports = app;
