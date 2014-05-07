define([
  'bulbware/view'
  ,'models/project'
  ,'text!views/project.html'
], function(bulbwareView, modelsProject, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewProject = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
    ,setAction: function(){
      var method = (this.model.id == Backbone.history.fragment) ? 'addClass' : 'removeClass';
      this.$el[method]('active');
    }
  });
  bulbwareView.mixin.template(viewProject, templates, 'item');
  //
  var viewProjects = Marionette.CompositeView.extend({
    itemView: viewProject
    ,initialize: function(options) {
      var _this = this;
      //
      _this.collection = new modelsProject.Collection.Projects();
      //
      _this.listenTo(_this, 'before:item:added', function(view){
        view.listenTo(_this, 'action', view.setAction);
      });
      //
      _this.collection.search();
    }
    ,events: {
      'click .jscbtn_add_project': 'clickAddProject'
    }
    ,clickAddProject: function(){
      var _this = this;
      //
      var model = _this.collection.getNewModel('create', {
        name: '新しいプロジェクト'
      });
      _this.listenToOnce(model, 'sync', function(){
        _this.trigger('newProject', model);
      });
    }
  });
  bulbwareView.mixin.template(viewProjects, templates, 'list');
  //
  var editProject = Marionette.ItemView.extend({  
    initialize: function(options) {
      var _this = this;
      //
      _this.collectionTasks = options.collectionTasks;
    }
    ,ui: {
      first: '.jscinput_name'
      ,input_name: '.jscinput_name'
    }
    ,beforeSave: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.ui.input_name.val()
      });
    }
    ,beforeDelete: function(){
      var _this = this;
      //
      if (_this.collectionTasks.length > 0) {
        alert(templates.error_delete);
        return false;
      }
      return confirm(SNBinder.bind(templates.confirm_delete, _this.model.attributes));
    }
  });
  bulbwareView.mixin.toggleEdit(editProject);
  bulbwareView.mixin.template(editProject, templates, 'detail');
  //
  return {
    View: {
      Project: viewProject
      ,Projects: viewProjects
      ,editProject: editProject
    }
  };
});
