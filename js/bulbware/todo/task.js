define([
  'bulbware/todo/model',
  'text!templates/todo/task.html'
], function(TODO, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewTask = Backbone.View.extend({
    tagName: $.trim(templates.task_tagName) || 'div',
    className: $.trim(templates.task_className) || '',
    template: templates.task,
    initialize: function(options) {
      this.model = options.model;
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'sync', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(_.result(_this, 'template'), _this.model.attributes));
      //
      return _this;
    },
    showCompleted: function(mode){
      if (this.model.get('completed')) {
        this.$el.addClass('checked');
        if (mode) {
          this.$el.show('fast');
        } else {
          this.$el.hide();
        }
      } else {
        this.$el.addClass('unchecked');
        this.$el.show('fast');
      }
    },
    events: function () {
      return _.defaults({
        'change .jscinput_completed': 'setCompleted'
      }, _.result(Backbone.View.prototype, 'events'));
    },
    setCompleted: function(){
      this.model.setCompleted(this.$('.jscinput_completed').checked());
    }
  });
  //
  var viewTasks = Backbone.View.extend({
    tagName: $.trim(templates.tasks_tagName) || 'div',
    className: $.trim(templates.tasks_className) || '',
    template: templates.tasks,
    initialize: function(options) {
      this.collection = options.collection;
      this.listenToOnce(this.collection, 'sync', this.render);
      this.listenTo(this.collection, 'sync', this.sync);
      this.listenTo(this.collection, 'sort', this.sync);
      //
      this.viewItem = options.viewItem || viewTask;
      this.flagShowCompleted = options.flagShowCompleted;
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(_.result(_this, 'template'), {
        flagShowCompleted: (this.flagShowCompleted) ? 'checked' : ''
      }));
      //
      return _this;
    },
    sync: function(){
      var _this = this;
      //
      _this.$('.jsc_tasks').empty();
      _this.collection.each(function(model){
        var view = new _this.viewItem({
          model: model,
          collection: _this.collection
        });
        _this.$('.jsc_tasks').append(view.$el);
        view.render();
        view.listenTo(_this, 'showCompleted', view.showCompleted);
        view.showCompleted(_this.flagShowCompleted);
        _this.addView(view);
      });
      //
      _this.$('.jscinput_sort').val(_this.collection.comparator);
    },
    setShowCompleted: function(mode){
      this.flagShowCompleted = mode;
      this.trigger('showCompleted', mode);
    },    
    addView: function(view){},
    events: {
      'change .jscinput_show_completed': 'changeShowCompleted',
      'change .jscinput_sort': 'changeSort',
      'click .jscbtn_delete_all_completed': 'deleteAllCompleted',
      'click .jscbtn_refresh': 'refresh'
    },
    changeShowCompleted: function(){
      this.setShowCompleted(this.$('.jscinput_show_completed').checked());
    },
    changeSort: function(){
      this.collection.setSort(this.$('.jscinput_sort').val());
    },
    deleteAllCompleted: function(){
      if (typeof this.beforeDeleteAllCompleted == 'function') {
        if (this.beforeDeleteAllCompleted() === false) {
          return;
        }
      }
      this.collection.deleteAllCompleted();
    },
    refresh: function(){
      this.collection.fetch();
    }
  });
  //
  var viewEditTask = viewTask.extend({
    tagName: $.trim(templates.edit_task_tagName) || 'div',
    className: $.trim(templates.edit_task_className) || '',
    template: function (){
      return (this.is_edit) ? templates.edit_task : templates.view_task;
    },
    initialize: function(options) {
      options = options || {};
      this.collection = options.collection;
      this.is_edit = options.is_edit;
      viewTask.prototype.initialize.apply(this, arguments);
    },
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(_.result(_this, 'template'), _this.model.attributes));
      //
      return _this;
    },
    events: function () {
      return _.defaults({
        'click .jscbtn_to_view': 'toView',
        'click .jscbtn_to_edit': 'toEdit',
        'click .jscbtn_save': 'save',
        'click .jscbtn_delete': 'delete'
      }, _.result(viewTask.prototype, 'events'));
    },
    toEdit: function(){
      this.is_edit = true;
      this.render();
      this.trigger('toEdit');
    },
    toView: function(){
      this.is_edit = false;
      this.render();
      this.trigger('toView');
    },
    setCompleted: function(){
      if (this.is_edit) return;
      viewTask.prototype.setCompleted.apply(this, arguments);
    },
    save: function(){
      var _this = this;
      //
      _this.model.set({
        name: _this.$('.jscinput_name').val(),
        options: {},
        start_datetime: _this.$('.jscinput_start_datetime').val(),
        due_datetime: _this.$('.jscinput_due_datetime').val(),
        completed: _this.$('.jscinput_completed').checked(),
        tags: _this.$('.jscinput_tags').val()
      }, {silent: true});
      //
      _this.trigger('save');
      //
      var flagNew = _this.model.isNew();
      _this.model.save(null, {
        success: function(){
          _this.trigger('afterSave');
          //
          if (flagNew) {
            if (_this.collection) {
              _this.collection.add(_this.model);
            }
            _this.remove();
          } else {
            _this.toView();
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
    task: viewTask,
    tasks: viewTasks,
    editTask: viewEditTask
  };
});  
