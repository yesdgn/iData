var  multer=require('multer');
var dgn = require('./dgn');

//图像格式
var storageImg = multer.diskStorage({
     destination:  "./public/uploads/"+dgn.dateFormat(new Date(),'yyyyMM')+'/'+dgn.dateFormat(new Date(),'dd') ,
    filename: function (req, file, cb) {
         var fileFormat = (file.originalname).split(".");
         cb(null,  'img_' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
     }
});
  exports.uploadImg = multer({
    storage: storageImg,
    limits:{fileSize:1024*1024*5,files:5},
    fileFilter:function (req, file, cb) {
     if (file.mimetype=='image/png' || file.mimetype=='image/x-png' || file.mimetype=='image/jpeg' || file.minetype=='image/pjpeg' || file.mimetype=='image/bmp' )
     {    cb(null, true) }
     else
     {    cb(null, false)}
    }
 });

//任意文件
 var storageFile = multer.diskStorage({
      destination:  "./public/uploads/"+dgn.dateFormat(new Date(),'yyyyMM')+'/'+dgn.dateFormat(new Date(),'dd') ,
     filename: function (req, file, cb) {
          var fileFormat = (file.originalname).split(".");
          cb(null,  'file_' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
      }
 });
exports.uploadFile = multer({
     storage: storageFile,
     limits:{fileSize:1024*1024*5,files:5},
  });
//任意文件
 var storageTempFile = multer.diskStorage({
      destination:  "./public/uploads/temp"  ,
     filename: function (req, file, cb) {
          var fileFormat = (file.originalname).split(".");
          cb(null,  'file_' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
      }
 });
exports.uploadTempFile = multer({
     storage: storageTempFile,
     limits:{fileSize:1024*1024*5,files:5},
  });