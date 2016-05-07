/**
 * 执行API调用返回JSON
 */

var sql = require('../lib/mysqldb');
var dgn = require('../lib/dgn');
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
  //console.log('进入execSql');
  var _routerApiTable;
  function retrunJson(error,results) {
    //console.log('进入retrunJson');
    if (error)
    {
      res.send(results);
      return;
    }
    // console.log(JSON.stringify(results));
    // res.send(results);
    // return;
    var resultsJson;
    resultsJson=transformJson(results);
    res.send(resultsJson);
  };
  function returnSessionkey(error,results) {
    //console.log('进入returnSessionkey');
    if (error)
    {
      res.send(results);
      return;
    }
    // console.log(JSON.stringify(results));
    var sessionkeyP=param('sessionkey',req);
    if (results.length>0 && results[0].AccessToken== sessionkeyP)
    {exec();}
    else
      {
       res.send(returnInfo.api.e1004);
       return;
      }
  };
  function transformJson(results)
  {
     var resultsJsonObject={"returnCode":0};
    if (_routerApiTable.TransformJsonType=='VIEW')
      {
        resultsJsonObject.items=results;
        return resultsJsonObject;
      }
    else if (_routerApiTable.TransformJsonType=='PROC_S')  // 只有一个查询返回对象
      {
        resultsJsonObject.items=results[0];
        return resultsJsonObject;
      }
    else if  (_routerApiTable.TransformJsonType=='PROC_M') // 有多个查询返回对象
      {  resultsJsonObject.items=[];
        for(var i=0;i<results.length-1;i++)
          {
          var item={};
          item['item'+i]=results[i];
          resultsJsonObject.items.push(item);
          }
        return resultsJsonObject;
      }
    else if (_routerApiTable.TransformJsonType=='TREE')  // 返回树对象
      {
        var treeJson={};
        buildTreeJson(results[0],0,treeJson);
        resultsJsonObject.items=treeJson.children || [] ;
        return resultsJsonObject;
      }
    else
      {return results;}
  }

  function buildTreeJson(results,rootvalue,parentObject) {
     var childItem=results.filter((x,index) => {
          return (x.PMenuID==rootvalue)
        })
     if (childItem.length>0)
       { parentObject['children']=childItem;
     }

     for (y in childItem)
       { buildTreeJson(results,childItem[y].MenuID,parentObject.children[y]);}
     return ;
  }

  function exec()
  {//console.log('进入exec');
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
