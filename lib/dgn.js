var lodash =  require('lodash');
var CryptoJS =  require('crypto-js');
isNull=function(obj)
{
  if (lodash.isString(obj) && obj==='' ) return true;
  if (lodash.isNaN(obj)) return true;
  if (lodash.isNil(obj)) return true;
  if (lodash.isNull(obj)) return true;
  return false;
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
    if(isNull(params[key]))
    {
      stringB= (isNull(stringB)?'':stringB+'&')+key+'='+params[key];
    }
    else {
      stringC= (isNull(stringC)?'':stringC+'&')+key+'='+params[key];
    }
    return;
  })

 var sign=lodash.toUpper(CryptoJS.MD5(stringC).toString());
 
 return urlsign==sign
}
