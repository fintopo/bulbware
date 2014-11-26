define([
  'bulbware/model'
], function(bulbwareModel){
  //
  var app = 'todo';
  var label_finished = 'system:finished';
  //
  var modelProject = bulbwareModel.Model.Project.extend({
    app: app
    ,adjust: function(){
      var _this = this;
      var attr = bulbwareModel.Model.Project.prototype.adjust.apply(this, arguments);
      //
      _(attr.option_values).defaults({
        'memo': ''
      });
      //
      return attr;
    }
    ,adjustChange: function() {
      var _this = this;
      var attr = bulbwareModel.Model.Project.prototype.adjustChange.apply(this, arguments);
      //
/*      attr.tags_string = _(attr.tags).chain()
          .map(function(tag){
            return (_(tag).startsWith('label:')) ? _(tag).words(':')[1] : '';
          })
          .compact()
          .value()
          .join(',');
*/
      //
      return attr;
    }
    ,isFinished: function(){
      return this.inTags(label_finished);
    }
    ,setFinished: function(mode){
      this.setTag(label_finished, mode);
    }
    ,getTasks: function(){
      var _this = this;
      //
      if (!_this.tasks) {
        _this.tasks = new collectionTasks();
      }
      if (_this.id) {
        _this.tasks.option_search_params = {
          project: _this.id
        };
        _this.tasks.search();
      }
      return _this.tasks;
    }
  });
  //
  var collectionProjects = bulbwareModel.Collection.Projects.extend({
    app: app
    ,model: modelProject
    ,option_search_params: {
      create_name: 'Main' // 存在しない場合は生成する
    }
  });
  //
  var modelTask = bulbwareModel.Model.Item.extend({
    app: app
    ,adjust: function(){
      var _this = this;
      var attr = bulbwareModel.Model.Item.prototype.adjust.apply(this, arguments);
      //
      _(attr.option_values).defaults({
        'memo': ''
      });
      //
      return attr;
    }
    ,adjustChange: function() {
      var _this = this;
      var attr = bulbwareModel.Model.Item.prototype.adjustChange.apply(this, arguments);
      //
/*      attr.tags_string = _(attr.tags).chain()
          .map(function(tag){
            return (_(tag).startsWith('label:')) ? _(tag).words(':')[1] : '';
          })
          .compact()
          .value()
          .join(',');
*/
      //
      return attr;
    }
    ,isFinished: function(){
      return this.inTags(label_finished);
    }
    ,setFinished: function(mode){
      this.setTag(label_finished, mode);
    }
  });
  //
  var collectionTasks = bulbwareModel.Collection.Items.extend({
    app: app
    ,model: modelTask
  });
  //
  return {
    Collection: {
      Projects: collectionProjects
      ,Tasks: collectionTasks
    }
    ,Model: {
      Project: modelProject
      ,Task: modelTask
    }
  };
});
