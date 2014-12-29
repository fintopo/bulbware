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
    ,'bootstrap': '//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min'
    ,'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min'
    ,'underscore.string': '//cdnjs.cloudflare.com/ajax/libs/underscore.string/2.3.3/underscore.string.min'
    ,'backbone': '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min'
    ,'backbone.marionette': '//cdnjs.cloudflare.com/ajax/libs/backbone.marionette/2.3.0/backbone.marionette.min'
    ,'moment': '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.4/moment-with-locales.min'
  	,'json2': '//cdnjs.cloudflare.com/ajax/libs/json2/20140204/json2.min'
    ,'snbinder': 'bower_components/SNBinder/snbinder-0.5.3'
    ,'text': 'lib/requirejs/text'
    ,'loadcss': 'lib/requirejs/loadcss'
    ,'async': '//cdnjs.cloudflare.com/ajax/libs/requirejs-async/0.1.1/async'
  }
  ,urlArgs: 'bust=3-1-0-2014-12-30'
});
        
require([
  'jquery',
  'jquery.ui',
  'bootstrap',
  'underscore',
  'underscore.string',
  'backbone',
  'backbone.marionette',
  'moment',
  'json2',
  'snbinder'
], function () {
  _.mixin(_.str.exports());
  //
  require([
    'bulbware/view'
    ,'views/navigation'
  ], function(bulbwareView, viewsNavigation){
    var App = new Marionette.Application();
    //
    App.module('View', function(View, App) {
      View.Navigation = new viewsNavigation.View.Navigation();
      App.listenTo(View.Navigation, 'showPanel', function(values){
        App.View.panelController.show(values.view);
      });
      //
      View.panelController = bulbwareView.panelController({
        selector: '#main'
        ,onBeforeShow: function(view){
          var _this = this;
          //
          view.listenTo(view, 'closePanel', function(values){
            _this.close(values.view);
          });
          view.listenTo(view, 'showPanel', function(values){
            _this.show(values.view);
          });
        }
        ,onAfterShow: function(view){
          App.View.Navigation.closeMenu();
        }
        ,onSetCurrent: function(view){
          var fragment = view.objName;
          if (_([
            'project'
          ]).contains(fragment)) {
            fragment += '/'+(_.result(view.model, 'id')||'null');
          }
          Backbone.history.navigate(fragment);
          view.scrollTop(true, {offset: 60});
        }
      });
    });
    App.module('Router', function(Router, App) {
      Router.Router = Marionette.AppRouter.extend({
        appRoutes: {
          '': 'project'
          ,'profile': 'profile'
          ,'project/:id': 'project'
        }
      });
      Router.Controller = Marionette.Controller.extend({
        profile: function() {
          App.View.Navigation.editProfile();
        }
        ,project: function(id) {
console.log(id);
          App.View.Navigation.selectProject(id);
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
    });
    App.start();
  });
});
