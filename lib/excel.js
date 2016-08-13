var mssql = require('./mysqlmsdb');
var dgn = require('./dgn');
var XLSX = require('xlsx');
var lodash =  require('lodash');
var returnInfo = require('./returnInfo');
exports.readExcel = function (req, res,userid,path,filename, srcFileName) {
  function retrunJson(error,results) {
    if (error)
    {
     // res.send(results);
      return;
    }
    // var resultsJson;
    // resultsJson=dgn.transformJson(_routerApiTable.TransformJsonType,args.apiAction,results);
    // res.send(resultsJson);
  
    //res.send(results);
    return;
  };
    const workbook = XLSX.readFile(path, null);
    // 获取 Excel 中所有表名
    const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
    // 根据表名获取对应某张表
    var zSqlStr='';
    sheetNames.map(function(sheetName){
        var tablename=filename+'_'+sheetName;
        const worksheet = workbook.Sheets[sheetName];
        const excelJson=XLSX.utils.sheet_to_json(worksheet);
        var colNames=lodash.chain(excelJson[0]).keys().value();
        var createTableSql='';
        var insertColSql='';
        var insertDataSql='';
        var insertTableSql='';
        var sqlStr='';
        var colLen=Math.floor(21500/(colNames.length==0?1:colNames.length));
        colNames.map(function (colName) {
            createTableSql=createTableSql+',`'+colName+'` varchar('+colLen+')';
            insertColSql=insertColSql+',`'+colName+'`';
        });
        insertColSql=insertColSql.substring(1);
        excelJson.map(function (data) {
            var insertRowSql='';
             colNames.map(function (colName) {
                    insertRowSql=insertRowSql+','+dgn.replacestr(data[colName])  ;
                });
            insertRowSql=insertRowSql.substring(1);
            insertDataSql=insertDataSql+',('+insertRowSql+')';
        });
        insertDataSql=insertDataSql.substring(1);
        createTableSql='CREATE TABLE `'+tablename+'` ( `dgn_ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,`dgn_UserID` bigint(20) unsigned,`dgn_CreateTime` datetime   DEFAULT CURRENT_TIMESTAMP,dgn_FileName varchar(50),dgn_SheetName varchar(50)'+createTableSql+',PRIMARY KEY (`dgn_ID`)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;';
        insertTableSql='INSERT INTO `'+tablename+'` ('+insertColSql+') VALUES '+insertDataSql+';';
        sqlStr=createTableSql+insertTableSql+' update `'+tablename+'` set dgn_UserID='+userid+',dgn_FileName=\''+srcFileName+'\',dgn_SheetName=\''+sheetName+'\';call dgn_ImportExcel('+userid+',\''+tablename+'\',\''+sheetName+'\');'
        // console.log(sqlStr);
      //  zSqlStr=zSqlStr+sqlStr;
        var options  = {
            sql : sqlStr,
            handler : retrunJson,
            };
           mssql.execQuery(options);
    })

   res.send(returnInfo.upload.e5005) ;
   return;
}