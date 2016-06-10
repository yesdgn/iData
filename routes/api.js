/**
 * 执行API调用返回JSON
 */

var sql = require('../lib/mysqldb');
var dgn = require('../lib/dgn');
var lodash =  require('lodash');
var returnInfo = require('../lib/returnInfo');
var RouterApiTable = {};
var ApiTableIsLoadData=0;
var hasParam=true;
var ParamErrStr='';

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
    sql : "select RouterStr,ApiExecSql,IsOpen,ApiID,TransformJsonType from dgn_router_api where IsCancel=0;",
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

  function exec()
  {
    hasParam=true;
    ParamErrStr='';
    var sqlstr=_routerApiTable.ApiExecSql;
      sqlstr=sqlstr.replace(/\{\$req.(.*?)\}/gi, function(reqstr){
                var s = reqstr.replace("{$req.","");
                s =s.replace("}","");
                var s1=param(s,req);
                if (s1===undefined)
                  {  hasParam=false;
                    ParamErrStr=ParamErrStr+s+'/';
                  }
                return  s1;
            });
        if (hasParam===false)
          { res.send({"returnCode":1001,"result":"fail","returnDescribe":"【"+ParamErrStr+"】参数未传入"});
            return;
          }
      var options = {
          sql : sqlstr,
          handler : retrunJson,
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
        if(!dgn.checkUrl(req.query ))
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
