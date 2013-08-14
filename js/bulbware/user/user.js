define([
  'bulbware/lib',
  'text!templates/user/user.html'
], function(BULBWARE, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var modelProfile = BULBWARE._Model.extend({
    url_get: '/user/api/get_profile',
    url_update: '/user/api/update_profile',
    url_delete: '',
    defaults: {
      name: '',
      options: {}
    },
    get_update_params: function(){
      return {
        name: this.get('name'),
        email: this.get('email'),
        option_values: this.get('option_values')
      };
    }
  });
  // Profile表示用
  var viewProfile = Backbone.View.extend({
    tagName: $.trim(templates.profile_tagName) || 'div',
    className: $.trim(templates.profile_className) || '',
    template: templates.profile,
    templates: templates,
    initialize: function(options) {
      this.model = options.model;
      this.listenTo(this.model, 'sync', this.render);
    },
    render: function() {
      this.$el.html(SNBinder.bind(_.result(this, 'template'), this.model.attributes));
      return this;
    }      
  });
  // Profile編集用
  var editProfile = viewProfile.extend({
    tagName: $.trim(templates.edit_tagName) || 'div',
    className: $.trim(templates.edit_className) || '',
    is_edit: false,
    template: function(){
      return (this.is_edit) ? templates.edit : templates.view;
    },
    templates: templates,
    initialize: function(options) {
      viewProfile.prototype.initialize.apply(this, arguments);
      this.is_edit = options.is_edit;
    },
    events: function () {
      return _.defaults({
        'click .jscbtn_to_edit': 'toEdit',
        'click .jscbtn_to_view': 'toView',
        'click .jscbtn_save': 'save'
      }, _.result(viewProfile.prototype, 'events'));
    },
    save: function(){
      var _this = this;
      //
      this.model.set({
        name: this.$('.jscinput_name').val(),
        email: this.$('.jscinput_email').val()
      }, {silent: true});
      this.model.save(null, {
        success: function(){
          _this.toView();
        }
      });
    },
    toView: function(){
      this.is_edit = false;
      this.render();
    },
    toEdit: function(){
      this.is_edit = true;
      this.render();
    }
  });
  //
  return {
    modelProfile: modelProfile,
    viewProfile: viewProfile,
    editProfile: editProfile
  };
});  
