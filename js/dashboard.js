require.config({
  shim: {
    'jquery': {
      exports: '$'
    },
    'jquery.ui': {
      deps: ['jquery']
    },
    'bootstrap': {
      deps: ['jquery']
    },
    'underscore': {
      exports: '_'
    },
    'underscore.string': {
      deps: ['underscore']
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'backbone.marionette': {
      deps: ['backbone'],
      exports: 'Marionette'
    },
    'snbinder': {
      deps: ['jquery']
    }
  }
  ,paths: {
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min'
    ,'jquery.ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min'
    ,'bootstrap': '//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min'
    ,'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min'
    ,'underscore.string': '//cdnjs.cloudflare.com/ajax/libs/underscore.string/3.0.3/underscore.string.min'
    ,'backbone': '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min'
    ,'backbone.marionette': '//cdnjs.cloudflare.com/ajax/libs/backbone.marionette/2.3.0/backbone.marionette.min'
    ,'moment': '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.4/moment-with-locales.min'
  	,'json2': '//cdnjs.cloudflare.com/ajax/libs/json2/20140204/json2.min'
    ,'snbinder': 'lib/SNBinder/snbinder'
    ,'FileSaver': '//cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2014-11-29/FileSaver.min'
    ,'text': 'lib/requirejs/text'
    ,'loadcss': 'lib/requirejs/loadcss'
    ,'async': '//cdnjs.cloudflare.com/ajax/libs/requirejs-async/0.1.1/async'
  }
});
        
require([
  'jquery'
  ,'jquery.ui'
  ,'bootstrap'
  ,'underscore'
  ,'underscore.string'
  ,'backbone'
  ,'backbone.marionette'
  ,'moment'
  //
  ,'json2'
  ,'snbinder'
  ,'FileSaver'
], function (jQuery, jQueryUI, Bootstrap, _, _string, Backbone, Marionette, moment) {
  _.mixin(_string.exports());
  // bower.jsonからversionを取得し、キャッシュ対策にする
require([
  'text!bower.json?bust='+(new Date()).getTime()
  ,'bulbware/lib'
], function (bower_json, bulbwareLib) {
  var bower = JSON.parse(bower_json);
  require.config({  
    urlArgs: 'version=' + bower.version
  });
  $('.js_version').html('Ver. '+bower.version);
  //
  require([
    'bulbware/obj'
    ,'bulbware/view'
    ,'standard/func'
    ,'dashboard/panel'
    ,'dashboard/navigation'
    ,'text!dashboard/main.html'
    ,'dashboard/list'
    //
    ,'lib/slidebar/jquery.slidebar'
    ,'//cdnjs.cloudflare.com/ajax/libs/pnotify/2.0.0/pnotify.core.min.js'
    ,'bower_components/jquery.cabinet/jquery.cabinet'
  ], function(bulbwareObj, bulbwareView, standardFunc, viewsPanel, viewsNavigation, templates, viewList){
    templates = SNBinder.get_named_sections_text(templates);
    //
    var $list = $('#list');
    var calc_close_width = function(){
      var close_width = $('#main').position().left - 50;
      if (close_width < 150) {
        close_width = 0;
      };
console.log('close_width', close_width);
      return close_width;
    };
    var backup_params;
    (function(){
      var close_width = calc_close_width();
      $list.cabinet({
			  position: 'left'
        ,mode: 'width' // 'position'
        ,width: Math.max(390, close_width)
        ,closeWidth: close_width
        ,onMouseDown: function(){
          var $this = $(this);
          // マウスの動きに追随させるため、transition-duration を一旦 0 にする
          backup_params = {
            'transition-duration': $this.css('transition-duration')
          };
          var params = {
            'transition-duration': '0s'
          };
          $this.css(params);
        }
        ,onMouseUp: function(){
          var $this = $(this);
          //
          $this.css(backup_params);
        }
        ,onClose: function(){
          $('.js_conditions').slidebar('close');
          standardFunc.resetListBodyHeight();
        }
		  });
    })();
    // ウィンドウのリサイズ時のサイズ調整
		var window_resize = function() {
      // リストのサイズの調整
      var close_width = calc_close_width();
      var params = {
        width: close_width
      };
      $list.css(params);
      $list.cabinet('reset', {
        'closeWidth': close_width
        ,'width': Math.max(390, close_width)
      });
      // メイン領域の高さを調整する
      $('#main-foot').css('height', $(window).outerHeight() / 4);
      //
      standardFunc.resetListBodyHeight();
    };
    window_resize();
		$(window).resize(_.debounce(window_resize));
    //
    var app = new Marionette.Application();
    //
    app.addRegions({
      'main': '#main'
    });
    //
    app.module('Router', function(Router, app) {
      Router.Router = Marionette.AppRouter.extend({
        appRoutes: {
          ':tab/:id': 'defaultAction'
          ,':tab': 'defaultAction'
        }
      });
      Router.Controller = Marionette.Controller.extend({
        defaultAction: function(tab, id) {
          var _this = this;
console.log(tab, id);
          //
          this.tab = tab;
          if (!_.isNull(id)) {
            this.id = (id === 'null') ? null : id;
          }
        }
      });
    });
    //
    app.addInitializer(function() {
      bulbwareLib.wait(function(){
        return bulbwareObj.checkFinishedLoad();
      }, function(){
        // 
        var controller = new app.Router.Controller({
        });
        var router = new app.Router.Router({
          controller: controller
        });
        // メインメニュー
        var viewNavigation = new viewsNavigation.View.Navigation();
        viewNavigation.listenTo(viewNavigation, 'callOrder', function(obj, id){
          call_order(obj, id);
        });
        //
        var start = true;
        var start_id;
        var start_values;
        var call_order = function(obj, id, view){
console.log('callOrder', obj, id);
          start_id = id;
          start_values = (view && _.isFunction(view.getCallOrderDefaults)) ? view.getCallOrderDefaults(obj, id) : null ;
          viewNavigation.callMenu(obj);
        };
        //
        var list_drawers = {};
        app.listenTo(viewNavigation, 'selectMenu', function(model_menu){
          viewsPanel.panelController.unsetCurrent();
          //
          require([model_menu.get('obj')], function(obj){
            var drawer = list_drawers[obj.name];
            //
            var views;
            if (drawer) {
              views = drawer.views;
            } else {
              if (_.isFunction(obj.createView)) {
                views = obj.createView();
              } else {
                views = _(obj.View).reduce(function(ret, view, name){
                  ret[name] = new view();
                  return ret;
                }, {});
              }
            }
            //
            if (!views.panel) {
              var open_list_cabinet = (start_id) ? false: true; // パネル呼び出し（start_idがある）の場合は、リストキャビネットを開かないようにする。
              var $drawer;
              if (drawer && (drawer.index >= 0)) {
                // 引き出しが既にある場合は、それを開く。
                drawer.view_list.setTime();
                if (open_list_cabinet) {
                  $list.cabinet('open', {
                    open: drawer.index
                  });
                }
              } else {
                // 引き出しの数が多い場合は、使用時刻が古いものを削除する
                if($list.find('.cabinet-drawer').length >= 10) {
                  var del_draw =  _(list_drawers).reduce(function(ret, values){
                    if (!ret || (values.view_list.time < ret.time)) {
                      ret = values;
                    }
                    return ret;
                  }, null);
                  // 引き出しの削除
                  var del_index = del_draw.index;
                  $list.cabinet('removeDrawer', del_index);
                  _(list_drawers[del_draw.name].obj).result('resetCollection');
                  delete list_drawers[del_draw.name];
                  // indexの付け替え
                  _(list_drawers).each(function(values){           
                    if (values.index > del_index) {
                      values.index--;
                    }
                  });
                }
                // リストキャビネットにリストを追加
                var view_list = new viewList.viewList({
                  views: views
                  ,obj: obj
                });
                app.listenTo(views.list, 'selectItem', function(model, view){
                  var panel = viewsPanel.appendPanel(view, views);
                  app.listenTo(panel, 'callOrder', function(obj, id){
                    call_order(obj, id, view);
                  });
                  //
		              $('#list').cabinet('close');
                });
                view_list._isShown = true;
                view_list.render();
                var count_drawers = $list.cabinet('appendDrawers', {
                  'drawers': [{
                    'knob': bulbwareView.bindTemplate(templates.list_cabinet_knob, {name: _(bulbwareObj.getProgram(obj.name)).result('title')})
                    ,'box': view_list.$el
                  }]
                  ,'remove': false
                  ,'open': open_list_cabinet
                });
                drawer = list_drawers[obj.name] = {
                  name: obj.name
                  ,index: count_drawers - 1
                  ,views: views
                  ,view_list: view_list
                  ,obj: obj
                };
                $drawer = $list.cabinet('getDrawer', drawer.index);
                //
              }
              // 呼び出し時の初期処理
              if (!_.isUndefined(start_id)) {
                //start_idがある場合は、そのパネルを表示する
console.log(start_id, start_values);
                if (!views.list.disabledAddNewView || views.list.initAddNewView || start_id) {
                  drawer.view_list.addNewView(start_id, start_values);
                }
                start_id = undefined;
                start_values = null;
              } else if (!start) {
                // 初期動作がない場合
              } else {
                start = false;
              }
              // fragmentを変更する。
//              Backbone.history.navigate(obj.name);
            } else {
              if (!_.isUndefined(start_id)) {
                views.panel.setID(start_id);
                start_id = undefined;
                start_values = null;
              }
              var panel = viewsPanel.appendPanel(views.panel);
              panel.setFragment();
              app.listenTo(panel, 'callOrder', function(obj, id){
console.log('callOrder', obj, id);
                call_order(obj, id, views.panel);
              });
            }
            //
            viewNavigation.closeMenu();
          });
        });
        //
        Backbone.history.start();
        //
        var panel_start = viewsPanel.showStartPanel();
        app.listenTo(panel_start, 'callOrder', call_order);
        $(document).on('click', '.jsbtn_close_all_panel', function () { // dashboard/panel.js内の定義でStartPanelを追加するとcall_orderが呼び出せないため。
          var panel_start = viewsPanel.showStartPanel();
          app.listenTo(panel_start, 'callOrder', call_order);
        });
        //
        start_id = controller.id;
        controller.id = null;
        if (controller.tab) {
          viewNavigation.callMenu(controller.tab);
        }
      });
    });
    //
    app.start();
  });
});
});
