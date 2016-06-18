define([
  'bulbware/view'
  ,'text!dashboard/list.html'
  ,'standard/func'
  ,'bulbware/obj'
  //
  ,'bower_components/jquery.cabinet/jquery.cabinet'
  ,'lib/slidebar/jquery.slidebar'
], function(bulbwareView, templates, standardFunc, bulbwareObj){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewList = Marionette.LayoutView.extend({
    initialize: function(options) {
      var _this = this;
      //
      _this.model = new Backbone.Model({
        name: _(bulbwareObj.getProgram(options.obj.name)).result('title')
      });
      _this.setTime();
    }
    ,ui: {
      'toggle_conditions': '.jsbtn_toggle_conditions'
      ,'add_edit': '.jsbtn_add_edit'
      ,'area_extract': '.js_extract'
      ,'extract': '.jsbtn_extract'
      ,'search_text': '.jsinput_search_text'
      ,'clear_search_text': '.jsbtn_clear_search_text'
      ,'download': '.jsbtn_download'
    }
    ,regions: {
      'conditions': '.js_conditions'
      ,'list_body': '.js_list_body'
    }
    ,onRender: function(){
      var _this = this;
      var views = _this.options.views;
      //
      // 条件Viewの設定
      if (views.conditions) {
        _this.conditions.show(views.conditions);
        _this.listenTo(views.conditions, 'search', function(model){
          _this.conditions.$el.slidebar('close');
          standardFunc.resetListBodyHeight();
        });
        _this.listenTo(views.conditions, 'after:search', function(model){
          _this.time = moment().valueOf(); // 時刻を保存する。
          _this.triggerMethod('clickClearSearchText');
        });
        _this.conditions.$el.slidebar({
			    position: 'top'
          ,open: !views.conditions.initAutoSelect
          ,onOpen: function(){
            _this.ui.area_extract.hide();
          }
          ,onClose: function(){
            if (!views.list.isEmpty()) {
              _this.ui.area_extract.show();
            }
          }
		    });
      }
      // リストViewの設定
      if (views.list) {
        _this.list_body.show(views.list);
        _this.listenTo(views.list.collection, 'sync', function(){
          var method = (views.list.isEmpty()) ? 'hide' : 'show';
          _this.ui.area_extract[method]();
        });
      }
      // 新規登録ボタン
      (function(){
        var method = (_(views.list).result('disabledAddNewView') && !_.isFunction(views.list.onAddNewView)) ? 'hide' : 'show';
        _this.ui.add_edit[method]();
      })();
      // ダウンロードボタン
      (function(){
        var method = (_.isFunction(_this.options.views.list.download)) ? 'show' : 'hide';
        _this.ui.download[method]();
      })();
      //
      standardFunc.resetListBodyHeight();
    }
    ,setTime: function(){
      this.time = moment().valueOf();
    }
    ,addNewView: function(id, values){
      var _this = this;
      var views = _this.options.views;
      //
      views.list.addNewView(id, values);
    }
    ,triggers: {
      'click @ui.toggle_conditions': 'clickToggleConditions'
      ,'keyup @ui.search_text': 'keyupSearchText'
      ,'click @ui.extract': 'clickExtract'
      ,'click @ui.clear_search_text': 'clickClearSearchText' 
      ,'click @ui.add_edit': 'clickAddEdit'
      ,'click @ui.download': 'clickDownload'
    }
    ,onClickToggleConditions: function(){
      var _this = this;
      var views = _this.options.views;
      //
      var mode = _this.conditions.$el.slidebar('toggle');
      if (mode == 'open') {
        $('#list').cabinet('open');
      }
      standardFunc.resetListBodyHeight();
    }
    ,onKeyupSearchText: function(){
      var _this = this;
      //
      _this.triggerMethod('clickExtract');
    }
    ,onClickExtract: function(){
      var _this = this;
      var views = _this.options.views;
      //
      views.list.extract(_this.ui.search_text.val());
    }
    ,onClickClearSearchText: function(){
      var _this = this;
      //
      _this.ui.search_text.val('');
      _this.triggerMethod('clickExtract');
    }
    ,onClickAddEdit: function(){
      var _this = this;
      //
      _this.addNewView(null);
    }
    ,onClickDownload: function(){
      var _this = this;
      //
      _this.options.views.list.download();
    }
  });
  bulbwareView.mixin.view(viewList);
  bulbwareView.mixin.template(viewList, templates, 'list');
  //
  return {
    viewList: viewList
  };
});
