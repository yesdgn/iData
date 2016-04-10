module.exports = {
  "db" : {
    "e2000" : {
      "returnCode" : 2000,
      "result":"fail",
      "returnDescribe" : "数据库连接异常"
    },
    "e2001" : {
      "returnCode" : 2001,
      "result":"fail",
      "returnDescribe" : "数据库执行返回错误"
    },
    "e2002" : {
      "returnCode" : 2002,
      "result":"fail",
      "returnDescribe" : "数据库执行返回错误"
    }
  },
  "app" : {
    "e4000" : {
      "returnCode" : 4000,
      "result":"fail",
      "returnDescribe" : "不支持的路由"
    },
  },
  "api" : {
    "e1000" : {
      "returnCode" : 1000,
      "result":"fail",
      "returnDescribe" : "没有该API接口"
    },
    "e1002":{"returnCode":1002,"result":"fail","returnDescribe":"请检查ApiTable配置"},
    "e1004":{"returnCode":1004,"result":"fail","returnDescribe":"sessionkey错误"},
    "e1003":{"returnCode":1003,"result":"fail","returnDescribe":"sessionkey未传入"}
  }
};
