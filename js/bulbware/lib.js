define([
  '//cdnjs.cloudflare.com/ajax/libs/marked/0.3.2/marked.min.js'
  ,'moment'
  ,'underscore.string'
], function(marked, moment, _s){
  // jQueryの拡張
  $.fn.isVisible = function(){
    return $(this).is(':visible');
  };
  $.fn.checked = function(value){
    // チェックボックスを指定した引数の状態にする。
    // 引数なしの場合は状態を返す。
    if (_.isUndefined(value)) {
      return $(this).is(':checked');
    } else if (value) {
      return $(this).prop('checked', true);
    } else {
      return $(this).prop('checked', false);
    }
  };
  $.fn.asString = function(value){
    var m;
    if (_.isUndefined(value)) {
      return $.trim($(this).val());
    } else {
      return $(this).val($.trim(value));
    }
  };
  $.fn.asNumber = function(value){
    var m;
    if (_.isUndefined(value)) {
      return toNumber($(this).val());
    } else {
      return $(this).val(toNumber(value));
    }
  };
  $.fn.asDate = function(value){
    var m;
    if (_.isUndefined(value)) {
      m = moment($(this).val());
      if (m.isValid()) {
        return m.format('YYYY-MM-DD');
      } else {
        return '';
      }
    } else {
      m = moment(value);
      if (m.isValid()) {
        return $(this).val(m.format('YYYY-MM-DD'));
      } else {
        return $(this).val('');
      }
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
  SNBinder.numberFormat = function(value, decimals){
    return _.numberFormat(toNumber(value), decimals);
  };
  SNBinder.dateFormat = function(value, format){
    return moment(value).format(format || 'YYYY年MM月DD日');
  };
  SNBinder.upperCase = function(value){
    return String(value).toUpperCase();
  };
  SNBinder.marked = function(value){
    return marked(value||'').replace(/<table>/g, '<table class="table">');
  };
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
  var toString = function(value, options) {
    // 入力値を文字列に整形する
    options = _.extend({
      removeAllBlank: false
      ,toUpperCase: false
    }, options);
    //
    var str = _(value).clean();
    if (options.removeAllBlank) {
      str = str.replace(/\s+/g, '');
    }
    str = toHankaku(str);
    if (options.toUpperCase) {
      str = str.toUpperCase();
    } else {
      str = str.toLowerCase();
    }
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
    ret = toHankakuNum(ret);
    ret = ret.replace(/[^\d\.-]/g,"");
    ret = Number(ret) || 0;
    return ret;
  };
  var toDate = function(value, mode_today) {
    var init = (mode_today) ? moment().format('YYYY-MM-DD') : '';
    var ret = $.trim(value);
    var m = moment(toHankaku(ret));
    ret = (m.isValid()) ? m.format('YYYY-MM-DD') : init;
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
    var cookies = _(_s(document.cookie).words(';')).reduce(function(ret, value){
      var values = _s(value).words('=');
      ret[_s.trim(values[0])] = _s.trim(values[1]);
      return ret;
    }, {});
    //
    return function(name){
      return cookies[name];
    };
  })();
  //
  var swap = function(a, b) {
    return [b, a];
  };
  //
  var getDeep = function(obj, key){
    var keys = key.split('.');
    return _(keys).reduce(function(ret, key){
      return _.result(ret, key);
    }, obj);
  };
  var setDeep = function(obj, key, value){
    var keys = key.split('.');
    if (keys.length == 1) {
      obj[key] = value;
    } else if (keys.length >= 2) {
      var key0 = _(keys).initial().join('.');
      var elm = getDeep(obj, key0);
      if (_.isUndefined(elm)) {
        setDeep(obj, key0, {});
        elm = getDeep(obj, key0);
      }
      if (!_.isObject(elm)) {
        throw "can't set to deep because of not object.";
      }
      var key1 = _(keys).last();
      elm[key1] = value;
    }
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
    ,getDeep: getDeep
    ,setDeep: setDeep
  };
});
