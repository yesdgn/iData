var mssql = require('./mysqlmsdb');
var dgn = require('./dgn');
var XLSX = require('xlsx');
var lodash = require('lodash');
var returnInfo = require('./returnInfo');
exports.importExcel = function (req, res, userid, path, filename, srcFileName) {
    function retrunJson(error, results) {
        if (error) {
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
    //var zSqlStr = '';
    sheetNames.map(function (sheetName) {
        var tablename = filename + '_' + sheetName;
        const worksheet = workbook.Sheets[sheetName];
        const excelJson = XLSX.utils.sheet_to_json(worksheet);
        var colNames = lodash.chain(excelJson[0]).keys().value();
        var createTableSql = '';
        var insertColSql = '';
        var insertDataSql = '';
        var insertTableSql = '';
        var sqlStr = '';
        var colLen = Math.floor(21500 / (colNames.length == 0 ? 1 : colNames.length));
        colNames.map(function (colName) {
            createTableSql = createTableSql + ',`' + colName + '` varchar(' + colLen + ')';
            insertColSql = insertColSql + ',`' + colName + '`';
        });
        insertColSql = insertColSql.substring(1);
        excelJson.map(function (data) {
            var insertRowSql = '';
            colNames.map(function (colName) {
                insertRowSql = insertRowSql + ',' + dgn.replacestr(data[colName]);
            });
            insertRowSql = insertRowSql.substring(1);
            insertDataSql = insertDataSql + ',(' + insertRowSql + ')';
        });
        insertDataSql = insertDataSql.substring(1);
        createTableSql = 'CREATE TABLE `' + tablename + '` ( `dgn_ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,`dgn_UserID` bigint(20) unsigned,`dgn_CreateTime` datetime   DEFAULT CURRENT_TIMESTAMP,dgn_FileName varchar(50),dgn_SheetName varchar(50)' + createTableSql + ',PRIMARY KEY (`dgn_ID`)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;';
        insertTableSql = 'INSERT INTO `' + tablename + '` (' + insertColSql + ') VALUES ' + insertDataSql + ';';
        sqlStr = createTableSql + insertTableSql + ' update `' + tablename + '` set dgn_UserID=' + userid + ',dgn_FileName=\'' + srcFileName + '\',dgn_SheetName=\'' + sheetName + '\';call dgn_ImportExcel(' + userid + ',\'' + tablename + '\',\'' + sheetName + '\');'
        // console.log(sqlStr);
        //  zSqlStr=zSqlStr+sqlStr;
        var options = {
            sql: sqlStr,
            handler: retrunJson,
        };
        mssql.execQuery(options);
    })
    // 上传excel后不管导入是否成功都直接返回客户端，不能保证导入成功 。
    res.send(returnInfo.upload.e5005);
    return;
}

exports.exportExcel = function (req, res, args,data) {
    if (data.returnCode!=0 || data.items.length==0)
    {
        res.send(returnInfo.download.e6001);
        return;
    } 
    var sheetNames=args.sheetNames.split(',');
    var wb = {
        SheetNames: sheetNames,
        Sheets:{}
    };
    data.items.map(function(x,index) {
        console.log(x);
    var _headers = lodash.chain(x[0]).keys().value();
    var _data =  x;
  
    var headers = _headers
        // 为 _headers 添加对应的单元格位置
        // [ { v: 'id', position: 'A1' },
        //   { v: 'name', position: 'B1' },
        //   { v: 'age', position: 'C1' },
        //   { v: 'country', position: 'D1' },
        //   { v: 'remark', position: 'E1' } ]
        .map((v, i) => Object.assign({}, { v: v, position: String.fromCharCode(65 + i) + 1 }))
        // 转换成 worksheet 需要的结构
        // { A1: { v: 'id' },
        //   B1: { v: 'name' },
        //   C1: { v: 'age' },
        //   D1: { v: 'country' },
        //   E1: { v: 'remark' } }
        .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { v: next.v } }), {});

    var data = _data
        // 匹配 headers 的位置，生成对应的单元格数据
        // [ [ { v: '1', position: 'A2' },
        //     { v: 'test1', position: 'B2' },
        //     { v: '30', position: 'C2' },
        //     { v: 'China', position: 'D2' },
        //     { v: 'hello', position: 'E2' } ],
        //   [ { v: '2', position: 'A3' },
        //     { v: 'test2', position: 'B3' },
        //     { v: '20', position: 'C3' },
        //     { v: 'America', position: 'D3' },
        //     { v: 'world', position: 'E3' } ],
        //   [ { v: '3', position: 'A4' },
        //     { v: 'test3', position: 'B4' },
        //     { v: '18', position: 'C4' },
        //     { v: 'Unkonw', position: 'D4' },
        //     { v: '???', position: 'E4' } ] ]
        .map((v, i) => _headers.map((k, j) => Object.assign({}, { v: v[k], position: String.fromCharCode(65 + j) + (i + 2) })))
        // 对刚才的结果进行降维处理（二维数组变成一维数组）
        // [ { v: '1', position: 'A2' },
        //   { v: 'test1', position: 'B2' },
        //   { v: '30', position: 'C2' },
        //   { v: 'China', position: 'D2' },
        //   { v: 'hello', position: 'E2' },
        //   { v: '2', position: 'A3' },
        //   { v: 'test2', position: 'B3' },
        //   { v: '20', position: 'C3' },
        //   { v: 'America', position: 'D3' },
        //   { v: 'world', position: 'E3' },
        //   { v: '3', position: 'A4' },
        //   { v: 'test3', position: 'B4' },
        //   { v: '18', position: 'C4' },
        //   { v: 'Unkonw', position: 'D4' },
        //   { v: '???', position: 'E4' } ]
        .reduce((prev, next) => prev.concat(next))
        // 转换成 worksheet 需要的结构
        //   { A2: { v: '1' },
        //     B2: { v: 'test1' },
        //     C2: { v: '30' },
        //     D2: { v: 'China' },
        //     E2: { v: 'hello' },
        //     A3: { v: '2' },
        //     B3: { v: 'test2' },
        //     C3: { v: '20' },
        //     D3: { v: 'America' },
        //     E3: { v: 'world' },
        //     A4: { v: '3' },
        //     B4: { v: 'test3' },
        //     C4: { v: '18' },
        //     D4: { v: 'Unkonw' },
        //     E4: { v: '???' } }
        .reduce((prev, next) => Object.assign({}, prev, { [next.position]: { v: next.v } }), {});

    // 合并 headers 和 data
    var output = Object.assign({}, headers, data);
    // 获取所有单元格的位置
    var outputPos = Object.keys(output);
    // 计算出范围
    var ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];

    // 构建 workbook 对象

    wb.Sheets[sheetNames[index]]=Object.assign({}, output, { '!ref': ref });
        // res.download('./public/downloads/temp/商品资料_1471139644905.xlsx', args.exportModule + '.xlsx', function (err) {
        //     if (err) {
        //         // Handle error, but keep in mind the response may be partially-sent
        //         // so check res.headersSent
        //         console.log(err);
        //         //  res.send(returnInfo.download.e6001);
        //     } else {
        //         console.log('下载文件成功');
        //         // decrement a download credit, etc.
        //         //  res.send(returnInfo.download.e6000);
        //     }

        // });

    })

    var  fileName = sheetNames[0] + '_' + Date.now() + '.xlsx';
    var exportFileName='./public/downloads/temp/' +fileName; 
    var url = '/downloads/temp/' + fileName;
    // 导出 Excel
    XLSX.writeFile(wb, exportFileName);
    
    res.send({"returnCode":0,"result":"success","returnDescribe":"导出成功", url:url});

    
}