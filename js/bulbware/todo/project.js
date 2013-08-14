define([
  'bulbware/todo/model',
  'text!templates/todo/project.html'
], function(TODO, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewProject = Backbone.View.extend({
    tagName: $.trim(templates.project_tagName) || 'div',
    className: $.trim(templates.project_className) || '',
    template: templates.project,
    initialize: function(options) {
      this.model = options.model;
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(_.result(_this, 'template'), _this.model.attributes));
      //
      return _this;
    }
  });
  //
  var viewProjects = Backbone.View.extend({
    tagName: $.trim(templates.projects_tagName) || 'div',
    className: $.trim(templates.projects_className) || '',
    initialize: function(options) {
      var _this = this;
      //
      _this.collection = options.collection;
      _this.listenTo(this.collection, 'sync', this.render);
      //        _this.listenTo(this.collection, 'add', this.render);
      //
      this.viewItem = options.viewItem || TODO.View.Project;
      //
      _this.render();
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(templates.projects);
      //
      _this.collection.each(function(model){
        var view = new _this.viewItem({
          model: model
        });
        _this.$('.jsc_projects').append(view.$el);
        view.render();
        _this.addView(view);
      });
      //
      return _this;
    },
    addView: function(view){}
  });
  //
  var viewEditProject = Backbone.View.extend({
    tagName: $.trim(templates.edit_project_tagName) || 'div',
    className: $.trim(templates.edit_project_className) || '',
    template: function(){
     return (this.flagEdit) ? templates.edit_project : templates.view_project;
    },
    initialize: function(options) {
      this.model = options.model;
      this.collection = options.collection;
      this.flagEdit = options.flagEdit;
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(_.result(_this, 'template'), _this.model.attributes));
      //
      return _this;
    },
    events: {
      'click .jscbtn_to_view': 'toView',
      'click .jscbtn_to_edit': 'toEdit',
      'click .jscbtn_save': 'save',
      'click .jscbtn_delete': 'delete'
    },
    toEdit: function(){
      this.flagEdit = true;
      this.render();
    },
    toView: function(){
      this.flagEdit = false;
      this.render();
    },
    save: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.$('.jscinput_name').val()
      }, {silent: true});
      //
      _this.trigger('save');
      //
      _this.model.save(null, {
        success: function(){
          _this.trigger('afterSave');
          if (_this.collection) {
            _this.collection.add(_this.model);
          }
        }
      });
    },      
    delete: function(){
      var _this = this;
      //
      if (typeof _this.beforeDelete == 'function') {
        if (_this.beforeDelete() === false) {
          return;
        }
      }
      //
      _this.model.destroy({
        success: function(){
          _this.trigger('afterDelete');
        }
      });
    }      
  });
  //
  return {
    templates: templates,
    project: viewProject,
    projects: viewProjects,
    editProject: viewEditProject
  };
});  
