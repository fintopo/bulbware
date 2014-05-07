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
      ,'text!templates/todo.html'
      ,'views/project'
      ,'views/task'
    ], function(BULBWARE, viewsProfile, templates, viewsProject, viewsTask){
      templates = SNBinder.get_named_sections_text(templates);
      //
      var App = new Marionette.Application();
      App.addRegions({
        'profile': '#profile'
        ,'projects': '#projects'
        ,'project': '#project'
        ,'tasks': '#tasks'
        ,'sidebar': '#sidebar'
      });
      App.module('View', function(View, App) {
        View.Profile = new viewsProfile.View.Profile();
        View.Projects = new viewsProject.View.Projects();
        View.Project = viewsProject.View.editProject;
        View.Tasks = new viewsTask.View.Tasks();
      });
      App.module('Router', function(Router, App) {
        Router.Router = Marionette.AppRouter.extend({
          appRoutes: {
            ':tab': 'changeTab'
          }
        });
        Router.Controller = Marionette.Controller.extend({
          initialize: function(options) {
            var _this = this;
            //
            _this.listenToOnce(App.View.Projects.collection, 'sync', function(){
              _this.toFragmentProject(Backbone.history.fragment); // プロジェクトが取得できたらタブ設定をする
            });
            _this.listenTo(App.View.Projects.collection, 'remove', function(){
              _this.toFirstProject();
            });
            _this.listenTo(App.View.Projects, 'newProject', function(project){
              _this.project = project;
              _this.toProject();
            });
          }
          ,changeTab: function(tab) {
            this.toFragmentProject(tab);
          }
          ,toFirstProject: function(){
            this.project = App.View.Projects.collection.first();
            this.toProject();
          }
          ,toProject: function() {
            if (!this.project) return;
            Backbone.history.navigate(this.project.id, {trigger: true});
          }
          ,toFragmentProject: function(tab){
            var _this = this;
            //
            if (!tab) {
              _this.toFirstProject();
              return;
            } else {
              _this.project = App.View.Projects.collection.findWhere({
                id: tab
              });
              if (!_this.project) {
                // プロジェクト名で指定されている場合は、idで遷移し直す
                _this.project = App.View.Projects.collection.findWhere({
                  name: tab
                });
                if (_this.project) {
                  _this.toFragmentProject(_this.project.id);
                } else {
                  _this.toFirstProject();            
                }
                return;
              }
            }
            //
            if (_this.project) {
              App.View.Projects.trigger('action');
              //
              App.project.show(new App.View.Project({
                model: _this.project
                ,collectionTasks: App.View.Tasks.collection
              }));
              //
              App.View.Tasks.setProject(_this.project);
            }
          }
        });
      });
      App.addInitializer(function() {
        $('#body').html(templates.body);
        //
        App.profile.show(App.View.Profile);
        App.projects.show(App.View.Projects);
        App.tasks.show(App.View.Tasks);
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