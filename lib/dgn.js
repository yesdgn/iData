var lodash =  require('lodash');
var CryptoJS =  require('crypto-js');

exports.ifNull=function(obj)
{
  if (lodash.isString(obj) && obj==='' ) return true;
  if (lodash.isArray(obj) && obj.length===0 ) return true;
  if (obj===undefined ) return true;
  if (lodash.isPlainObject(obj) && size(obj)<=0)  return true;
  if (lodash.isNaN(obj)) return true;
  if (lodash.isNil(obj)) return true;
  if (lodash.isNull(obj)) return true;
  return false;
}

ifNull=function(obj)
{
  if (lodash.isString(obj) && obj==='' ) return true;
  if (lodash.isArray(obj) && obj.length===0 ) return true;
  if (obj===undefined ) return true;
  if (lodash.isPlainObject(obj) && size(obj)<=0)  return true;
  if (lodash.isNaN(obj)) return true;
  if (lodash.isNil(obj)) return true;
  if (lodash.isNull(obj)) return true;
  return false;
}

exports.getRand=function() {
  var n=lodash.now().toString()+generateMixedNum(5);
   return  n;
}
exports.getRandomNum=function(Min,Max)
{
  var Range = Max - Min;
  var Rand = Math.random();
  return(Min + Math.round(Rand * Range));
}

const chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
exports.generateMixedStr=function(length) {
     var res = "";
     for(var i = 0; i < length ; i ++) {
         var id = Math.ceil(Math.random()*35);
         res += chars[id];
     }
     return res;
}
const chars1 = ['0','1','2','3','4','5','6','7','8','9'];
generateMixedNum=function(length) {
     var res = "";
     for(var i = 0; i < length ; i ++) {
         var id = Math.ceil(Math.random()*9);
         res += chars1[id];
     }
     return res;
}



exports.checkUrl=function(paramsObj)
{
 var params=paramsObj;
 var stringC='';
 var stringB='';
 var urlsign=params.sign;

 var stringA=lodash.chain(params)
 .omit(['sign'])
 .keys()
 .sortBy()
 .value();

 stringA.map( function(key) {
    if(ifNull(params[key]))
    {
      stringB= (ifNull(stringB)?'':stringB+'&')+key+'='+params[key];
    }
    else {
      stringC= (ifNull(stringC)?'':stringC+'&')+key+'='+encodeURIComponent(params[key]);
    }
    return;
  })

 var sign=lodash.toUpper(CryptoJS.MD5(stringC).toString());

 return urlsign==sign
}

exports.dateFormat=function(date,format){
  var d=new Date(date);
var o = {
"M+" : d.getMonth()+1, //month
"d+" : d.getDate(), //day
"h+" : d.getHours(), //hour
"m+" : d.getMinutes(), //minute
"s+" : d.getSeconds(), //second
"q+" : Math.floor((d.getMonth()+3)/3), //quarter
"S" : d.getMilliseconds() //millisecond
}

if(/(y+)/.test(format)) {
format = format.replace(RegExp.$1, (d.getFullYear()+"").substr(4 - RegExp.$1.length));
}
for(var k in o)
  {if(new RegExp("("+ k +")").test(format))
 format = format.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
 }
 return format;
 }


 exports.transformJson=function(ApiType,results,args)
 {
    var resultsJsonObject={"returnCode":0};
   if (ApiType=='SQL')
     {
       resultsJsonObject.items=results;
       return resultsJsonObject;
     }
    else if (ApiType=='FORM_LIST_READ'  )  //  读列表SQL语句  固定会有两条SQL语句（第一条为列表总记录数）
                {
                  resultsJsonObject.items={};
                    for(var i=0;i<results.length;i++)
                      {
                        resultsJsonObject.items['item'+i]=results[i];
                      }
                    return resultsJsonObject;
                }
    else if (ApiType=='FORM_READ'   )  // 自动生成读SQL语句
          {
            resultsJsonObject.items={};
            if (lodash.isArray(results[0])) //有两条SQL语句返回与一条SQL语句返回不一样 所以要判断一下
            {
              for(var i=0;i<results.length;i++)
                {
                   resultsJsonObject.items['item'+i]=results[i];
                }
            }
             else
            {
              resultsJsonObject.items['item0']=results;
            }
              return resultsJsonObject;
          }
    else if (ApiType=='FORM_SAVE'  )  // 自动生成保存SQL语句
       {
         if (results.insertId &&  results.insertId>0)
         {  resultsJsonObject.items=[{result:"success",resultDescribe:"保存成功",insertId:results.insertId}];}
         else {resultsJsonObject.items=[{result:"success",resultDescribe:"保存成功"}];}
         return resultsJsonObject;
       }
    else if (ApiType=='FORM_DELETE'  )  //  删除SQL语句
       {
         resultsJsonObject.items=[{result:"success",resultDescribe:"删除成功"}];
         return resultsJsonObject;
       }
   else if (ApiType=='PROC_S')  // 只有一个查询返回对象
     {
       resultsJsonObject.items=results[0];
       return resultsJsonObject;
     }
   else if  (ApiType=='PROC_M') // 有多个查询返回对象
     {  resultsJsonObject.items={};
       for(var i=0;i<results.length-1;i++)
         {
         //var item={};
         //item['item'+i]=results[i];
         resultsJsonObject.items['item'+i]=results[i];
        }

       return resultsJsonObject;
     }
   else if (ApiType=='FORM_LIST_EXPORT'   )  //  导出列表SQL语句
                {
                  resultsJsonObject.items=results;
                  return resultsJsonObject;
                }
   else if (ApiType=='TREE')  // 返回树对象
     {
       var treeJson={};
       var result;
       if (results.length===2 && results[1].serverStatus )
       {result=results[0];}
       else
       {result=results;}
       buildTreeJson(result,args.rootValue,treeJson,args.nodeColName,args.parentNodeColName);
       resultsJsonObject.items=treeJson.children || [] ;
       return resultsJsonObject;
     }
   else
     {return results;}
 }

 function buildTreeJson(results,rootValue,parentObject,nodeColName,parentNodeColName) {
    var childItem=results.filter((x,index) => {
         return (x[parentNodeColName]==rootValue)
       })
    if (childItem.length>0)
      { parentObject['children']=childItem;
    }

    for (y in childItem)
      {
        buildTreeJson(results,childItem[y][nodeColName],parentObject.children[y],nodeColName,parentNodeColName);
      }
    return ;
 }


  exports.getPath=function(path)
  {
    //var b='\\\\';
    var b='/';
    return (path.replace(/\\/g,b));
  }

  //替换生成的SQL语句中的"和\
  exports.replacestr=function(str) {
    if (ifNull(str))
      return '';
    if (!lodash.isString(str)){return str;}
    var s= str.replace(/["\\]/gi, function (txt, key) {
       return '\\'+txt;
    })
    return  s ;
    }
