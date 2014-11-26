define([
], function(){
  // jQueryの拡張
  $.fn.checked = function(value){
    // チェックボックスを指定した引数の状態にする。
    // 引数なしの場合は状態を返す。
    if (value == undefined) {
      return $(this).is(':checked');
    } else if (value) {
      return $(this).prop('checked', true);
    } else {
      return $(this).prop('checked', false);
    }
  };
  // SNBinder拡張
  SNBinder.get_named_sections_text = function(data){
    var sections = data.split('{%}').slice(1);
    var count = sections.length;
    var dict = {};
    for (var i=0; i<count; i++) {
      dict[sections[i*2]] = sections[i*2+1];
    }
    return dict;
  };
  //
  // lib
  var wait = function(check, next) {
    // check関数の戻り値がtrueならnextを実行する
    if (check()) {
      next();
    } else {
      setTimeout(function() {
        if (check()) {
          next();
        } else {
          setTimeout(arguments.callee, 50);
        }
      }, 50);
    }
  };
  var makePassword = function (c, len) {
    // 文字列cで指定した文字を使用して、長さlenのパスワードを生成する
    var x = "" ;
    for(var j = 0; j < len; j++ ) {
      x = x + c.charAt(Math.floor( Math.random() * c.length )) ;
    }
    return x;
  };
  var makeStandardPassword = function() {
    // 標準パスワード文字列の生成
    var c = "abdeghkmnrstuwxyABDEFGHJKLMNPQRST23456789"; // 使用文字
    var len = 8; // パスワードの長さ
    return makePassword(c, len);
  };
  //
  var toHankaku = function (str) {
    // 全角を半角に変換して返す
    return str.replace(/[Ａ-Ｚａ-ｚ０-９－！”＃＄％＆’（）＝＜＞，．？＿［］｛｝＠＾～￥]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };
  var toZenkakuKana = (function(){
    // 半角カナを全角カナに変換して返す（濁点対応）
    // 参考： http://www.openspc2.org/reibun/javascript/business/003/
    var txt = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ､｡ｰ｢｣ﾞﾟ";
    var zen = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッ、。ー「」";
    var zenlen = zen.length;
    zen +=    "　　　　　ガギグゲゴザジズゼゾダヂヅデド　　　　　バビブベボ　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　";
    if (zenlen * 2 != zen.length) {
      throw 'toZenkakuKanaの定義に異常があります。';
    }
    zen +=    "　　　　　　　　　　　　　　　　　　　　　　　　　パピプペポ　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　";
    //
    return function (motoText) {
      var str = "";
      var i, len, c, n, cnext, nnext;
      for (i=0, len=motoText.length; i<len; i++) {
        c = motoText.charAt(i);
		    n = txt.indexOf(c,0);
		    if (n >= zenlen) {
          // 濁点、半濁点
          continue;
		    } else if (n >= 0){
		      cnext = motoText.charAt(i+1);
		      nnext = txt.indexOf(cnext,0);
			    if (nnext >= zenlen){ // 濁点、半濁点
				    c = zen.charAt(n+zenlen*(nnext-zenlen+1));
				    i++;
			    }else{
				    c = zen.charAt(n);
			    }
		    }
			  str += c;
      }
      return str;
    };
  })();
  var toString = function(value) {
    // 入力値を文字列に整形する
    var str = _(value).clean();
    str = toHankaku(str);
    str = str.toLowerCase();
    str = toZenkakuKana(str);
    return str;
  };
  var toHankakuNum = function (motoText) {
    // motoTextの全角数字を半角数字に変換して返す
    if (typeof(motoText) != "string") {
	  return motoText;
    }
    han = "0123456789.,-+";
    zen = "０１２３４５６７８９．，−＋";
    str = "";
    for (i=0; i<motoText.length; i++) {
	  c = motoText.charAt(i);
	  n = zen.indexOf(c,0);
	  if (n >= 0) c = han.charAt(n);
	  str += c;
    }
    return str;
  };
  var toNumber = function(value) {
    // 入力値を数値に整形する
    var ret = String(value);
    ret = $.trim(ret);
    ret = ret.replace(/[^\d\.]/g,"");
    ret = toHankakuNum(ret);
    ret = Number(ret) || 0;
    return ret;
  };
  var toDate = function(value) {
    var ret = $.trim(value);
    ret = (ret) ? moment(toHankaku(ret)).format('YYYY-MM-DD') : '';
    return ret;
  };
  //
  var getFileInfo = function(fileName) {
    // ファイル名を拡張子とそれ以外に分離する。
    var ret = { // 戻り値のタイプ
      base: '', // 拡張子以外
      ext: ''   // 拡張子（ドットは含まない）
    };
    if (!fileName) {
      return ret;
    }
    var fileTypes = fileName.split(".");
    var len = fileTypes.length;
    if (len === 0) {
      ret.base = fileName;
    } else {
      ret.ext = fileTypes[len - 1];
      ret.base = fileName.slice(0, fileName.length - ret.ext.length - 1);
    }
    return ret;
  };
  var getRequest = function(){
    // URLからGETパラメータを抽出する
    var get = {};
    if(location.search.length > 1) {
      var ret = location.search.substr(1).split("&");
      for(var i = 0; i < ret.length; i++) {
        var r = ret[i].split("=");
        get[r[0]] = r[1];
      }
    }
    return get;
  };
  //
  var mixin = function(obj, properties){
    if (!obj) return;
    _(properties).reduce(function(obj, methodBody, methodName){
      var old = obj.prototype[methodName];
      if (old) {
        if (_.isFunction(methodBody)) {
          obj.prototype[methodName] = function() {
            var oldReturn = old.apply(this, arguments);
            var newReturn = methodBody.apply(this, arguments);
            return newReturn || oldReturn;
          };
        } else if (_.isObject(methodBody)) {
          obj.prototype[methodName] = _.extend({}, _.result(obj.prototype, methodName), methodBody);
        } else {
          obj.prototype[methodName] = methodBody;
        }
      } else {
        obj.prototype[methodName] = methodBody;
      }
      return obj;
    }, obj);
    //
    return obj;
  };
  //
  var checkMailAddress = function(email){
    // サーバー側の条件と合わせること。
//    if (email.match(/^(?:(?:(?:(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+)(?:\.(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+))*)|(?:"(?:\\[^\r\n]|[^\\"])*")))\@(?:(?:(?:(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+)(?:\.(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+))*)|(?:\[(?:\\\S|[\x21-\x5a\x5e-\x7e])*\])))$/)) {
    if (email.match(/^[-+._\w]+@(?:(?:(?:(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+)(?:\.(?:[a-zA-Z0-9_!#\$\%&'*+/=?\^`{}~|\-]+))*)|(?:\[(?:\\\S|[\x21-\x5a\x5e-\x7e])*\])))$/)) {
        return true;
    } else {
        return false;
    }    
  };
  //
  var getCookie = (function(){
    var cookies = _(document.cookie).chain()
        .words(';')
        .reduce(function(ret, value){
          var values = _(value).words('=');
          ret[_.trim(values[0])] = _.trim(values[1]);
          return ret;
        }, {})
        .value();
    //
    return function(name){
      return cookies[name];
    };
  })();
  //
  var swap = function(a, b) {
    var t = a;
    a = b;
    b = t;
  };
  //
  return {
    wait: wait
    ,makeStandardPassword: makeStandardPassword
    ,makePassword: makePassword
    ,toString: toString
    ,toNumber: toNumber
    ,toDate: toDate
    ,getFileInfo: getFileInfo
    ,getRequest: getRequest
    ,mixin: mixin
    ,swap: swap
    ,checkMailAddress: checkMailAddress
    ,getCookie: getCookie
  };
});
