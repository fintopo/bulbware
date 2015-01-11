define([
  'bulbware/view'
  ,'models/todo'
  ,'text!views/todo.html'
], function(bulbwareView, models, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var Projects = new models.Collection.Projects();
  //
  var viewProject = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
    ,onSelectItem: function(){
      Backbone.history.navigate('project/'+this.model.id, {trigger: true});
    }
  });
  bulbwareView.mixin.template(viewProject, templates, 'item');
  //
  var viewProjects = Marionette.CompositeView.extend({
    childView: viewProject
    ,initialize: function(options) {
      var _this = this;
      //
      _this.collection = Projects;
      _this.collection.search();
    }
  });
  bulbwareView.mixin.template(viewProjects, templates, 'list');
  bulbwareView.mixin.list(viewProjects);
  //
  var viewHeader = Marionette.ItemView.extend({
    ui: {
      first: '.jsinput_name'
      ,name: '.jsinput_name'
      ,'memo': '.jsinput_memo'
    }
    ,saveToView: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.ui.name.val()
      });
      //
      _this.model.set_options({
        'memo': _this.ui.memo.val()
      });
      //
      _this.model.save();
    }
    ,onToEdit: function(){
      var _this = this;
      //
      if (_this.model.isNew()) {
        _this.$('.jsbtn_delete').hide();
        _this.$('.jsbtn_to_view').hide();
      }
    }
  });
  bulbwareView.mixin.toggleEdit(viewHeader);
  bulbwareView.mixin.template(viewHeader, templates, 'header');
  //
  var viewDetail = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
    ,ui: {
      first: '.jsinput_name'
      ,name: '.jsinput_name'
      ,'memo': '.jsinput_memo'
    }
    ,saveToView: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.ui.name.val()
      });
      //
      _this.model.set_options({
        'memo': _this.ui.memo.val()
      });
      //
      _this.model.save();
    }
  });
  bulbwareView.mixin.toggleEdit(viewDetail);
  bulbwareView.mixin.template(viewDetail, templates, 'detail');
  //
  var viewDetails = Marionette.CompositeView.extend({
    childView: viewDetail
    ,initialize: function(options) {
      var _this = this;
      //
      _this.collection = _this.model.getTasks();
    }
    ,getModelDefaults: function(){
      return {
        project_id: this.model.id
      };
    }
  });
  bulbwareView.mixin.details(viewDetails);
  bulbwareView.mixin.template(viewDetails, templates, 'details');
  //
  var panelProject = Marionette.LayoutView.extend({  
    getFragment: function(){
      return 'project/'+this.model.id;
    }
    ,initialize: function(options) {
      var _this = this;
      //
      _this.view_header = new viewHeader({
        model: options.model
      });
      //
      _this.view_details = new viewDetails({
        model: options.model
      });
    }
    ,regions: {
      'header': '.header'
      ,'details': '.details'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.header.show(_this.view_header);
      _this.details.show(_this.view_details);
    }
    ,onDelete: function(){
      return !window.confirm('削除します');
    }
    ,onAfterDelete: function(){
      this.closePanel();
    }
  });
  bulbwareView.mixin.edit(panelProject);
  bulbwareView.mixin.template(panelProject, templates, 'project');
  //
  return {
    Projects: Projects
    ,View: {
      Project: viewProject
      ,Projects: viewProjects
      ,panelProject: panelProject
    }
  };
});
