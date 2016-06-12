define([
  'bulbware/view'
  ,'todo/models/todo'
  ,'text!todo/todo.html'
], function(bulbwareView, models, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var obj_name = 'todo';
  //
  var Projects = new models.Collection.Projects();
  //
  var viewProject = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
    ,triggers: {
      'click': 'click'
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
    ,childEvents: {
      'click': 'onClick'
    }
    ,onClick: function(child, values){
      var _this = this;
      //
      _this.triggerMethod('callOrder', obj_name, values.model.id);
    }
  });
  bulbwareView.mixin.template(viewProjects, templates, 'list');
  bulbwareView.mixin.list(viewProjects);
  //
  var viewHeader = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'toView'
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
      //
      return true;
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
    objName: obj_name
    ,flagShowNoCurrent: true
    ,noCurrent: true
    ,initialize: function(options) {
      var _this = this;
      //
      _this.model = new models.Model.Project();
    }
    ,regions: {
      'header': '.header'
      ,'details': '.details'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.view_header = new viewHeader({
        model: _this.model
      });
      _this.header.show(_this.view_header);
      //
      _this.view_details = new viewDetails({
        model: _this.model
      });
      _this.details.show(_this.view_details);
    }
    ,setID: function(id){
      var _this = this;
      //
      _this.model.id = id;
      _this.model.fetch();
    }
    ,onDelete: function(){
      return !window.confirm('削除します');
    }
    ,onAfterDelete: function(){
      this.closePanel();
    }
  });
  bulbwareView.mixin.view(panelProject);
  bulbwareView.mixin.template(panelProject, templates, 'project');
  //
  return {
    name: obj_name
    ,View: {
      panel: panelProject
    }
    ,viewMenu: viewProjects
    ,collection: Projects
  };
});
