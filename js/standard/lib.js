// common内で使用し、アプリケーションで拡張が必要なもの
define([
  'text!standard/lib.html'
  ,'//cdnjs.cloudflare.com/ajax/libs/autosize.js/3.0.8/autosize.min.js'
], function(templates, autosize){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var confirm = function(message, callback_ok, callback_cancel){
  // window.confirm の代わりに使用する
  // （処理が停止しないので厳密には、そのまま代わりにならない）
  // 引数
  //   message: 表示するメッセージ
  //   callback_ok: OK時のコールバック関数
  //   callback_cancel: キャンセル時のコールバック関数
    $('#confirm').html(SNBinder.bind(templates.confirm, {
      Messages:  message
    }));
    $('#modal-confirm').modal('show');
    $('#confirm').find('.jsbtn_confirm_ok').click(function(){
      $('#modal-confirm').modal('hide');
      if (_.isFunction(callback_ok)) {
        callback_ok();
      }
    });
    $('#confirm').find('.jsbtn_confirm_cancel').click(function(){
      $('#modal-confirm').modal('hide');
      if (_.isFunction(callback_cancel)) {
        callback_cancel();
      }
    });
  };
  //
  //pnotifyのオプション参考サイト http://foswiki.org/System/JQueryPNotify
  var alertInfo = function(text, options){
    new PNotify({
      title: 'Info'
      ,text: text
      ,type: 'info'
      ,delay: 3000
    });
  };
  var alertSuccess = function(text, options){
    new PNotify({
      title: 'Success'
      ,text: text
      ,type: 'success'
      ,delay: 3000
    });
  };
  var alertWarning = function(text, options){
    new PNotify({
      title: 'Warning'
      ,text: text
      ,delay: 10000
    });
  };
  var alertError = function(text, options){
    new PNotify({
      title: 'Error'
      ,text: text
      ,type: 'error'
      ,delay: 10000
    });
  };
  // commonObj.templateParams の拡張
  var expandTemplateParams = function(templateParams){
  };
  // LoginUserのadjustを拡張する
  var adjustLoginUser = function(attributes){
    var _this = this;
    //
    return attributes;
  };
  // viewのadjustで呼ばれるメソッド
  var adjustView = function(){
    var _this = this; // view
    // 表示されている時にautosizeを設定する。
    _.defer(function(){
      if (_this.$('textarea').height() > 0) {
        autosize(_this.$('textarea'));
        autosize.update(_this.$('textarea')); // サイズの更新をする
      }
    });
    // 右キャビネットの設定
    var calc_close_width = function(){
      var close_width = $(window).width() - $('#main').position().left - $('#main').width() - 20;
      if (close_width < 150) {
        close_width = 0;
      };
      return close_width;
    };
    (function(){
      var close_width = calc_close_width();
      _this.$('.cabinet-right').cabinet({
			  position: 'right'
        ,mode: 'width' // 'position'
        ,width: Math.max(390, close_width)
        ,closeWidth: close_width
        ,onMouseDown: function(){
          var $this = $(this);
          // マウスの動きに追随させるため、transition-duration を一旦 0 にする
          _this.backup_params = {
            'transition-duration': $this.css('transition-duration')
          };
          var params = {
            'transition-duration': '0s'
          };
          $this.css(params);
        }
        ,onMouseUp: function(){
          var $this = $(this);
          //
          $this.css(_this.backup_params);
        }
		  });
    })();
    $(window).resize(_.debounce(function(){
      var close_width = calc_close_width();
      _this.$('.cabinet-right').cabinet('reset', {
        closeWidth: close_width
        ,width: Math.max(390, close_width)
      });
    }));
  };
  // commonView.mixin.toggleEditのデフォルトオプション
  var toggleEditOptions = {
    scrollOptions:  {
      scrollWithEditing: true
      ,mode: true
      ,offset: 200
    }
  };
  //
  var menuItems = [
		{
      text: 'ToDo'
      ,submenu_items: [
			  {code: 'todo', obj: 'todo/todo', hidden: true}
      ]
    },{
      text: 'Standard'
      ,submenu_items: [
			  {code: 'profile', obj: 'standard/views/profile', hidden: true}
      ]
    }
  ];
  //
  return {
    confirm: confirm
    ,alertSuccess: alertSuccess
    ,alertWarning: alertWarning
    ,alertError: alertError
    ,expandTemplateParams: expandTemplateParams
    ,adjustLoginUser: adjustLoginUser
    ,adjustView: adjustView
    ,menuItems: menuItems
    ,toggleEditOptions: toggleEditOptions
  };
});
