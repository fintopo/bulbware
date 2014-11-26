define([
  'bulbware/view'
  ,'bulbware/obj'
  ,'views/profile'
  ,'views/todo'
  //
  ,'lib/slidebar/jquery.slidebar'
], function(bulbwareView, bulbwareObj, viewsProfile, viewsTodo){
  // Navigation表示用
  var viewNavigation = Marionette.LayoutView.extend({
    el: '#navigation'
    ,template: false
    ,initialize: function(){
      var _this = this;
      //
      _this.view_profile = new viewsProfile.View.Profile();
      _this.listenTo(_this.view_profile, 'showPanel', function(values){
        _this.triggerMethod('showPanel', values);
      });
      //
      _this.view_projects = new viewsTodo.View.Projects();
      _this.listenTo(_this.view_projects, 'showPanel', function(values){
        _this.triggerMethod('showPanel', values);
      });
      _this.listenTo(_this.view_projects, 'add', function(){
        _this.resize();
      });
      _this.listenToOnce(viewsTodo.Projects, 'sync', function(){
        _this.resize();
        _this.triggerMethod('ready');
      });
		  $(window).resize(function() {
        _this.resize();
      });
      //
      _this._isShown = true;
      _this.render();
    }
    ,regions: {
      'profile': '.js_profile'
      ,'projects': '.js_projects'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.profile.show(_this.view_profile);
      _this.projects.show(_this.view_projects);
    }
    ,adjust: function(){
      var _this = this;
      //
      _this.$el.slidebar({
			  position: 'top'
        ,height: '200px'
		  });
    }
    ,ui: {
      'header': '.navigation-header'
      ,'footer': '.navigation-footer'
    }
    ,resize: function(){
      this.closeMenu();
      this.$el.slidebar('reset', {
        height: this.ui.footer.height() + this.ui.footer.offset().top - this.ui.header.height()
		  });
    }
    ,closeMenu: function(){
      this.$el.slidebar('close');
    }
    ,selectProject: function(id){
      var _this = this;
      //
      var model = (id) ? viewsTodo.Projects.getModel(id) : viewsTodo.Projects.first();
      _this.view_projects.selectItem(model);
    }
    ,editProfile: function(id){
      var _this = this;
      //
      _this.view_profile.triggerMethod('editProfile');
    }
  });
  bulbwareView.mixin.view(viewNavigation);
  //
  return {
    View: {
      Navigation: viewNavigation
    }
  };
});  
