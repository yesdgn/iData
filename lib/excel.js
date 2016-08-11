var mssql = require('./mysqlmsdb');
var dgn = require('./dgn');
var XLSX = require('xlsx');
var lodash =  require('lodash');
exports.readExcel = function (req, res,userid,path,filename, opts) {
  function retrunJson(error,results) {
    if (error)
    {
      res.send(results);
      return;
    }
    // var resultsJson;
    // resultsJson=dgn.transformJson(_routerApiTable.TransformJsonType,args.apiAction,results);
    // res.send(resultsJson);
  
    res.send(results);
    return;
  };
    const workbook = XLSX.readFile(path, opts);
    // 获取 Excel 中所有表名
    const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
    // 根据表名获取对应某张表
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
        colNames.map(function (colName) {
            createTableSql=createTableSql+',`'+colName+'` varchar(1000)';
            insertColSql=insertColSql+',`'+colName+'`';
        });
        insertColSql=insertColSql.substring(1);
        excelJson.map(function (data) {
            var insertRowSql='';
             colNames.map(function (colName) {
                //  insert links (name,url) values('jerichen','gdsz'),('alone','gdgz');
                    insertRowSql=insertRowSql+','+dgn.replacestr(data[colName])  ;
                });
            insertRowSql=insertRowSql.substring(1);
            insertDataSql=insertDataSql+',('+insertRowSql+')';
        });
        insertDataSql=insertDataSql.substring(1);
        createTableSql='CREATE TABLE `'+tablename+'` ( `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,`UserID` bigint(20) unsigned,`CreateTime` datetime   DEFAULT CURRENT_TIMESTAMP '+createTableSql+',PRIMARY KEY (`ID`)) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;';
        insertTableSql='INSERT INTO `'+tablename+'` ('+insertColSql+') VALUES '+insertDataSql+';';
        sqlStr=createTableSql+insertTableSql+' update `'+tablename+'` set UserID='+userid+';'
        // console.log(sqlStr);
         var options  = {
            sql : sqlStr,
            handler : retrunJson,
            };
           mssql.execQuery(options);
    })
    

}