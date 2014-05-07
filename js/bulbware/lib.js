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
  var makeStandardPassword = function() {
    // 標準パスワード文字列の生成
    var c = "abdeghkmnrstuwxyABDEFGHJKLMNPQRST23456789"; // 使用文字
    var len = 8; // パスワードの長さ
    return MakePassword(c, len);
  };
  var makePassword = function (c, len) {
    // 文字列cで指定した文字を使用して、長さlenのパスワードを生成する
    var x = "" ;
    for(var j = 0; j < len; j++ ) {
      x = x + c.charAt(Math.floor( Math.random() * c.length )) ;
    }
    return x;
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
  // backbone.js
  var _Model = Backbone.Model.extend({
    initialize: function(options) {
      options = options || {};
      this.app = options.app || 'standard';
      if (!this.url_get) {
        this.url_get = this.url_base + this.app + this.api_get;
      }
      if (!this.url_update) {
        this.url_update = this.url_base + this.app + this.api_update;
      }
      if (!this.url_delete) {
        this.url_delete = this.url_base + this.app + this.api_delete;
      }
      //
      this.listenTo(this, 'sync', this.adjust);
      this.adjust();
    },
    adjust: function() {
      var _this = this;
      // options
      var options = _this.get('options');
      if (typeof options === 'string') {
        try {
          _this.set('option_values', JSON.parse(options.split('\n').join('\\n')), {silent: true});
        } catch(err) {
        }
      }
      if (typeof _this.get('option_values') == 'undefined') {
        _this.set('option_values', {}, {silent: true});
      }
      //
      return _this;
    },
    get_option: function(param) {
      return this.get('option_values')[param];
    },
    set_options: function(params, options){
      this.set({
        option_values: $.extend(this.get('option_values'), params)
      }, _.extend({silent: true}, options));
    },
    get_update_params: function(){
      return {};
    },
    get_read_params: function(){
      return {};
    },
    get_cache_params: function(method){
      return {};
    },
    eventAfterUpdate: function(ret){
    },
    sync: function(method, model, options) {
      var cache_params = $.extend({
        bypass_cache:true, 
        cache_result:true
      }, this.get_cache_params(method));
      //
      switch (method) {
        case 'create':
        case 'update':
        var update_params = this.get_update_params();
        if (typeof update_params.option_values != 'undefined') {
          update_params.options = JSON.stringify(update_params.option_values);
        }
        //console.info(update_params);
        SNBinder.post(model.url_update, update_params, true, function(msgs) {
          //console.info(msgs);
          if (msgs.object) {
            var success = options.success;
            if (typeof success == 'function') {
              success(msgs.object);
            }
          }
        });
        break;
        case 'delete':
        SNBinder.post(model.url_delete, {id: model.id}, false, function(){
          var success = options.success;
          if (typeof success == 'function') {
            success([]);
          }
        });
        break;
      default: // read
        var get_params = $.extend({
          id: model.id
        }, this.get_read_params());
        SNBinder.get(model.url_get, get_params, true, function(ret) {
          if (ret.options) {
            try {
              ret.option_values = JSON.parse(ret.options.split('\n').join('\\n'));
            } catch(err) {
              console.error(err + ':' + ret.options);
            }
          }
          if (!ret.option_values) {
            ret.option_values = {};
          }
          //
          var success = options.success;
          if (typeof success == 'function') {
            success(ret);
          }
        }, cache_params);
      }
    }
  });
  var _Collection = Backbone.Collection.extend({
    initialize: function(options) {
      options = options || {};
      this.app = options.app || 'standard';
      if (!this.url_search) {
        this.url_search = this.url_base + this.app + this.api_search;
      }
      if (typeof options.search_params != 'undefined') {
        this.search_params = options.search_params;
      }
    },
    sync: function(method, model, options) {
      var _this = this;
      var cache_params = _.extend({
        bypass_cache:true, 
        cache_result:true
      }, options.cache_params);
      SNBinder.get(model.url_search, _this._search_params, true, function(ret) {
        var success = options.success;
        if (typeof success == 'function') {
          success(ret);
        }
      }, cache_params);
    },
    search: function(params, options) {
      this._search_params = _.extend({}, this.search_params, params);
      this.fetch(_.extend({}, options, {reset: true}));
      //
      return this;
    },
    getNewModel: function(options){
      return new this.model(_(options || {}).extend({
        app: this.app
      }));
    }
  });
  //
  var _Router = Backbone.Router.extend({
    views: [],
    removeView: function(){
      _.each(this.views, function(view){
        view.remove();
      });
      this.views = [];
    },
    setViews: function(){
      var $main_body = $('#main');
      $main_body.empty();
      _.each(this.views, function(view){
        $main_body.append(view.el);
      });
    }
  });
  //
  return {
    lib: {
      wait: wait,
      makeStandardPassword: makeStandardPassword,
      makePassword: makePassword,
      toHankakuNum: toHankakuNum,
      getFileInfo: getFileInfo
    },
    _Model: _Model,
    _Collection: _Collection,
    _Router: _Router
  };
});
