/**
 * 执行API调用返回JSON
 */

var sql = require('../lib/mysqldb');
var mssql = require('../lib/mysqlmsdb');
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
    sql : "select RouteName,ApiExecSql,IsOpen,ApiID,TransformJsonType,AutoGenerateSqlTableName from dgn_router_api where IsCancel=0;",
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
    return;
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


  function generateSaveSqlStr(args,TableNameArr) {
     var tablename=TableNameArr.split(",");
     var jsonData=JSON.parse(args.jsonData);
     var sql='';
     var abort=false;
     tablename.map(function(x,index) {
       var tempArr=[];
       if (abort){  return;  }
       if (jsonData[index]==undefined)
       {return sql }
       else if (lodash.isArray(jsonData[index]))
       {tempArr=jsonData[index];}
       else {tempArr.push(jsonData[index]);}   //不是数组则认为是对象，转换为数组 方便统一处理
       tempArr.map(function(x1){
         if (abort){return;}
         var field='';
         for (var x2 in x1)
         { if (x2!='ID' &&  x2!='DgnOperatorType')
           {field=field+ (field==''?'':',')+ x2+'='+dgn.replacestr(x1[x2]);}
         }
         var dataID= x1.ID ;
           // 只允许数字与undefined(新增只能是undefined) 如果非数字有可能是SQL注入行为
         if (!(dataID===undefined) && isNaN(dataID))
         {abort=true; return;}
         if (dgn.ifNull(x1.ID) && x1.DgnOperatorType=='ADD' )
         {
           sql=sql+' insert into '+x+' set '+field+';';
         }
         else if (x1.ID && x1.DgnOperatorType=='UPDATE' ) {
           sql=sql+' update '+x+' set '+field+' where ID='+x1.ID+';';
         }
         else if (x1.ID && x1.DgnOperatorType=='DELETE' ) {
           sql=sql+' delete from '+x+' where ID='+x1.ID+';';
         }
       })
     })
   if (abort){return null }

    return sql
  }
  function generateReadSqlStr(args,TableNameArr) {
     var tablename=TableNameArr.split(",");
     var jsonData=JSON.parse(args.jsonData);
     var tablePrimaryKey;
     var tablePrimaryKeyValue;
     var sql='';
     var abort=false;
     tablename.map(function(x,index) {
       if (abort){  return;  }
       if (jsonData[index]==undefined)
       {return sql }
         var x1=jsonData[index]
         tablePrimaryKey=lodash.chain(x1).keys().value()
         tablePrimaryKeyValue=x1[tablePrimaryKey];
         //主键值只能是数字 安全考虑
         if (isNaN(tablePrimaryKeyValue))
         {abort=true; return;}
         if (!isNaN(tablePrimaryKey))   //主键名不能是数字
         {abort=true; return;}
         var regx=/^[a-zA-Z0-9_]+$/;
         if (!regx.test(tablePrimaryKey))
         {abort=true; return;}

         sql=sql+'select * from '+x+' where '+tablePrimaryKey+'="'+tablePrimaryKeyValue+'";'
     })
   if (abort){return null }
    return sql
  }
  function generateListSqlStr(args,sqlArrs) {
     var sqlArray=sqlArrs.split(";");
     var pageSize=args.pageSize?args.pageSize:10;
     var curPage=args.curPage?args.curPage:1;
     var sql='';
     var abort=false;
     sqlArray.map(function(x,index) {
       if (lodash.trim(x)!=''){
         if (abort){  return;  }
           sql=sql+'select count(1) TotalCount from ('+x+') T ;' ;
           sql=sql+'\n\r'+x +' limit '+(curPage-1)*pageSize+','+pageSize+';';
       }
     })
   if (abort){return null }
    return sql
  }
  function exec()
  {
    var sqlstr=_routerApiTable.ApiExecSql;
    var args=lodash.isEmpty(req.query)?req.body:req.query;
    var options  = {
          sql : sqlstr,
          handler : retrunJson,
          args:args
        };

      if (_routerApiTable.TransformJsonType=='FORMITEMUPDATE')   //自动生成单据保存语句
      {var sqls=generateSaveSqlStr(args,_routerApiTable.AutoGenerateSqlTableName);
        if (sqls===null){res.send(returnInfo.api.e1007); return;}
        if (sqls===''){res.send(returnInfo.api.e1009); return;}
        options.args.sqlstr=sqls;
        mssql.execQuery(options);

      }
      else if (_routerApiTable.TransformJsonType=='FORMITEMREAD')  //自动生成单据读取语句
      {var sqls=generateReadSqlStr(args,_routerApiTable.AutoGenerateSqlTableName);
        if (sqls===null){res.send(returnInfo.api.e1007); return;}
        options.args.sqlstr=sqls;
        mssql.execQuery(options);
      }
      else if (_routerApiTable.TransformJsonType=='FORMLIST')  //自动生成列表语句
      {var sqls=generateListSqlStr(args,_routerApiTable.ApiExecSql);
        if (sqls===null){res.send(returnInfo.api.e1007); return;}
        options.sql=sqls;
        mssql.execQuery(options);
      }
      else {
          sql.execQuery(options);
      }
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
