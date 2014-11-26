// common内で使用し、アプリケーションで拡張が必要なもの
define([
  'text!standard/lib.html'
], function(templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var confirm = function(message, callback){
  // window.confirm の代わりに使用する
  // （処理が停止しないので厳密には、そのまま代わりにならない）
  // 引数
  //   message: 表示するメッセージ
  //   callback: OK時のコールバック関数
    $('#confirm').html(SNBinder.bind(templates.confirm, {
      Messages:  message
    }));
    $('#modal-confirm').modal('show');
    if (_.isFunction(callback)) {
      $('#confirm').find('.jsbtn_confirm_ok').click(function(){
        $('#modal-confirm').modal('hide');
        callback();
      });
    }
  };
  //
  //pnotifyのオプション参考サイト http://foswiki.org/System/JQueryPNotify
  var alertSuccess = function(text, options){
    this.$('.alerts').append(SNBinder.bind(templates.messageSuccess, {
      Message: text
    }));
  };
  var alertWarning = function(text, options){
    this.$('.alerts').append(SNBinder.bind(templates.messageWarning, {
      Message: text
    }));
  };
  var alertError = function(text, options){
    this.$('.alerts').append(SNBinder.bind(templates.messageError, {
      Message: text
    }));
  };
  var showModelMessages = function(model, return_messages){
    // Modelを保存した時のメッセージ表示
    this.$('.alerts').empty();
    if (return_messages.messages.length > 0) {
      _(return_messages.messages).each(function(message){
        alertWarning.call(this, message+' ('+return_messages.savetime+')');
      });
      _.delay(function(){
        this.$('.alerts').find('.alert-warning').fadeOut('slow');
      }, 5000);
    } else {
      alertSuccess.call(this, '('+return_messages.savetime+')');
      _.delay(function(){
        this.$('.alerts').find('.alert').fadeOut('slow');
      }, 3000);
    }
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
  //
  return {
    confirm: confirm
    ,alertSuccess: alertSuccess
    ,alertWarning: alertWarning
    ,alertError: alertError
    ,showModelMessages: showModelMessages
    ,expandTemplateParams: expandTemplateParams
    ,adjustLoginUser: adjustLoginUser
  };
});
