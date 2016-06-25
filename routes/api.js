/**
 * 执行API调用返回JSON
 */

var sql = require('../lib/mysqldb');
var dgn = require('../lib/dgn');
var lodash =  require('lodash');
var returnInfo = require('../lib/returnInfo');
var RouterApiTable = {};
var ApiTableIsLoadData=0;

exports.execApi = function(req, res) {
   //console.log('进入execApi');
  if (ApiTableIsLoadData===0) {
    initApiTable(req, res);
  } else {
    execSql(req, res);
  }

};

exports.initApiTable = initApiTable;

function initApiTable(req, res) {
  function router_api_cb(error,results) {
    //console.log('进入router_api_cb');
    if (error)
      {
        res.send(results);
        return;
      }
    for ( var i = 0; i < results.length; i++) {
      RouterApiTable['/api/'+results[i].ApiID]=results[i];
    }
  //  console.log(RouterApiTable);
    if (results.length>1) // 标记已加载ApiTable
      {
        ApiTableIsLoadData=1;
        execSql(req, res);
      }
    else  // ApiTable无数据
      {
       res.send(returnInfo.api.e1002);
       return;
      }
    };
  var initOptions = {
    sql : "select RouterStr,ApiExecSql,IsOpen,ApiID,TransformJsonType,IsAutoGenerateSql,AutoGenerateSqlTableName from dgn_router_api where IsCancel=0;",
    handler : router_api_cb
  };
  console.log('ApiTable初始化加载');
  sql.execQuery(initOptions);
};
// param函数从express的request.js中拷出来的。因为他将被废弃。
function param(name, req,defaultValue) {
    var params = req.params || {};
    var body = req.body || {};
    var query = req.query || {};

    var args = arguments.length === 1
      ? 'name'
      : 'name, default';
    if (null != params[name] && params.hasOwnProperty(name)) return params[name];
    if (null != body[name]) return body[name];
    if (null != query[name]) return query[name];

    return defaultValue;
  };

function execSql(req, res) {
  var _routerApiTable;
  function retrunJson(error,results) {
    if (error)
    {
      res.send(results);
      return;
    }
    var resultsJson;
    resultsJson=dgn.transformJson(_routerApiTable.TransformJsonType,results);
    res.send(resultsJson);
  };
  function returnSessionkey(error,results) {
    if (error)
    {
      res.send(results);
      return;
    }
    var sessionkeyP=param('sessionkey',req);
    if (results.length>0 && results[0].AccessToken== sessionkeyP)
    {exec();}
    else
      {
       res.send(returnInfo.api.e1004);
       return;
      }
  };
  //替换生成的SQL语句中的"和\
  function replacestr(str) {
    if (dgn.ifNull(str))
      return 'null';
    var s= str.replace(/["\\]/gi, function (txt, key) {
      if(key==0)
      {return txt;}
       return '\\'+txt;
    })
    console.log(s);
    return '"'+s+'"';
    }
  function generateSqlStr(args,TableNameArr) {
     var tablename=TableNameArr.split(",");
     var jsonData=JSON.parse(args.jsonData);
     var sql='';
     var insertKeyValue=dgn.getRand();
     tablename.map(function(x,index) {
       if (jsonData[index]==undefined)
       {return sql }
       var key=jsonData[index].key;
       var items=jsonData[index].items;
       items.map(function(x1){
         var field='';
         for (var x2 in x1)
         { if (x2!=key)
           {field=field+ (field==''?'':',')+ x2+'='+replacestr(x1[x2]);}
         }
         if (dgn.ifNull(x1[key]))
         {
           sql=sql+' insert into '+x+' set '+field+','+key+'=insertKeyValue;';
         }
         else {
           sql=sql+' update '+x+' set '+field+' where '+key+'="'+x1[key]+'";';
         }
       })
     })
    return sql
  }

  function exec()
  {
    var sqlstr=_routerApiTable.ApiExecSql;
    var args=lodash.isEmpty(req.query)?req.body:req.query;

      if (_routerApiTable.IsAutoGenerateSql==1)
      {var sqls=generateSqlStr(args,_routerApiTable.AutoGenerateSqlTableName);
        args={sqlstr:sqls};
      }

      var options  = {
            sql : sqlstr,
            handler : retrunJson,
            args:args
          };
       sql.execQuery(options);

  };

   _routerApiTable=RouterApiTable[req.path];  // req.originalUrl req.baseUrl
                        // req.path
  if (_routerApiTable===undefined) // 不存在的API
    {
      res.send(returnInfo.api.e1000);
      return;
    }
  if (_routerApiTable.IsOpen=='0') // 需要登录才可以调用的API
    {
     var s2=param('sessionkey',req);
     if (s2===undefined )
         {   res.send(returnInfo.api.e1003);
           return;
         }
      var timestamp=param('timestamp',req);
      if (timestamp===undefined )
          {   res.send(returnInfo.api.e1006);
            return;
          }
      else if((lodash.now()-timestamp)>(1000*60*5))  //5分钟有效期
      {
        res.send(returnInfo.api.e1006);
         return;
      }
      else
      {
        if( (req.method=='GET' && !dgn.checkUrl(req.query))  ||   (req.method=='POST' && !dgn.checkUrl(req.body))  )
          {
          res.send(returnInfo.api.e1005);
           return;
          }
      }
      var options = {
          sql : "select  AccessToken  from dgn_access_token where   AccessToken='"+s2+"'  and now()<=ExpireTime",
          handler : returnSessionkey,
        };

      sql.execQuery(options);
    }
  else
    {
    exec();};
};
