/**
 * 数据库模块
 */
var config = require("../config");
var returnInfo = require("./returnInfo");
var dgn = require("./dgn");
var options = {
  'host' : config.dbhost,
  'port' : config.port,
  'user' : config.user,
  'password' : config.password,
  'database' : config.db,
  'charset' : config.charset,
  'connectionLimit' : config.maxConnLimit,
  'ReconnectTime' : config.ReconnectTime,
  'supportBigNumbers' : true,
  'bigNumberStrings' : true,
  'dateStrings':true,
  'multipleStatements':true,
  'queryFormat':queryFormat
};

function queryFormat (query, values) {
  if (!values) return query;
  var sqlreplace=  query.replace(/\{\$req[n]?.(.*?)\}/gi, function (txt, key) {
    let keyitem=key.split('.');
    if (keyitem.length>1)   //SQL中有类似于{$req.filter.goodname} 这样形式的变量。 filter为传入的参数名，goodsname为filter参数中的项目 要求filter是{}
    {
      if (Object.prototype.hasOwnProperty.call(values, keyitem[0]) && !dgn.ifNull(values[keyitem[0]]) ) {
      let keyjson=JSON.parse(values[keyitem[0]]);
      return (keyjson[keyitem[1]]?keyjson[keyitem[1]]:'');
      }
      else
      { return ''; }
    }

    if (Object.prototype.hasOwnProperty.call(values, key)) {
      if ( txt.substr(0,6)==='{$reqn' &&  values[key]=='')    // 当变量为{$reqn.}时， 参数值为''就替换为null 方便数据库像数字列无法插入''
      {return null; }
      else 
      {
         if (key=='sqlstr') {return  values[key] ;}  
         else { return dgn.replacestr(values[key]);
         }
       }
    }
    return txt;
  }.bind(this));
   console.log(sqlreplace);
  return sqlreplace
};

var mysql = require('mysql');
var pool = mysql.createPool(options);


/**
 * 释放数据库连接
 */
exports.release = function(connection) {
  connection.end(function(error) {
    console.log('Connection closed');
    if (error) {
      console.log(error);
    }
    return;
  });
};
/*
pool.on('connection', function (connection) {
    console.log('pool connection even');
  });
pool.on('enqueue', function () {
    console.log('Waiting for available connection slot');
  });
*/
/**
 * 执行查询
 */
exports.execQuery = function(options) {
  pool.getConnection(function(error, connection) {
    if (error) {
      console.log('DB连接异常！');
      //setTimeout(initPool, options.ReconnectTime); // 连接不上 自动再连接
      var handler = options['handler'];
      handler(error,returnInfo.db.e2000);
      return;
      // throw error;
    }


    // 查询参数
    //var sql ={sql: options['sql'],nestTables: true};
    var sql =  options['sql'] ;
    var args = options['args'];
    var handler = options['handler'];


    // 执行查询
    if (!args) {
      var query = connection.query(sql, function(error, results) {
        connection.release();
        if (error) {
          console.log('DB执行异常！');
          console.log(query.sql);
          console.log(error);
          handler(error,returnInfo.db.e2001);
          return;
          // throw error;
        } else {
        //  console.log('DB-执行查询语句成功');
          handler(error,results);
          return;
        }
      });
    } else {
      // args的使用如下：
      // var userAddSql = 'INSERT INTO userinfo(Id,UserName,UserPass)
      // VALUES(0,?,?)';
      // var userAddSql_Params = ['Wilson', 'abcd'];
      var query = connection.query(sql, args, function(error, results) {
        connection.release();
        if (error) {
          console.log('DB执行异常！');
          console.log(query.sql);
          console.log(error);
          handler(error,returnInfo.db.e2002);
          return;
          // throw error;
        } else {
          //console.log('DB-执行查询语句成功');
          handler(error,results);
          return;
        }
      });
    }

   });

};
