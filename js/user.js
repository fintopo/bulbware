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
    'text': 'lib/requirejs/text',
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min',
    'jquery.ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min',
    'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
    'underscore': 'lib/underscore/underscore-min',
    'underscore.string': 'lib/underscore/underscore.string.min', // http://epeli.github.io/underscore.string/
    'backbone': 'lib/backbone/backbone',
    'backbone.marionette': 'lib/backbone/backbone.marionette',
    'moment': 'lib/moment/moment.min', // http://momentjs.com/
	'json2': 'lib/json2/json2',
    'snbinder': 'lib/snbinder/snbinder' // https://github.com/snakajima/SNBinder
  }
//  urlArgs: 'bust=' +  (new Date()).getTime()
});
        
require([
  'bulbware/loadcss'
], function (lib) {
  lib.loadCss('http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.1/themes/base/jquery-ui.css');
  lib.loadCss('//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css');
  lib.loadCss('//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css');
  lib.loadCss('/js/templates/main.css');
  lib.loadCss('/js/templates/user.css');
  lib.loadCss('/js/lib/alt-checkbox-master/jquery.alt-checkbox.icon-font.min.css');
  lib.loadCss('/js/lib/alt-checkbox-master/jquery.alt-checkbox.min.css');
  lib.loadCss('/js/lib/tagsinput/jquery.tagsinput.css');
  //
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
      'bulbware/lib'
      ,'views/profile'
      ,'text!templates/user.html'
    ], function(BULBWARE, viewsProfile, templates){
      templates = SNBinder.get_named_sections_text(templates);
      //
      var App = new Marionette.Application();
      App.addRegions({
        'profile': '#profile'
      });
      App.module('View', function(View, App) {
        View.Profile = new viewsProfile.View.editProfile();
      });
      App.module('Router', function(Router, App) {
        Router.Router = Marionette.AppRouter.extend({
          appRoutes: {
          }
        });
        Router.Controller = Marionette.Controller.extend({
          initialize: function(options) {
            var _this = this;
            //
          }
        });
      });
      App.addInitializer(function() {
        $('#body').html(templates.body);
        //
        App.profile.show(App.View.Profile);
        //
        new App.Router.Router({
          controller: new App.Router.Controller()
        });
        Backbone.history.start();
      });
      App.start();
    });
  });
});