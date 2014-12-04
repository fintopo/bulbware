define([
  'bulbware/view'
  ,'models/todo'
  ,'text!views/todo.html'
], function(bulbwareView, models, templates){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var Projects = new models.Collection.Projects();
  //
  var viewProject = Marionette.ItemView.extend({
    modelEvents: {
      sync: 'render'
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
    ,ui: {
      'add_project': '.jsbtn_add_project'
    }
    ,triggers: {
      'click @ui.add_project': 'addProject'
    }
    ,onAddProject: function(){
      var _this = this;
      //
      _this.addNewView(null, {
        name: 'プロジェクト'
      });
    }
    ,onSelectItem: function(model){
      var _this = this;
      //
      var view = new panelProject({
        model: model
      });
      _this.triggerMethod('showPanel', {
        view: view
      });
    }
  });
  bulbwareView.mixin.template(viewProjects, templates, 'list');
  bulbwareView.mixin.list(viewProjects);
  //
  var viewHeader = Marionette.ItemView.extend({
    ui: {
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
    ,onBeforeRender: function(){
      var _this = this;
      //
      if (_this.is_edit) {
/*        var show_number = _this.model.get_option('show_number');
        var style = _this.model.get_option('style');
        _this.model.set({
          ShowNumberSelected3: (show_number == 3) ? 'selected' : ''
          ,ShowNumberSelected5: (show_number == 5) ? 'selected' : ''
          ,ShowNumberSelected10: (show_number == 10) ? 'selected' : ''
          ,StyleSelected_standard: (style == 'standard') ? 'selected' : ''
          ,StyleSelected_full: (style == 'full') ? 'selected' : ''
          ,StyleSelected_2columns: (style == '2columns') ? 'selected' : ''
        });
*/
      } else {
/*        _this.model.set({
          'public_label': (_this.model.isPublic()) ? templates.public_text : templates.private_text
          ,'checked_publish': (_this.model.isPublic()) ? 'checked' : ''
        });
*/
      }
    }
    ,adjust: function(){
      var _this = this;
      //
      if (_this.is_edit) {
/*        _this.$('.jsinput_publish').iphoneStyle({
          checkedLabel: 'する'
          ,uncheckedLabel: 'しない'
        });
*/
      } else {
/*        _this.$('.readmore').readmore({
          maxHeight: 100
          ,moreLink: '<a href="#" class="btn btn-default"><i class="fa fa-arrow-down"></i> 続きを読む</a>'
          ,lessLink: '<a href="#" class="btn btn-default"><i class="fa fa-arrow-up"></i> 閉じる</a>'
        });
        //
        _this.$('.js_tags').html(
          _(_this.model.get('tags_string').split(',')).chain()
              .compact()
              .map(function(tag){
                return SNBinder.bind(templates.tag, {
                  name: tag
                });
              })
              .value()
        );
        //
        _this.$el.autolink();
*/
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
//        ,sorttext: _this.getOrder()
      });
      //
      _this.model.set_options({
        'memo': _this.ui.memo.val()
      });
      //
      _this.model.save();
    }
    ,onBeforeRender: function(){
      var _this = this;
      //
/*      var media_type = _this.model.getMedia();
      //
      _this.model.set({
        'sorttext_number': Number(_this.model.get('sorttext'))
        ,'media': SNBinder.bind(templates['media_'+media_type], _this.model.attributes)
      });
*/
    }
    ,onRender: function(){
      var _this = this;
      //
/*      var spec_name = _this.options.header.get_option('spec_name').split(',');
      var spec_value = _this.model.get_option('spec_value').split(',');
      //
      var mode = (_this.is_edit)?'edit':'view';
      var template = templates['spec_value_'+mode];
      //
      _this.$('.js_specs').html(
        _(spec_name).map(function(name, index){
          return SNBinder.bind(template, {
            name: name
            ,value: spec_value[index] || ''
          });
        }).join('')
      );
*/
    }
    ,onToEdit: function(){
      var _this = this;
      //
//      _this.scrollTop(true, {offset: 120});
    }
    ,adjust: function(){
      var _this = this;
      //
/*      if (_this.is_edit) {
        var media_type = _this.model.getMedia();
        _this['clickSelect'+_(media_type).capitalize()]();
      } else {
        _this.$el.autolink();
      }
*/
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
/*    ,onShow: function(){
      var _this = this;
      //
      if (!_this.model.id) {
        _this.removeLoading();
        //
        _this.$('.jsbtn_add_detail').hide();
        _this.listenTo(_this.model, 'sync', function(){
          _this.$('.jsbtn_add_detail').show();
        }) ;
      }
    }
    ,childViewOptions: function(){
      return {
        header: this.model
      };
    }
    ,onAddChild: function(view){
      var _this = this;
      //
      view.listenTo(_this, 'updateOrder', view.updateOrder);
    }
    ,childEvents: {
      'upOrder': 'upOrder'
      ,'downOrder': 'downOrder'
    }
    ,updateOrder: function(view, $target_view){
      this.triggerMethod('updateOrder', [view.$el.get(0), $target_view.get(0)]);
      view.scrollTop(true, {offset: 120});
    }
    ,upOrder: function(view, values){
    	var $target_view = view.$el.prev();
      $target_view.before(view.$el);
      this.updateOrder(view, $target_view);
    }
    ,downOrder: function(view, values){
    	var $target_view = view.$el.next();
      $target_view.after(view.$el);
      this.updateOrder(view, $target_view);
    }
*/
  });
  bulbwareView.mixin.details(viewDetails);
  bulbwareView.mixin.template(viewDetails, templates, 'details');
  //
  var panelProject = Marionette.LayoutView.extend({  
    objName: 'project'
    ,initialize: function(options) {
      var _this = this;
      //
      _this.view_header = new viewHeader({
        model: options.model
      });
      //
      _this.view_details = new viewDetails({
        model: options.model
      });
    }
    ,regions: {
      'header': '.header'
      ,'details': '.details'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.header.show(_this.view_header);
      _this.details.show(_this.view_details);
    }
    ,onDelete: function(){
      return !window.confirm('削除します');
    }
    ,onAfterDelete: function(){
      this.closePanel();
    }
  });
  bulbwareView.mixin.edit(panelProject);
  bulbwareView.mixin.template(panelProject, templates, 'project');
  //
  return {
    Projects: Projects
    ,View: {
      Project: viewProject
      ,Projects: viewProjects
      ,panelProject: panelProject
    }
  };
});
