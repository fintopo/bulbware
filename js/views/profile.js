define([
  'bulbware/view',
  'models/profile',
  'text!views/profile.html'
], function(bulbwareView, modelsProfile, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var modelProfile = new modelsProfile.Model.Profile();
  modelProfile.fetch();
  // Profile表示用
  var viewProfile = Marionette.ItemView.extend({
    model: modelProfile
    ,modelEvents: {
      sync: 'render'
    }
  });
  bulbwareView.mixin.template(viewProfile, templates, 'profile');
  // Profile編集用
  var editProfile = Marionette.ItemView.extend({
    model: modelProfile
    ,modelEvents: {
      sync: 'toView'
    }
    ,ui: {
      input_name: '.jscinput_name'
      ,input_email: '.jscinput_email'
    }
    ,beforeSave: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.ui.input_name.val()
        ,email: _this.ui.input_email.val()
      });
    }
  });
  bulbwareView.mixin.toggleEdit(editProfile);
  bulbwareView.mixin.template(editProfile, templates, 'edit_profile');
  //
  return {
    Profile: modelProfile
    ,View: {
      Profile: viewProfile
      ,editProfile: editProfile
    }
  };
});  
