define([
  'bulbware/lib'
], function(BULBWARE){
  // Project
  var modelProject = BULBWARE._Model.extend({
    url_base: '/todo/api/',
    api_get: '/get_project',
    api_update: '/update_project',
    api_delete: '/delete_project',
    defaults: {
      name: '',
      options: {},
      tags: ''
    },
    get_update_params: function(){
      return {
        id: (this.id || ''),
        name: this.get('name')
      };
    }
  });
  var collectionProjects = BULBWARE._Collection.extend({
    url_base: '/todo/api/',
    api_search: '/search_projects',
    model: modelProject,
    search_params: {},
    comparator: 'name'
  });
  // Task
  var modelTask = BULBWARE._Model.extend({
    url_base: '/todo/api/',
    api_get: '/get_task',
    api_update: '/update_task',
    api_delete: '/delete_task',
    defaults: {
      name: '',
      options: {},
      tags: [],
      project_id: '',
      project_name: '',
      owner_id: '',
      owner_name: '',
      start_datetime: '',
      due_datetime: '',
      completed: ''
    },
    get_update_params: function(){
      var _this = this;
      //
      var d = moment(_this.get('start_datetime'));
      var start_datetime = (d) ? d.format('YYYY/MM/DD HH:mm:ss') : '';
      //
      d = moment(_this.get('due_datetime'));
      var due_datetime = (d) ? d.format('YYYY/MM/DD HH:mm:ss') : '';
      //
      var tags = _this.toArrayTags();
      //
      return {
        id: (_this.id || ''),
        name: _this.get('name'),
        project_id: _this.get('project_id'),
        options: _this.get('options'),
        start_datetime: start_datetime,
        due_datetime: due_datetime,
        tags: tags,
        completed: (_this.get('completed')) ? true : false
      };
    },
    adjust: function(){
      var _this = this;
      //
      var start_datetime = moment(_this.get('start_datetime'));
      if (start_datetime) {
        var start_date = start_datetime.format('YYYY-MM-DD');
        var start_time = start_datetime.format('HH:mm:ss');
      }
      var due_datetime = moment(_this.get('due_datetime'));
      if (due_datetime) {
        var due_date = due_datetime.format('YYYY-MM-DD');
        var due_time = due_datetime.format('HH:mm:ss');
      }
      _this.set({
        start_date: start_date || '',
        start_time: start_time || '',
        due_date: due_date || '',
        due_time: due_time || '',
        checked: (_this.get('completed')) ? 'checked' : ''
      }, {silent: true});
    },
    setCompleted: function(mode){
      this.save({
        completed: mode
      });
    },
    deleteCompleted: function(){
      if (this.get('completed')) {
        this.destroy();
      }
    },
    toArrayTags: function(){
      var tags = this.get('tags');
      if (_.isString(tags)) {
        tags = tags.split(',');
      } else if (!_.isArray(tags)) {
        tags = [];
      }
      return tags;
    },
    inTags: function(tag){
      return (_(this.toArrayTags()).indexOf(tag) >= 0);
    }
  });
  var collectionTasks = BULBWARE._Collection.extend({
    url_base: '/todo/api/',
    api_search: '/search_tasks',
    model: modelTask,
    search_params: {},
    comparator: 'start_datetime',
    setSort: function(comparator){
      this.comparator = comparator;
      this.sort();
    },
    deleteAllCompleted: function(){
      this.each(function(model){
        model.deleteCompleted();
      });
    }
  });
  //
  return {
    collectionProjects: collectionProjects,
    collectionTasks: collectionTasks,
    modelProject: modelProject,
    modelTask: modelTask
  };
});
