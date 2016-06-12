define([
  'bulbware/lib'
  ,'bulbware/obj'
  ,'bulbware/view'
], function(bulbwareLib, bulbwareObj, bulbwareView){
  // パネルの状態
  //   current - 編集パネル
  //   selected - 編集パネルがない状態での選択パネル
  //
  var mixinPanel = function(view){
    // パネルにする
    bulbwareView.mixin.view(view);
    bulbwareLib.mixin(view, {
      onBeforeRender: function(){
        var _this = this;
        //
        if (_this.model) {
          var values = bulbwareObj.getProgram(_this.objName);
          _this.model.set({
            objName: values
          }, {silent: true});
        }
      }
      ,getScrollOptions: function(){
        var _this = this;
        //
        return _.extend({
          mode: true
          ,offset: 60
        }, _(_this).result('optionsScroll'));
      }
      ,scrollTop: _.debounce(function(){
        var _this = this;
        //
        var options = _this.getScrollOptions();
        if (options.mode) {
          var top = _this.$el.offset().top;
          top -= options.offset;
          $('html,body').animate({ scrollTop: top }, 'slow');
        } else {
          _this.$el.get(0).scrollIntoView(true);
        }
        _this.setFragment();
      }, 300)
      ,scrollBottom: _.debounce(function(){
        var _this = this;
        //
        var options = _this.getScrollOptions();
        if (options.mode) {
          var bottom = _this.$el.offset().top + _this.$el.outerHeight(true);
          $('html,body').animate({ scrollTop: bottom }, 'slow');
        } else {
          _this.$el.get(0).scrollIntoView(false);
        }
        _this.setFragment();
      }, 300)
      ,setFragment: function(){
        var _this = this;
        if (_this.noFragment) return;
        //
        var model_id = '';
        if (_this.model) {
          model_id = '/' + _this.model.id || 'null';
        }
        Backbone.history.navigate(_this.objName + model_id);
      }
      ,toggleCurrent: function(){
        var _this = this;
        //
        if (_this.isCurrent()) {
          _this.unsetCurrent();
        } else {
          _this.setCurrent();
        }
      }
      ,isCurrent: function(){
        var _this = this;
        //
        return _this.$el.hasClass('current');
      }
      ,setCurrent: function(){
        var _this = this;
        //
        _this.$el.parent().addClass('current-selected').removeClass('current-none');
        //
        _this.$el.parent().children().removeClass('current');
        _this.$el.addClass('current');
        //
        $('.panel-control').hide();
        //
        _this.setSelected();
        //
        _this.triggerMethod('setCurrent', this);
      }
      ,unsetCurrent: function(not_scroll){
        var _this = this;
        //
        _this.$el.parent().removeClass('current-selected').addClass('current-none');
        //
        _this.$el.removeClass('current');
        //
        $('.panel-control').show();
        //
        _this.setSelected(not_scroll);
        //
        _this.triggerMethod('unsetCurrent', this);
      }
      ,isSelected: function(){
        var _this = this;
        //
        return _this.$el.hasClass('selected');
      }
      ,setSelected: function(not_scroll){
        var _this = this;
        //
        _this.$el.parent().children().removeClass('selected');
        _this.$el.addClass('selected');
        //
        if (!not_scroll) {
          _this.scrollTop();
        }
        //
        _this.triggerMethod('setSelected', this);
      }
      ,triggers: {
        'click .jsbtn_close_panel': 'closePanel'
        ,'click .jsbtn_open_window': 'openWindow'
        ,'click .jsbtn_permalink': 'click:permalink'
      }
      ,closePanel: function(){
        var _this = this;
        //
        _this.triggerMethod('closePanel', {
          view: _this
          ,model: _this.model
        });
      }
      ,onClosePanel: function(){
        var _this = this;
        //
        _this.panelController.close(_this);
        _.defer(function(){
          _this.destroy();
        });
      }
      ,events: {
        'click .jsbtn_current': 'clickCurrent'
        ,'click .jsbtn_set_current': 'clickSetCurrent'
        ,'click .jsbtn_unset_current': 'clickUnsetCurrent'
        ,'click .jsbtn_set_selected': 'clickSetSelected'
        ,'click .jsbtn_call_order': 'clickCallOrder'
      }
      ,clickCurrent: function(){
        this.toggleCurrent();
      }
      ,clickSetCurrent: function(){
        this.setCurrent();
      }
      ,clickUnsetCurrent: function(){
        this.unsetCurrent();
      }
      ,clickSetSelected: function(){
        this.setSelected();
      }
      ,clickCallOrder: function(e){
        var _this = this;
        //
        _this.unsetCurrent(true);
        //
        var obj = $(e.currentTarget).data('obj');
        var id = $(e.currentTarget).data('id');
        id = (id === '') ? undefined : id;
console.log('callOrder', obj, id);
        this.triggerMethod('callOrder', obj, id);
      }
    });
    //
    return view;
  };
  //
  var viewPanel = mixinPanel(Marionette.ItemView.extend({}));
  // パネル管理
  var createPanelController = function(options){
    options = _.extend({
      selector: '#main'
      ,maxPanels: 10
      ,onBeforeShow: function(){}
      ,onAfterShow: function(){}
      ,onClose: function(){}
    }, options);
    var panels = [];
    //
    var searchIndex = function(view){
      return _(panels).reduce(function(ret, panel, index){
        return ((panel.name == view.objName) && (panel.id == _(view.model).result('id'))) ? index : ret;
      }, -1);
    };
    //
    var searchPositionView = function(scrollTop){
      // scrollTopに近いパネルを探す
      return _(panels).chain()
          .find(function(panel){
            var top = panel.view.$el.offset().top;
            return (top > scrollTop);
          })
          .result('view')
          .value();
    };
    //
    return {
      search: function(name, id){
        if (!name) return;
        if (!id) return;
        return _(panels).findWhere({name: name, id: id});
      }
      ,show: function(view){
        if (!view.model || !view.model.id) {
          console.log(view);
        }
        //
        this.unsetCurrent(true);
        //
        options.onBeforeShow.call(this, view);
        //
/*        view.listenTo(view, 'setCurrent', function(view){
        });
        view.listenTo(view, 'unsetCurrent', function(view){
        });
        //
*/
        $(options.selector).append(view.$el);
        view.panelController = this;
        view._isShown = true;
        view.render();
        var method = (!_(view).result('flagShowNoCurrent')) ? 'setCurrent' : 'setSelected';
        _(view).result(method);
        //
        var index = searchIndex(view);
        panels.push({
          name: view.objName
          ,id: _.result(view.model, 'id') || null
          ,view: view
        });
        if (index >= 0) { // 同じパネルがある場合は古いものを消す。
          panels[index].view.destroy();
          panels.splice(index, 1);
        }
        if (panels.length > options.maxPanels) {
          var panel = panels.shift();
          panel.view.destroy();
        }
        //
        options.onAfterShow.call(this, view);
        //
        return view;
      }
      ,close: function(view){
        this.unsetCurrent();
        //
        var index = searchIndex(view);
        if (index >= 0) {
          panels.splice(index, 1);
          options.onClose.call(this);
        }
        return this.last();
      }
      ,closeAll: function(view){
        _(panels).each(function(panel){
          _(panel).chain()
              .result('view')
              .result('destroy') // view.closePanelを呼び出すとthis.closeが呼び出されてpanelsが変化してしまうため、destroyを直接呼び出す。
              .value();
        });
        options.onClose.call(this);
      }
      ,current: function(){
        // カレントパネルを返す
        return _(panels).chain()
            .find(function(panel){
              return panel.view.isCurrent();
            })
            .result('view')
            .value();
      }
      ,unsetCurrent: function(not_scroll){
        // カレントパネルを解除する
        var view = this.current();
        if (view) {
          view.unsetCurrent(not_scroll);
        }
      }
      ,selected: function(){
        // 選択パネルを返す
        return _(panels).chain()
            .find(function(panel){
              return panel.view.isSelected();
            })
            .result('view')
            .value();
      }
      ,last: function(mode){
        // 最後のパネルをカレントにする
        var view = _(panels).chain()
            .last()
            .result('view')
            .value();
        if (view) {
          if (mode) {
            view.setCurrent();
          } else {
            view.setSelected();
          }
        }
        return view;
      }
      ,prev: function(mode){
        // カレントを前のパネルに移動する
        var method = (mode) ? 'isCurrent' : 'isSelected';
        var view = _(panels).chain()
            .reduce(function(ret, panel){
              if (!ret.flag) {
                if (panel.view[method]()) {
                  ret.flag = true;
                } else {
                  ret.view = panel.view;
                }
              }
              return ret;
            }, {
              view: null
              ,flag: false
            })
            .result('view')
            .value();
        if (view) {
          if (mode) {
            view.setCurrent();
          } else {
            view.setSelected();
          }
        }
        return view;
      }
      ,next: function(mode){
        // カレントを次にパネルに移動する
        var method = (mode) ? 'isCurrent' : 'isSelected';
        var view = _(panels).chain()
            .reduceRight(function(ret, panel){
              if (!ret.flag) {
                if (panel.view[method]()) {
                  ret.flag = true;
                } else {
                  ret.view = panel.view;
                }
              }
              return ret;
            }, {
              view: null
              ,flag: false
            })
            .result('view')
            .value();
        if (view) {
          if (mode) {
            view.setCurrent();
          } else {
            view.setSelected();
          }
        } else {
          _(this.selected()).result('scrollBottom');
        }
        return view;
      }
      ,moveCurrent: function(scrollTop){
        // scrollTopに近いパネルをカレントにする
        var view = searchPositionView(scrollTop);
        if (view) {
          view.setCurrent();
        }
        return view;
      }
      ,moveSelected: function(scrollTop){
        // scrollTopに近いパネルを選択する
        var view = searchPositionView(scrollTop);
        if (view) {
          view.setSelected();
        }
        return view;
      }
    };
  };
  //
  return {
    createPanelController: createPanelController
    ,mixin: {
      panel: mixinPanel
    }
    ,View: {
      panel: viewPanel
    }
  };
});
