/**
 * 执行API调用返回JSON
 */

var sql = require('../lib/mysqldb');
var mssql = require('../lib/mysqlmsdb');
var dgn = require('../lib/dgn');
var lodash =  require('lodash');
var returnInfo = require('../lib/returnInfo');
var excel = require('../lib/excel');
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
    sql : "select RouteName,ApiExecSql,ApiExecConditionSql,IsOpen,ApiID,ApiType,AutoGenerateSqlTableName,IsAllowRoleRight from dgn_router_api where IsValid=1 and IsDelete=0;",
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
  var args=lodash.isEmpty(req.query)?req.body:req.query;
  function retrunJson(error,results) {
    if (error)
    {
      res.send(results);
      return;
    }
    var resultsJson;
    resultsJson=dgn.transformJson(_routerApiTable.ApiType,results,args);
    if (_routerApiTable.ApiType=='FORM_LIST_EXPORT' )
    {
      excel.exportExcel(req,res,args,resultsJson);
    }
    else
    {res.send(resultsJson);}
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


  function generateSaveSqlStr(args,tableNameStr) {
     var tablenameArr=tableNameStr.split(",");
     var jsonData=JSON.parse(args.jsonData);
     var excludeColNameArr=args.excludeColName?args.excludeColName.split(","):[];
     var sql='';
     var abort=false;
     tablenameArr.map(function(tablename,tableIndex) {
       var jsonTableData=[];
       if (abort){  return;  }
       if (jsonData[tableIndex]==undefined)
       {return sql }
       else if (lodash.isArray(jsonData[tableIndex]))
       {jsonTableData=jsonData[tableIndex];}
       else {jsonTableData.push(jsonData[tableIndex]);}   //不是数组则认为是对象，转换为数组 方便统一处理
       jsonTableData.map(function(row){
         if (abort){return;}
         var field='';
         for (var col in row)
         { if (col!='ID' &&  col!='DgnOperatorType' && !excludeColNameArr.includes(col)   )
           {
             let colvalue=dgn.replacestr(row[col]);
             if (colvalue===true)
              {colvalue=1;}
             else if (colvalue===false)
             {colvalue=0;}
             colvalue= colvalue===''?null:'"'+colvalue+'"' ;
             field=field+ (field==''?'`':',`')+ col+'`='+colvalue;}
         }
         var dataID= row.ID ;
           // 只允许数字与undefined(新增只能是undefined) 如果非数字有可能是SQL注入行为
         if ( isNaN(dataID) && dataID!==undefined)
         {abort=true; return;}
         if (dgn.ifNull(row.ID) && row.DgnOperatorType=='ADD' )
         {
           sql=sql+' insert into '+tablename+' set '+field+';';
         }
         else if (row.ID && row.DgnOperatorType=='UPDATE' ) {
           sql=sql+' update '+tablename+' set '+field+' where ID='+row.ID+';';
         }
         else if (row.ID && row.DgnOperatorType=='DELETE' ) {
           sql=sql+' delete from '+tablename+' where ID='+row.ID+';';
         }
         else
         {return;}
       })
     })
   if (abort){return null }

    return sql
  }
  // function generateReadSqlStr(args,TableNameArr) {
  //    var tablename=TableNameArr.split(",");
  //    var jsonData=JSON.parse(args.jsonData);
  //    var tablePrimaryKey;
  //    var tablePrimaryKeyValue;
  //    var sql='';
  //    var abort=false;
  //    tablename.map(function(x,index) {
  //      if (abort){  return;  }
  //      if (jsonData[index]==undefined)
  //      {return sql }
  //        var x1=jsonData[index]
  //        tablePrimaryKey=lodash.chain(x1).keys().value()
  //        tablePrimaryKeyValue=x1[tablePrimaryKey];
  //        //主键值只能是数字 安全考虑
  //        if (isNaN(tablePrimaryKeyValue))
  //        {abort=true; return;}
  //        if (!isNaN(tablePrimaryKey))   //主键名不能是数字
  //        {abort=true; return;}
  //        var regx=/^[a-zA-Z0-9_]+$/;
  //        if (!regx.test(tablePrimaryKey))
  //        {abort=true; return;}

  //        sql=sql+'select * from '+x+' where `'+tablePrimaryKey+'`="'+tablePrimaryKeyValue+'";'
  //    })
  //  if (abort){return null }
  //   return sql
  // }
  //   function generateDeleteSqlStr(args,TableNameArr) {
  //    var tablename=TableNameArr.split(",");
  //    var jsonData=JSON.parse(args.jsonData);
  //    var tablePrimaryKey;
  //    var tablePrimaryKeyValue;
  //    var sql='';
  //    var abort=false;
  //    tablename.map(function(x,index) {
  //      if (abort){  return;  }
  //      if (jsonData[index]==undefined)
  //      {return sql }
  //        var x1=jsonData[index]
  //        tablePrimaryKey=lodash.chain(x1).keys().value()
  //        tablePrimaryKeyValue=x1[tablePrimaryKey];
  //        //主键值只能是数字 安全考虑
  //        if (isNaN(tablePrimaryKeyValue))
  //        {abort=true; return;}
  //        if (!isNaN(tablePrimaryKey))   //主键名不能是数字
  //        {abort=true; return;}
  //        var regx=/^[a-zA-Z0-9_]+$/;
  //        if (!regx.test(tablePrimaryKey))
  //        {abort=true; return;}

  //        sql=sql+'delete from '+x+' where `'+tablePrimaryKey+'`="'+tablePrimaryKeyValue+'";'
  //    })
  //  if (abort){return null }
  //   return sql
  // }
  function generateListSqlStr(args,sqlArrs) {
     var sqlArray=sqlArrs.split(";");
     var pageSize=args.pageSize?args.pageSize:10;
     var curPage=args.curPage?args.curPage:1;
     //let filter=args.dgnFilter?JSON.parse(args.dgnFilter):{};
     var sql='';
     var abort=false;
     sqlArray.map(function(sqlStr,index) {
       if (lodash.trim(sqlStr)!=''){
         if (abort){  return;  }
       //  console.log(filter);
       //    let tmpsql  =x.replace(/\{\$req.dgnFilter\}/gi, lodash.isEmpty(filter)?'':'1');  //将req.dgnFilter重置，没有过滤条件则为空 有过滤则为1
       //      tmpsql= dgn.queryFormat(tmpsql,filter);
           sql=sql+'select count(1) TotalCount from ('+sqlStr +') T ;' ;
           //sql=sql+'\n\r'+sqlStr  +' limit '+(curPage-1)*pageSize+','+pageSize+';';
           sql=sql+'\n\r'+sqlStr  +' limit '+curPage+','+pageSize+';';
       }
     })
   if (abort){return null }
    return sql
  }
  //   function generateListExportSqlStr(args,sqlArrs) {
  //    var sqlArray=sqlArrs.split(";");
  //    var sql='';
  //    var abort=false;
  //    sqlArray.map(function(x,index) {
  //      if (lodash.trim(x)!=''){
  //        if (abort){  return;  }
  //          sql=sql+'\n\r'+x  +';';
  //      }
  //    })
  //  if (abort){return null }
  //   return sql
  // }
 function ConditionSqlResult(error,results) {
    if (error)
    {
      res.send(results);
      return;
    }

    if (results.length==0)
    {
      dbexec();
    }
    else
    {
      res.send({"returnCode":-1,"returnDescribe":results[0].ErrorMessage ,items:[{"result":"fail","resultDescribe":results[0].ErrorMessage}]});
    }

    return;
  };
  function  dbexec() {
    var sqlstr=_routerApiTable.ApiExecSql;
    var options  = {
          sql : sqlstr,
          handler : retrunJson,
          args:args
        };
      if (_routerApiTable.ApiType=='FORM_LIST_READ'  )   //列表读语句
        {var sqls=generateListSqlStr(args,_routerApiTable.ApiExecSql);
          if (sqls===null){res.send(returnInfo.api.e1007); return;}
          options.sql=sqls;
          mssql.execQuery(options);
        }
      // else if (_routerApiTable.ApiType=='FORM_LIST_EXPORT' )  // 列表导出语句
      //   {var sqls=generateListExportSqlStr(args,_routerApiTable.ApiExecSql);
      //     if (sqls===null){res.send(returnInfo.api.e1007); return;}
      //     options.sql=sqls;
      //     mssql.execQuery(options);
      //   }
      else if (_routerApiTable.ApiType=='FORM_READ' || _routerApiTable.ApiType=='FORM_LIST_EXPORT' || _routerApiTable.ApiType=='FORM_DELETE' )   // 单据读取语句
      {//var sqls=generateReadSqlStr(args,_routerApiTable.ApiExecSql);
       // if (sqls===null){res.send(returnInfo.api.e1007); return;}
       // options.args.sqlstr=sqls;
        mssql.execQuery(options);
      }
      else if (_routerApiTable.ApiType=='FORM_SAVE'  )   //自动生成单据保存语句
      {var sqls=generateSaveSqlStr(args,_routerApiTable.AutoGenerateSqlTableName);
        if (sqls===null){res.send(returnInfo.api.e1007); return;}
        if (sqls===''){res.send(returnInfo.api.e1009); return;}
        options.args.sqlstr=sqls;
        mssql.execQuery(options);
      }
      // else if (_routerApiTable.ApiType=='FORM_DELETE' )   // 单据删除语句
      // {var sqls=generateDeleteSqlStr(args,_routerApiTable.ApiExecSql);
      //   if (sqls===null){res.send(returnInfo.api.e1007); return;}
      //   options.args.sqlstr=sqls;
      //   mssql.execQuery(options);
      // }
      else {
          sql.execQuery(options);
      }
  }
  function exec()
  {
    var sqlstr=_routerApiTable.ApiExecSql;
    var ConditionSql=lodash.trim(_routerApiTable.ApiExecConditionSql);
    //非开放API和受控于角色权限的API需要判断权限
    if (_routerApiTable.IsOpen==0 && _routerApiTable.IsAllowRoleRight==1 )
    {
      let apiRightSql=' select \'您没有权限执行此操作\'  as ErrorMessage from dgn_router_api m where IsValid=0  and apiid= '+_routerApiTable.ApiID+' and  not exists		 (select 1 from dgn_role_user a	 inner join dgn_role_rights b on a.RoleID=b.RoleID	  where a.UserID='+args.userid+' and 	b.dataid=m.RouteID )';
       if (ConditionSql && ConditionSql!='')
       {
         ConditionSql=apiRightSql+' union all '+ConditionSql;
       }
       else
       {
         ConditionSql=apiRightSql;
       }
    }

    //执行API的SQL之前做下逻辑判断 不符合条件将不执行SQL语句
    if (ConditionSql && ConditionSql!='')
    {
          var conditionSqlOptions  = {
          sql : ConditionSql,
          handler : ConditionSqlResult,
          args:args
        };
         mssql.execQuery(conditionSqlOptions);
    }
    else
    {
      dbexec();
    }
    return;
  };
//--------------------start--------------------------//
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
