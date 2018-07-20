var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');

global.ROOT_PATH = __dirname;
global.app = express();
global.env = require('./env-'+app.get('env'));
global.nano = require('nano')(env.couchdb.url);
global.couchdb = nano.db.use(env.couchdb.db);
global.ebookdb = nano.db.use('ebook');
global.couchdb_user = nano.db.use('spring_user');
global.CONF = env.conf;
global.accounts = env.accounts;
var LogFactory = require('log');
global.log = new LogFactory('info');

global.couchdb.update = function(obj, key, callback) {
    var db = this;

    db.get(key, function (error, existing) {
        if(!error) obj._rev = existing._rev;
        db.insert(obj, key, callback);
    });
};

var index = require('./routes/index');
var admin = require('./routes/admin');
var signIn = require('./routes/signIn');
var message = require('./routes/message');
var api2_V1_0 = require('./routes/api/v1.0/common');
var api_ebook1_0 = require('./routes/api/v1.0/ebook');
var api_sermon1_0 = require('./routes/api/v1.0/sermon');
var api = require('./routes/api');
var api2 = require('./routes/api2');
var api3 = require('./routes/api3');
var api4 = require('./routes/api4');

// view engine setup
app.engine('html', ejs.__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({limit: '2mb', extended: false }));
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
  res.locals.baseUploadDir = CONF.baseUploadDir;
	res.removeHeader("X-Powered-By");
	next();
});

app.use('/', index);
app.use('/sign-in', signIn);
app.use('/admin', admin);
app.use('/admin/docs', express.static(path.join(__dirname, 'docs')));

app.use('/api', api);
app.use('/api/v2', api2);
app.use('/api/v3', api3);
app.use('/api/v4', api4);
app.use('/api-2/v1.0', api2_V1_0);
app.use('/api/ebook/v1.0/', api_ebook1_0);
app.use('/api/v1.0/', api_sermon1_0);

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
  console.error(err);
  console.error(err.stack);
  if(err.statusCode == 404){
      return res.status(404).end();
  }

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
