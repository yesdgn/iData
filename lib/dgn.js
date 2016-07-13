var lodash =  require('lodash');
var CryptoJS =  require('crypto-js');

exports.ifNull=function(obj)
{
  if (lodash.isString(obj) && obj==='' ) return true;
  if (lodash.isNaN(obj)) return true;
  if (lodash.isNil(obj)) return true;
  if (lodash.isNull(obj)) return true;
  return false;
}

ifNull=function(obj)
{
  if (lodash.isString(obj) && obj==='' ) return true;
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


 exports.transformJson=function(TransformJsonType,results)
 {
    var resultsJsonObject={"returnCode":0};
   if (TransformJsonType=='VIEW')
     {
       resultsJsonObject.items=results;
       return resultsJsonObject;
     }
    else if (TransformJsonType=='AUTOSAVE')  // 自动生成保存SQL语句 返回类型
       {
         resultsJsonObject.items=[{result:"success",resultDescribe:"保存成功"}];
         return resultsJsonObject;
       }
    else if (TransformJsonType=='AUTOREAD')  // 自动生成读SQL语句 返回类型
          {
            resultsJsonObject.items={};
              for(var i=0;i<results.length;i++)
                {
                  if (results.length==1) {resultsJsonObject.items['item'+i]=results;}
                  else  {resultsJsonObject.items['item'+i]=results[i];}
                }
              return resultsJsonObject;
          }
   else if (TransformJsonType=='PROC_S')  // 只有一个查询返回对象
     {
       resultsJsonObject.items=results[0];
       return resultsJsonObject;
     }
   else if  (TransformJsonType=='PROC_M') // 有多个查询返回对象
     {  resultsJsonObject.items={};
       for(var i=0;i<results.length-1;i++)
         {
         //var item={};
         //item['item'+i]=results[i];
         resultsJsonObject.items['item'+i]=results[i];
         }
       return resultsJsonObject;
     }
   else if (TransformJsonType=='TREE')  // 返回树对象
     {
       var treeJson={};
       buildTreeJson(results[0],0,treeJson);
       resultsJsonObject.items=treeJson.children || [] ;
       return resultsJsonObject;
     }
   else
     {return results;}
 }

 function buildTreeJson(results,rootvalue,parentObject) {
    var childItem=results.filter((x,index) => {
         return (x.PMenuID==rootvalue)
       })
    if (childItem.length>0)
      { parentObject['children']=childItem;
    }

    for (y in childItem)
      { buildTreeJson(results,childItem[y].MenuID,parentObject.children[y]);}
    return ;
 }


  exports.getPath=function(path)
  {
    //var b='\\\\';
    var b='/';
    return (path.replace(/\\/g,b));
  }
