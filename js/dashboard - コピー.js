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
  },  
      
  paths: {
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
  ,'//cdnjs.cloudflare.com/ajax/libs/pnotify/2.0.0/pnotify.core.min.js'
], function (jQuery, jQueryUI, Bootstrap, _, _s, Backbone, Marionette, moment) {
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
    'bulbware/view'
    ,'views/navigation'
    //
    ,'lib/slidebar/jquery.slidebar'
    ,'bower_components/jquery.cabinet/jquery.cabinet'
  ], function(bulbwareView, viewsNavigation){
    var App = new Marionette.Application();
    //
    App.module('View', function(View, App) {
      View.Navigation = new viewsNavigation.View.Navigation();
      //
      View.panelController = bulbwareView.panelController({
        selector: '#main'
        ,onBeforeShow: function(view){
          var _this = this;
          //
          view.listenTo(view, 'closePanel', function(values){
            var panel = _this.close(values.view);
            if (!panel) {
              Backbone.history.navigate('');
            }
          });
          //
          view.listenTo(view, 'setCurrent', function(){
            _this.setCurrent(this);
          });
        }
        ,onAfterShow: function(view){
          App.View.Navigation.closeMenu();
        }
        ,onSetCurrent: function(view){
          Backbone.history.navigate(view.getFragment());
          view.scrollTop(true, {offset: 60});
        }
      });
    });
    App.module('Router', function(Router, App) {
      Router.Router = Marionette.AppRouter.extend({
        appRoutes: {
          'profile': 'profile'
          ,'project/:id': 'project'
        }
      });
      Router.Controller = Marionette.Controller.extend({
        _getID: function(id){
          return (id == 'null') ? null : id;
        }
        ,profile: function() {
          require(['views/profile'], function(views){
            var view = new views.View.panelProfile({});
            App.View.panelController.show(view, 'standard');
          });
        }
        ,project: function(id) {
          var _this = this;
console.log(id);
          require(['views/todo'], function(views){
            var model = views.Projects.getModel(_this._getID(id));
            var view = new views.View.panelProject({
              model: model
            });
            App.View.panelController.show(view, 'standard');
          });
        }
      });
      App.startRouter = _.after(1, function(){
        new App.Router.Router({
          controller: new App.Router.Controller()
        });
        Backbone.history.start();
      });
    });
    App.addInitializer(function() {
      // 領域のサイズ調整
      var windowResized = function(){
        // メイン領域の高さを調整する
        $('#main-footer').css('height', $(window).height() * 0.5);
      };
      windowResized();
		  $(window).resize(_.debounce(function() {
        windowResized();
      }, 300));
      //
      App.listenToOnce(App.View.Navigation, 'ready', function(){
        App.startRouter();
      });
      // パネル コントロール ボタン
      $('.jsbtn_prev_panel').click(function(){
        App.View.panelController.prev(); 
      });
      $('.jsbtn_next_panel').click(function(){
        App.View.panelController.next();          
      });
    });
    App.start();
  });
});
});
