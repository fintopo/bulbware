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
  return {
    lib: {
      wait: wait
      ,makeStandardPassword: makeStandardPassword
      ,makePassword: makePassword
      ,toHankakuNum: toHankakuNum
      ,getFileInfo: getFileInfo
      ,getRequest: getRequest
    }
  };
});
