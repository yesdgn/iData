var muilter = require('./multerUtil');
var sql = require('./mysqldb');
var dgn = require('./dgn');
var returnInfo = require('../lib/returnInfo');
//multer  single()中的名称必须是表单上传字段的name名称。
var uploadimg =  muilter.uploadImg.any();   // muilter.array('img', 5);
exports.uploadImg = function(req, res) {
  function retrunJson(error, results) {
      //console.log('进入retrunJson');
      if (error) {
          res.send(results);
          return;
      }
      var resultsJson;
      resultsJson = dgn.transformJson('PROC_S',results);
      res.send(resultsJson);
  };
    uploadimg(req, res, function(err) {
        if (err) {
            return console.log(err);
        }
        //文件信息在req.file或者req.files中显示。
        if (req.files.length===0)   //文件可能不符合格式被过滤掉了
        {
          res.status(403).send(returnInfo.upload.e5000).end();
          return;
        }
        if (dgn.ifNull(req.body.userid) || dgn.ifNull(req.body.imgguid) )
        {
          res.status(403).send(returnInfo.upload.e5001).end();
          return;
        }
        var sqlstr = "call dgn_UploadImg ("+req.body.userid+",'"+req.files[0].originalname+"','"+dgn.getPath(req.files[0].path.substring(14))+"','"+req.files[0].fieldname+"',"+req.body.imgguid+")";
        var options = {
            sql: sqlstr,
            handler: retrunJson,
        };
        sql.execQuery(options);
    });
}

var uploadfile =  muilter.uploadFile.any();   // muilter.array('img', 5);
exports.uploadFile = function(req, res) {
  function retrunJson(error, results) {
      //console.log('进入retrunJson');
      if (error) {
          res.send(results);
          return;
      }
      var resultsJson;
      resultsJson = dgn.transformJson('PROC_S',results);
      res.send(resultsJson);
  };
    uploadfile(req, res, function(err) {
        if (err) {
            return console.log(err);
        }
        //文件信息在req.file或者req.files中显示。
        if (req.files.length===0)   //文件可能不符合格式被过滤掉了
        {
          res.status(403).send(returnInfo.upload.e5000).end();
          return;
        }
        var sqlstr = "call dgn_UploadFile ("+req.body.userid+",'"+req.files[0].originalname+"','"+dgn.getPath(req.files[0].path.substring(14))+"','"+req.files[0].fieldname+"',"+req.body.imgguid+")";
        var options = {
            sql: sqlstr,
            handler: retrunJson,
        };
        sql.execQuery(options);
    });
}
