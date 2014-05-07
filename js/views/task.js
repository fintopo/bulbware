define([
  'bulbware/view'
  ,'models/task'
  ,'text!views/task.html'
  ,'lib/alt-checkbox-master/jquery.alt-checkbox.min' // http://alt-checkbox.starikovs.com/
], function(bulbwareView, modelsTask, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewTask = Marionette.ItemView.extend({
    initialize: function(options) {
      var _this = this;
      //
      _this.listenTo(_this, 'render', _this.afterRender);
    }
    ,modelEvents: {
      sync: 'render'
    }
    ,ui: {
      first: '.jscinput_name'
      ,input_name: '.jscinput_name'
      ,input_memo: '.jscinput_memo'
      ,input_date: '.jscinput_date'
      ,check_finished: '.jsccheck_finished'
    }
    ,beforeSave: function(){
      var _this = this;
      //
      _this.setModelTag();
      //
      _this.model.set({
        element_datetime: _this.ui.input_date.val()
      });
      _this.model.set_options({
        name: _this.ui.input_name.val()
        ,memo: _this.ui.input_memo.val()
      });
    }
    ,beforeDelete: function(){
      var _this = this;
      //
      return confirm(SNBinder.bind(templates.confirm_delete, _this.model.attributes));
    }
    ,afterRender: function(){
      this.ui.check_finished.altCheckbox();
      this.setClassChecked();
    }
    ,setClassChecked: function(){
      if (this.ui.check_finished.checked()) {
        this.$el.addClass('checked');
        this.$el.removeClass('unchecked');
      } else {
        this.$el.addClass('unchecked');
        this.$el.removeClass('checked');
      }
    }
    ,setModelTag: function(){
      var _this = this;
      //
      if (_this.ui.check_finished.checked()) {
        _this.model.addTag(_this.model.tag_finished);
        _this.model.removeTag(_this.model.tag_unfinished);
      } else {
        _this.model.removeTag(_this.model.tag_finished);
        _this.model.addTag(_this.model.tag_unfinished);
      }
    }
    ,events: {
      'click .alt-checkbox': 'setChecked'
    }
    ,setChecked: function(){
      var _this = this;
      if (_this.is_edit) return;
      //
      _this.setModelTag();
      _this.model.save();
    }
  });
  bulbwareView.mixin.toggleEdit(viewTask);
  bulbwareView.mixin.template(viewTask, templates, 'item');
  //
  var viewTasks = Marionette.CompositeView.extend({
    itemView: viewTask
    ,initialize: function(options) {
      var _this = this;
      //
      _this.collection = new modelsTask.Collection.Tasks();
    }
    ,setProject: function(model_project){
      var _this = this;
      //
      if (model_project) {
        _this.project_id = model_project.id;
        _this.collection.search({
          project: _this.project_id,
          tags: []
        });
      } else {
        _this.collection.reset();
      }
    }
    ,events: {
      'click .jscbtn_add_task': 'clickAddTask'
    }
    ,clickAddTask: function(){
      var _this = this;
      //
      _this.collection.getNewModel(true, {
        project_id: _this.project_id
      });
    }
  });
  bulbwareView.mixin.template(viewTasks, templates, 'list');
  //
  return {
    View: {
      Task: viewTask
      ,Tasks: viewTasks
    }
  };
});
