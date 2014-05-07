define([
  'bulbware/lib',
  'bulbware/user/user',
  'bulbware/tab',
  'text!templates/user.html'
], function(BULBWARE, User, Tab, templates){
  // ユーザー管理標準ユーザーインタフェース
  templates = SNBinder.get_named_sections_text(templates);
  var viewApp = Backbone.View.extend({
    tagName: $.trim(templates.main_tagName) || 'div',
    className: $.trim(templates.main_className) || '',
    initialize: function(options) {
      var _this = this;
      // profile用Model&View
      this.profile = new User.modelProfile();
      this.listenTo(this.profile, 'sync', this.sync);
      this.editProfile = new User.editProfile({
        model: this.profile
      });
      //
      this.render();
      this.profile.fetch();
    },
    render: function() {
      this.$el.html(templates.main);
      this.$('#profile').html(this.editProfile.$el);
      //
      return this;
    }
  });
  //
  return {
    start: function(){
      $('body').html(templates.body);
      var app = new viewApp();
      $('#main').html(app.$el);
      //
      new Tab.router({
        view: app
      });
    }
  };
});
