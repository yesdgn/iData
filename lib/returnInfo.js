module.exports = {
  "db" : {
    "e2000" : {"returnCode" : 2000, "result":"fail", "returnDescribe" : "DB连接异常" },
    "e2001" : {"returnCode" : 2001,"result":"fail","returnDescribe" : "DB执行错误"},
    "e2002" : {"returnCode" : 2002,"result":"fail","returnDescribe" : "DB执行错误"}
  },
  "app" : {"e4000" : {"returnCode" : 4000,"result":"fail","returnDescribe" : "不支持的路由" },
  },
  "api" : {
    "e1000":{"returnCode" : 1000,"result":"fail","returnDescribe" : "没有该API接口" },
    "e1002":{"returnCode":1002,"result":"fail","returnDescribe":"请检查ApiTable配置"},
    "e1004":{"returnCode":1004,"result":"fail","returnDescribe":"您的账号可能在其他地方登录,您已下线。"},
    "e1003":{"returnCode":1003,"result":"fail","returnDescribe":"sessionkey未传入"},
    "e1005":{"returnCode":1005,"result":"fail","returnDescribe":"参数验证错误"},
    "e1006":{"returnCode":1006,"result":"fail","returnDescribe":"时间戳验证错误"}
  },
  "upload":{
    "e5000" : {"returnCode" : 5000,"result":"fail","returnDescribe" : "不支持的文件格式" },
    "e5001" : {"returnCode" : 5001,"result":"fail","returnDescribe" : "缺少参数，需要userid,imgguid" },
    "e5002" : {"returnCode" : 5002,"result":"fail","returnDescribe" : "文件处理发生错误" }
  }
};
