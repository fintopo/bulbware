define([
  'bulbware/view'
  ,'todo/models/todo'
  ,'text!todo/todo.html'
  ,'todo/views/todo_list'
  ,'todo/views/todo_edit'
], function(bulbwareView, models, templates, viewsList, viewsEdit){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var obj_name = 'todo';
  //
  var viewBody = Marionette.LayoutView.extend({  
    objName: obj_name
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
      _this.view_title = new viewsEdit.viewTitle({
        model: _this.model
      });
      //
      _this.view_header = new viewsEdit.viewHeader({
        model: _this.model
      });
      _this.listenTo(_this.view_header, 'CreateNew', function(id){
        // 新規登録時にフラグメントを変更する
        Backbone.history.navigate(_this.objName + '/' + id);
      });
      _this.header.show(_this.view_header);
      //
      _this.view_details = new viewsEdit.viewDetails({
        model: _this.model
      });
      _this.details.show(_this.view_details);
    }
    ,setID: function(id){
      var _this = this;
      //
      _this.model = collection.getModel(id, {
        modeAddCollection: true
      });
    }
    ,onDelete: function(){
      return !window.confirm('削除します');
    }
    ,onAfterDelete: function(){
      this.closePanel();
    }
  });
  bulbwareView.mixin.view(viewBody);
  bulbwareView.mixin.template(viewBody, templates, 'body');
  //
  var collection = new models.Collection.Projects();
  collection.search();
  //
  var viewConditions = viewsList.View.conditions.extend({
    collection: collection
    ,autoSelect: true
  });
  var viewList = viewsList.View.list.extend({
    collection: collection
    ,viewEdit: viewBody
  });
  //
  return {
    name: obj_name
    ,View: {
      conditions: viewConditions
      ,list: viewList
      ,panel: viewBody
    }
    ,collection: collection
  };
});
