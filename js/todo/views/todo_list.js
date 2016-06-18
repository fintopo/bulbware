define([
  'bulbware/view'
  ,'text!todo/views/todo_list.html'
  ,'todo/views/language'
], function(bulbwareView, templates, language){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewConditions = Marionette.ItemView.extend({
    ui: {
      'name': '.jsinput_name'
    }
    ,getConditions: function(){
      var _this = this;
      //
      return {
        'name': _this.ui.name.val()
      };
    }
  });
  bulbwareView.mixin.conditions(viewConditions);
  bulbwareView.mixin.template(viewConditions, templates, 'conditions', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
  //
  var viewItem = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
  });
  bulbwareView.mixin.template(viewItem, templates, 'item', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
  var viewList = Marionette.CompositeView.extend({
    childView: viewItem
  });
  bulbwareView.mixin.template(viewList, templates, 'list', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
  //
  var viewEmpty = Marionette.ItemView.extend({});
  bulbwareView.mixin.template(viewEmpty, templates, 'empty', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
  //
  bulbwareView.mixin.list(viewList, viewItem, viewEmpty);
  //
  return {
    View: {
      conditions: viewConditions
      ,list: viewList
      ,item: viewItem
    }
  };
});
