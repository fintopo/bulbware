define([
  'bulbware/view'
  ,'bulbware/panel'
  ,'bulbware/obj'
  ,'text!dashboard/panel.html'
  ,'standard/lib'
  //
  ,'bower_components/jquery.cabinet/jquery.cabinet'
], function(bulbwareView, bulbwarePanel, bulbwareObj, templates, standardLib){
  templates = SNBinder.get_named_sections_text(templates);
  /*
   * パネル管理
   */
  var panelController = bulbwarePanel.createPanelController({
    'onBeforeShow': function(view){
      var closeList = function(){
		    $('#list').cabinet('close');
      };
      closeList();
      //
      view.listenTo(view, 'setSelected', closeList);
    }
    ,onClose: function(){
      Backbone.history.navigate('');
    }
  });
  //
  var viewBasePanel = Marionette.LayoutView.extend({
    initialize: function(options) {
      var _this = this;
      //
      _this.views = options.views;
      _this.view_detail = options.viewDetail;
      _this.listenTo(_this.view_detail, 'after:save', function(){
        _this.setFragment(); // 新規登録時にidが変化するので更新する
      });
      _this.listenTo(_this.view_detail, 'createNewObject', function(id, attributes){
        _this.views.list.addNewView(id, attributes);
      });
      _this.listenTo(_this.view_detail, 'copyView', function(model){
        var params = bulbwareObj.getProgram(_this.objName);
        standardLib.confirm(bulbwareView.bindTemplate(templates.confirm_copy, params), function(){
          _this.views.list.copyNewView(model);
          standardLib.alertInfo(bulbwareView.bindTemplate(templates.info_copied, params));
        });
      });
      _this.listenTo(_this.view_detail, 'callOrder', function(obj, id){
        _this.triggerMethod('callOrder', obj, id);
      });
      _this.listenTo(_this.view_detail, 'closePanel', function(){
        _this.closePanel();
      });
      _this.listenTo(_this.view_detail, 'after:delete', function(){
        _this.closePanel();
      });
      _this.listenTo(_this.view_detail, 'appendPanel', function(view){
        var panel = appendPanel(view, _this.views);
        panel.listenTo(panel, 'callOrder', function(obj, id){
          _this.triggerMethod('callOrder', obj, id);
        });
      });
      _this.objName = _this.view_detail.objName;
      _this.noFragment = _this.view_detail.noFragment;
      _this.flagShowNoCurrent = (_(_this.view_detail).chain().result('model').result('id').value()) ? _this.view_detail.flagShowNoCurrent : false;
    }
    ,regions: {
      'title': '.js_title'
      ,'header': '.js_header'
      ,'footer': '.js_footer'
      ,'detail': '.js_detail'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.detail.show(_this.view_detail);
      //
      if (_.isString(_this.view_detail.view_title)) {
        _this.$('.js_title').html(_this.view_detail.view_title);
      } else if (_.isObject(_this.view_detail.view_title)) {
        _this.title.show(_this.view_detail.view_title);
      }
      if (_this.view_detail.view_footer){
        _this.footer.show(_this.view_detail.view_footer);
      }
    }
    ,adjust: function(){
      var _this = this;
      //
      if (!_this.view_detail.view_footer){
        _this.$('.js_footer').hide(); // _this.footer.$el.hide();
      }
      //
      _this.$('.panel-navigation').popover({
        trigger: 'hover'
        ,placement: 'left'
        ,html: true
        ,container: 'body'
        ,content: function(){
          return _this.$('.js_title').html();
        }
      });
    }
    ,onClickPermalink: function(){
      $('#permalink').html(SNBinder.bind(templates.permalink, {
        permalink: location.href
      }));
      $('#modal-permalink').modal('show');
    }
    ,onOpenWindow: function(){
      var _this = this;
      //
      window.open(location.pathname + '#' + _this.objName + '/' + _this.model.id);
      _this.closePanel();
    }
    ,onSetCurrent: function(){
      var _this = this;
      // noCurrent指定がある場合は、カレントになっても解除する
      if (_(_this.view_detail).result('noCurrent')) {
        _this.unsetCurrent();      
      } else {
        _this.adjust(); // autosizeの設定のため。
      }
    }
  });
  bulbwarePanel.mixin.panel(viewBasePanel);
  //
  var viewPanel = viewBasePanel.extend({});
  bulbwareView.mixin.template(viewPanel, templates, 'panel');
  //
  var viewPanelOnlyClose = viewBasePanel.extend({});
  bulbwareView.mixin.template(viewPanelOnlyClose, templates, 'panel_only_close');
  //
  var appendPanel = function(viewDetail, views){
    var view = new viewPanel({
      viewDetail: viewDetail
      ,model: viewDetail.model
      ,views: views
    });
    //
    panelController.show(view);
    //
    view.$('[data-toggle="popover"]').popover();
    //
    return view;
  };
  // パネル コントロール ボタン
  $(document).on('click', '.jsbtn_prev_panel', function () {
    var panel = panelController.prev(); 
  });
  $(document).on('click', '.jsbtn_next_panel', function () {
    var panel = panelController.next();          
  });
  $(document).on('click', '.jsbtn_close_all_panel', function () {
    panelController.closeAll();          
  });
  $('[data-toggle="popover"]').popover();
  /*
   * スタートパネル
   */
  var viewStartPanel = Marionette.LayoutView.extend({
    objName: ''
    ,noCurrent: true
    ,view_title: templates.start_panel_title
  });
  bulbwareView.mixin.template(viewStartPanel, templates, 'start_panel');
  //
  var showStartPanel = function(){
    var view = new viewPanelOnlyClose({
      viewDetail: new viewStartPanel()
    });
    panelController.show(view);
    view.$('[data-toggle="popover"]').popover();
    return view;
  };
  //
  return {
    panelController: panelController
    ,appendPanel: appendPanel
    ,showStartPanel: showStartPanel
  };
});
