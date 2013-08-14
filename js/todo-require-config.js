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
    'snbinder': {
      deps: ['jquery']
    },
    'bulbware': {},
    'todo': {}
  },  
      
  paths: {
    'text': 'lib/requirejs/text',
    'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
    'jquery.ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min',
    'bootstrap': 'lib/bootstrap/js/bootstrap.min',
    'underscore': 'lib/underscore/underscore-min',
    'underscore.string': 'lib/underscore/underscore.string.min', // http://epeli.github.io/underscore.string/
    'backbone': 'lib/backbone/backbone',
    'moment': 'lib/moment/moment.min', // http://momentjs.com/
	'json2': 'lib/json2/json2',
    'snbinder': 'lib/snbinder/snbinder' // https://github.com/snakajima/SNBinder
  }
//  urlArgs: 'bust=' +  (new Date()).getTime()
});
        
require([
  'bulbware/loadcss'
], function (lib) {
  lib.loadCss('http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/themes/base/jquery-ui.css');
  lib.loadCss('/js/lib/bootstrap/css/bootstrap.min.css');
  lib.loadCss('/js/lib/bootstrap/css/bootstrap-responsive.min.css');
  lib.loadCss('/js/templates/todo.css');
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
    'moment',
    'json2',
    'snbinder'
  ], function () {
    require([
      'todo'
    ], function (app) {
      app.start();
    });
  });
});