var muilter = require('./multerUtil');
var sql = require('./mysqldb');
var dgn = require('./dgn');
var returnInfo = require('../lib/returnInfo');
var excel = require('../lib/excel');
var fs = require('fs')
var gm = require('gm').subClass({
    imageMagick: true
});
//multer  single()中的名称必须是表单上传字段的name名称。
var uploadimg = muilter.uploadImg.any(); // muilter.array('img', 5);
exports.uploadImg = function(req, res) {
    function retrunJson(error, results) {
        if (error) {
          console.log(error);
          res.status(403).send(returnInfo.upload.e5004).end();
          return;
        }
        var resultsJson;
        resultsJson = dgn.transformJson('PROC_S', results);
        res.send(resultsJson);
    };
    uploadimg(req, res, function(err) {
        if (err) {
            console.log(err);
            res.status(403).send(returnInfo.upload.e5003).end();
            return;
        }
        //文件信息在req.file或者req.files中显示。
        if (req.files.length === 0) //文件可能不符合格式被过滤掉了
        {
            res.status(403).send(returnInfo.upload.e5000).end();
            return;
        }
        if (dgn.ifNull(req.body.userid) || dgn.ifNull(req.body.imgguid)) {
            res.status(403).send(returnInfo.upload.e5001).end();
            return;
        }

        gm(req.files[0].path)
            .size(function(err, size) {
                if (err) {
                    console.log(err);
                    res.status(403).send(returnInfo.upload.e5002).end();
                    return;
                }
                var newSize = dgn.ifNull(req.body.thumbSize) ? 240 : req.body.thumbSize;
                var maxwh = size.width > size.height ? size.width : size.height;
                var r = maxwh / newSize;
                var newWidth = size.width / r;
                var newHeight = size.height / r;
                gm(req.files[0].path) //缩略图
                    .resize(newWidth, newHeight)
                    .noProfile()
                    .write(req.files[0].destination + '/t_' + req.files[0].filename, function(err) {
                        if (err) {
                            console.log(err);
                            res.status(403).send(returnInfo.upload.e5002).end();
                            return;
                        }
                        var w=dgn.ifNull(req.body.watermark)?'0':'1';
                        var sqlstr = "call dgn_UploadImg (" + req.body.userid + ",'" + req.files[0].originalname + "','" + req.files[0].destination.substring(16) + "','"+req.files[0].filename+"'," +w + "," + req.body.imgguid +','+size.width+','+size.height +")";
                        var options = {
                            sql: sqlstr,
                            handler: retrunJson,
                        };
                        sql.execQuery(options);

                    });
                    if (!dgn.ifNull(req.body.watermark))
                    {
                      gm(req.files[0].path)
                          .font("simhei.ttf", 12)
                          .drawText(size.width-235 , size.height-50 , req.body.watermark)
                          .write(req.files[0].destination + '/w_' + req.files[0].filename, function(err) {
                              if (err) {
                                  console.log(err);
                                  res.status(403).send(returnInfo.upload.e5002).end();
                                  return;
                              }
                          })
                    }
            });

    });
}

var uploadfile = muilter.uploadFile.any(); // muilter.array('img', 5);
exports.uploadFile = function(req, res) {
    function retrunJson(error, results) {
        //console.log('进入retrunJson');
        if (error) {
            res.status(403).send(returnInfo.upload.e5004).end();
            return;
        }
        var resultsJson;
        resultsJson = dgn.transformJson('PROC_S', results);
        res.send(resultsJson);
    };
    uploadfile(req, res, function(err) {
        if (err) {
          console.log(err);
          res.status(403).send(returnInfo.upload.e5003).end();
          return;
        }
        //文件信息在req.file或者req.files中显示。
        if (req.files.length === 0) //文件可能不符合格式被过滤掉了
        {
            res.status(403).send(returnInfo.upload.e5000).end();
            return;
        }
        var sqlstr = "call dgn_UploadFile (" + req.body.userid + ",'" + req.files[0].originalname+ "','" + req.files[0].destination.substring(16) + "','"+req.files[0].filename + "','" + req.files[0].fieldname + "'," + req.body.fileguid + ")";
        var options = {
            sql: sqlstr,
            handler: retrunJson,
        };
        sql.execQuery(options);
    });
}

var uploadtempfile = muilter.uploadTempFile.any(); // muilter.array('img', 5);
exports.uploadTempFile = function(req, res) {
    function retrunJson(error, results) {
        //console.log('进入retrunJson');
        if (error) {
            res.status(403).send(returnInfo.upload.e5004).end();
            return;
        }
        var resultsJson;
        resultsJson = dgn.transformJson('PROC_S', results);
        res.send(resultsJson);
    };
    uploadtempfile(req, res, function(err) {
        if (err) {
          console.log(err);
          res.status(403).send(returnInfo.upload.e5003).end();
          return;
        }
        //文件信息在req.file或者req.files中显示。
        if (req.files.length === 0) //文件可能不符合格式被过滤掉了
        {
            res.status(403).send(returnInfo.upload.e5000).end();
            return;
        }
        if ( req.body.fileguid =='ImportExcel')  //导入excel
        { excel.readExcel(req, res,req.body.userid,"./public/uploads"+req.files[0].destination.substring(16) + "/"+req.files[0].filename,req.files[0].filename);
           
        }
        // var sqlstr = "call dgn_UploadFile (" + req.body.userid + ",'" + req.files[0].originalname+ "','" + req.files[0].destination.substring(16) + "','"+req.files[0].filename + "','" + req.files[0].fieldname + "'," + req.body.fileguid + ")";
        // var options = {
        //     sql: sqlstr,
        //     handler: retrunJson,
        // };
        // sql.execQuery(options);
    });
}