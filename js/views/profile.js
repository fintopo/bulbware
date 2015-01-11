define([
  'bulbware/view'
  ,'bulbware/obj'
  ,'text!views/profile.html'
], function(bulbwareView, bulbwareObj, templates){
  templates = SNBinder.get_named_sections_text(templates);
  // Profile表示用
  var viewProfile = Marionette.ItemView.extend({
    model: bulbwareObj.Profile
    ,modelEvents: {
      sync: 'render'
    }
    ,logout: function(){
      bulbwareObj.logout();
    }
    ,triggers: {
      'click .jsbtn_edit': 'editProfile'
      ,'click .jsbtn_logout': 'clickLogout'
    }
    ,onClickLogout: function(){
      this.logout();
    }
    ,onEditProfile: function(){
      Backbone.history.navigate('profile', {trigger: true});
    }
  });
  bulbwareView.mixin.view(viewProfile);
  bulbwareView.mixin.template(viewProfile, templates, 'profile');
  // Profile編集用
  var panelProfile = Marionette.ItemView.extend({
    getFragment: function(){
      return 'profile';
    }
    ,model: bulbwareObj.Profile
    ,ui: {
      name: '.jsinput_name'
      ,email: '.jsinput_email'
      ,memo: '.jsinput_memo'
    }
    ,onSave: function(){
      var _this = this;
      //
      _this.$('.jsbtn_save').html('保存中…');
      //
      _this.model.set({
        name: _this.ui.name.val()
        ,email: _this.ui.email.val()
        ,memo: _this.ui.memo.val()
      });
    }
    ,onAfterSave: function(){
      var _this = this;
      //
      _.delay(function(){
        _this.$('.jsbtn_save').html('保存');
      }, 1000);
    }
    ,uploadIcon: function(){
      var _this = this;
      //
      var form = _this.$('.js_file').get()[0];
      _this.model.uploadFile(form, {
        error: function() {
          console.log('error');
        },
        success: function() {
          $('.js_user_icon').attr('src', '/icon?key='+_this.model.id+'&t='+moment().valueOf());
        }
      });
    }
    ,triggers: {
      'click .jsbtn_upload_file': 'uploadIcon'
    }
    ,onUploadIcon: function(){
      this.uploadIcon();
      return false; // false を返してデフォルトの動作をキャンセル      
    }
  });
  bulbwareView.mixin.edit(panelProfile);
  bulbwareView.mixin.template(panelProfile, templates, 'edit_profile');
  //
  return {
    View: {
      Profile: viewProfile
      ,panelProfile: panelProfile
    }
  };
});  
