define([
  'bulbware/lib',
  'bulbware/todo/model',
  'bulbware/todo/project',
  'bulbware/todo/task',
  'bulbware/user/user',
  'bulbware/tab',
  'text!templates/todo.html',
  'lib/alt-checkbox-master/jquery.alt-checkbox.min', // http://alt-checkbox.starikovs.com/
  'lib/tagsinput/jquery.tagsinput' // http://xoxco.com/projects/code/tagsinput/
], function(BULBWARE, todoModels, projectViews, taskViews, User, Tab, templates){
  // Project拡張
  var viewProject = projectViews.project.extend({
    initialize: function(options) {
      var _this = this;
      //
      projectViews.project.prototype.initialize.apply(_this, arguments);
      _this.$el.addClass('tab-'+_this.model.id);
    }
  });
  var viewProjects = projectViews.projects.extend({
    render: function(options) {
      var _this = this;
      //
      projectViews.projects.prototype.render.apply(_this, arguments);
      _this.$('.tab-'+Backbone.history.fragment).addClass('active');
      _this.$('.jsc_projects').append(projectViews.templates.tab_item_add);
    }
  });
  var editProject = projectViews.editProject.extend({
    initialize: function(options) {
      projectViews.editProject.prototype.initialize.apply(this, arguments);
      //
      this.tasks = options.tasks;
    },
    beforeDelete: function(){
      if (this.tasks.length > 0) {
        alert('タスクがあるプロジェクトは削除できません。');
        return false;
      }
      return confirm('プロジェクト「' + this.model.get('name') + '」を削除します。');
    }
  });
  var addProject = projectViews.editProject.extend({
    tagName: $.trim(projectViews.templates.add_project_tagName) || 'div',
    className: $.trim(projectViews.templates.add_project_className) || '',
    render: function() {
      var _this = this;
      //
      _this.$el.html(SNBinder.bind(projectViews.templates.add_project, _this.model.attributes));
      //
      return _this;
    },
    events: function () {
      return _.defaults({
        'click .jscbtn_close_dialog': 'closeDialog'
      }, _.result(projectViews.editProject.prototype, 'events'));
    },
    closeDialog: function(){
      this.trigger('closeDialog');
    }
  });
  // Task拡張
  var viewTasks = taskViews.tasks.extend({
    render: function(){
      var _this = this;
      taskViews.tasks.prototype.render.apply(this, arguments);
      //
      this.$('.jscinput_show_completed').altCheckbox();
      this.$('.jscinput_search_tags').tagsInput({
        width: '500px',
        height: '40px',
        defaultText: 'search tag',
        onChange: function(){
          _this.collection.search_params.tags = _this.$('.jscinput_search_tags').val().split(',');
          _this.collection.fetch();
        }
      });
    },
    events:  function () {
      return _.defaults({
        'click .alt-checkbox': 'changeShowCompleted'
      }, _.result(taskViews.tasks.prototype, 'events'));
    },
    beforeDeleteAllCompleted: function(){
      return confirm('完了タスクをすべて削除します。');
    }
  });
  var editTask = taskViews.editTask.extend({
    render: function(){
      taskViews.editTask.prototype.render.apply(this, arguments);
      //
      this.$(':checkbox').altCheckbox();
      this.$('.jscinput_tags').tagsInput({
        width: '350px',
        height: '40px'
      });
    },
    events:  function () {
      return _.defaults({
        'click .alt-checkbox': 'setCompleted'
      }, _.result(taskViews.editTask.prototype, 'events'));
    },
    beforeDelete: function(){
      return confirm('タスク「' + this.model.get('name') + '」を削除します。');
    }
  });
  // 登録用View
  var addTask = taskViews.editTask.extend({
    tagName: $.trim(taskViews.templates.add_task_tagName) || 'div',
    className: $.trim(taskViews.templates.add_task_className) || '',
    template: taskViews.templates.add_task,
    render: function(){
      taskViews.editTask.prototype.render.apply(this, arguments);
      //
      this.$('.jscinput_tags').tagsInput({
        width: '350px',
        height: '40px'
      });
    },
    events:  function () {
      return _.defaults({
        'click .jscbtn_cancel': 'cancel'
      }, _.result(taskViews.editTask.prototype, 'events'));
    },
    cancel: function(){
      this.remove();
    }
  });
  //
  templates = SNBinder.get_named_sections_text(templates);
  var viewApp = Backbone.View.extend({
    tagName: $.trim(templates.main_tagName) || 'div',
    className: $.trim(templates.main_className) || '',
    initialize: function(options) {
      var _this = this;
      // プロジェクト一覧用Model&View
      this.projects = new todoModels.collectionProjects();
      this.listenTo(this.projects, 'sync', this.sync);
      this.listenTo(this.projects, 'remove', function(){
        _this.toFirstProject();
      });
      this.viewProjects = new viewProjects({
        collection: this.projects,
        viewItem: viewProject
      });
      // タスク一覧用Model&View
      this.tasks = new todoModels.collectionTasks();
      this.viewTasks = new viewTasks({
        collection: this.tasks,
        viewItem: editTask
      });
      //
      this.render();
      this.projects.fetch();
    },
    render: function() {
      this.$el.html(templates.main);
      this.$('#projects').html(this.viewProjects.$el);
      this.$('#tasks').html(this.viewTasks.$el);
      // プロジェクト登録用ダイアログ
      if (this.dialog_project) {
        this.dialog_project.dialog('destroy');
      }
      this.dialog_project = this.$('.jsc_dialog_project').dialog({
        width: 500,
        height: 300,
        autoOpen: false,
        modal: true
      });
      //
      return this;
    },
    sync: function() {
      this.toFragmentProject(Backbone.history.fragment);
    },
    toFirstProject: function(){
      this.project = this.projects.first();
      this.toProject();
    },
    toProject: function() {
      if (!this.project) return;
      Backbone.history.navigate(this.project.id, {trigger: true});
    },
    toFragmentProject: function(tab){
      var _this = this;
      //
      if (!tab) {
        _this.toFirstProject();
      } else {
        _this.project = this.projects.findWhere({
          id: tab
        });
        if (!_this.project) {
          _this.project = this.projects.findWhere({
            name: tab
          });
          _this.toProject();
        }
      }
      // タスク一覧更新
      if (_this.project) {
        var view = new editProject({
          model: _this.project,
          tasks: _this.tasks
        });
        _this.$('#project').html(view.$el);
        view.render();
        _this.tasks.search({
          project: _this.project.id,
          tags: []
        });
      } else {
        _this.$('#project').html();
        _this.tasks.reset();
      }
    },
    afterChangeTab: function(tab) {
      var _this = this;
      //
      _this.toFragmentProject(tab);
    },
    events: {
      'click .jscbtn_add_project': 'addProject',
      'click .jscbtn_add_task': 'addTask'
    },
    addProject: function(){
      var _this = this;
      //
      var model = _this.projects.getNewModel();
      var view = new addProject({
        model: model,
        collection: this.projects
      });
      _this.listenToOnce(model, 'sync', function(){
        _this.dialog_project.dialog('close');
        Backbone.history.navigate(model.id, {trigger: true});
      });
      _this.listenToOnce(view, 'closeDialog', function(){
        _this.dialog_project.dialog('close');
      });
      _this.dialog_project.html(view.$el);
      view.render();
      _this.dialog_project.dialog('open');
    },
    addTask: function(){
      var _this = this;
      //
      var view = new addTask({
        model: _this.tasks.getNewModel({
          project_id: _this.project.id,
          project_name: _this.project.get('name')
        }),
        collection: _this.tasks,
        flagEdit: true
      });
      _this.$('.jsc_tasks').prepend(view.$el);
      view.render();
    }        
  });
  //
  return {
    start: function(){
      $('body').html(templates.body);
      //
      var modelUser = new User.modelProfile();
      $('#sidebar').append(new User.viewProfile({
        model: modelUser
      }).$el);
      modelUser.fetch();
      //
      var app = new viewApp();
      $('#main').html(app.$el);
      //
      new Tab.router({
        view: app
      });
    }
  };
});
