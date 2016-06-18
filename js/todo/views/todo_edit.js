define([
  'bulbware/view'
  ,'text!todo/views/todo_edit.html'
  ,'todo/views/language'
], function(bulbwareView, templates, language){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewTitle = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
    }
  });
  bulbwareView.mixin.template(viewTitle, templates, 'title', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
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
      _this.model.set_options({
        'memo': _this.ui.memo.val()
      });
      _this.model.set({
        name: _this.ui.name.val()
      });
      _this.model.save();
      //
      return true;
    }
    ,toView: function(){
      var _this = this;
      //
      if (_this.is_save && _this.is_new) {
        _this.triggerMethod('CreateNew', _this.model.id);
      }
    }
    ,onToEdit: function(){
      var _this = this;
      //
      if (_this.model.isNew()) {
        _this.$('.jsbtn_delete').hide();
        _this.$('.jsbtn_to_view').hide();
      } else if (_this.model.tasks.length) {
        _this.$('.jsbtn_delete').hide();
      }
    }
  });
  bulbwareView.mixin.toggleEdit(viewHeader);
  bulbwareView.mixin.template(viewHeader, templates, 'header', {
    additionalTemplateParams: {
      ObjectText: language
    }
  });
  //
  var viewDetail = Marionette.ItemView.extend({
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
      //
      return true;
    }
  });
  bulbwareView.mixin.toggleEdit(viewDetail, 'destroy');
  bulbwareView.mixin.onDeleteDetail(viewDetail);
  bulbwareView.mixin.template(viewDetail, templates, 'detail');
  //
  var viewDetails = Marionette.CompositeView.extend({
    childView: viewDetail
    ,modelEvents: {
      sync: 'render'
    }
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
    ,onRender: function(){
      var _this = this;
      //
      var method = (_this.model.isNew()) ? 'hide' : 'show';
      _this.$el[method]();
    }
  });
  bulbwareView.mixin.details(viewDetails);
  bulbwareView.mixin.template(viewDetails, templates, 'details');
  //
  return {
    viewTitle: viewTitle
    ,viewHeader: viewHeader
    ,viewDetails: viewDetails
  };
});
