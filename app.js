var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sql = require('./lib/mysqldb');
//var routes = require('./routes/index');
//var users = require('./routes/users');

var api = require('./routes/api');
var returnInfo = require("./lib/returnInfo");

var app = express();
var upload=require('./lib/upload');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function sqlExecCB(error,results) {
  process.emit('exit',1);
  return;
  };
process.on('uncaughtException', function(err) {
    console.error('Error caught in uncaughtException event:', err);
    var initOptions = {
      sql : "insert into dgn_log set Module='NodeJsError',Operation='NodeJS发生错误',`Describe`={$req.errStack}" ,
      handler : sqlExecCB,
      arge:{errStack:err.stack}
    };
    sql.execQuery(initOptions);
});

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",'iData 1.0.0')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.options('/upload/*', function(req, res) {
    res.end();
});

//app.use('/', routes);
//app.use('/users', users);

// api.initApiTable(null,null,false);
app.all('/api/*', api.execApi);


 app.post('/upload/img',upload.uploadImg);
 app.post('/upload/file',upload.uploadFile);

//所有未设置的路由全部重定向到首页
app.use(function(req, res, next) {
  console.log('重定向到根目录');
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
