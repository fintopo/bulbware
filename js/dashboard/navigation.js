define([
  'bulbware/view'
  ,'bulbware/obj'
  ,'standard/menu'
  ,'text!dashboard/menu.html'
  ,'standard/lib'
  ,'standard/views/profile'
  ,'todo/todo'
  //
  ,'lib/slidebar/jquery.slidebar'
], function(bulbwareView, bulbwareObj, standardMenu, templates, standardLib, viewsProfile, viewsTodo){
  templates = SNBinder.get_named_sections_text(templates);
  //
  var viewSubmenuItem = standardMenu.View.SubmenuItem.extend({
    onRender: function(){
      var _this = this;
      //
      var method = (_this.model.get('hidden')) ? 'hide' : 'show';
      _this.$el[method]();
    }
  });
  bulbwareView.mixin.template(viewSubmenuItem, templates, 'submenu_item');
  //
  var viewMenuItem = standardMenu.View.MenuItem.extend({
    childView: viewSubmenuItem
  });
  bulbwareView.mixin.template(viewMenuItem, templates, 'menu_item');
  //
  var viewMenu = standardMenu.View.Menu.extend({
    childView: viewMenuItem
  });
  bulbwareView.mixin.template(viewMenu, templates, 'header');
  // Navigation表示用
  var viewNavigation = Marionette.LayoutView.extend({
    el: '#navigation'
    ,template: false
    ,initialize: function(){
      var _this = this;
      //
      _this._isShown = true;
      _this.render();
      //
      $('#modal_shield').click(function(){
        _this.closeMenu();
      });
      //
      _this.resize();
		  $(window).resize(_.debounce(function(){
        _this.resize();
      }));
    }
    ,regions: {
      'profile': '.js_profile'
      ,'menu': '.js_menu'
      ,'projects': '.js_projects'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.view_menu = standardMenu.getMainMenu(viewMenu, {
        css_prefix: 'submenu_'
      });
      _this.listenTo(_this.view_menu, 'selectMenu', function(model_menu){
        _this.triggerMethod('selectMenu', model_menu);
      });
      _this.menu.show(_this.view_menu);
      //
      _this.view_profile = new viewsProfile.View.Profile();
      _this.listenTo(_this.view_profile, 'showPanel', function(obj){
        _this.callMenu(obj);
      });
      _this.profile.show(_this.view_profile);
      //
      _this.view_projects = new viewsTodo.viewMenu();
      _this.listenTo(_this.view_projects, 'callOrder', function(obj, id){
        _this.triggerMethod('callOrder', obj, id);
      });
      _this.listenTo(viewsTodo.collection, 'add', function(){
        _this.resize();
      });
      _this.listenToOnce(viewsTodo.collection, 'sync', function(){
        _this.resize();
        _this.triggerMethod('ready');
      });
      _this.projects.show(_this.view_projects);
    }
    ,adjust: function(){
      var _this = this;
      //
      _this.$el.slidebar({
			  position: 'top'
        ,height: this.getMenuBodyHeight()
        ,onOpen: function(){
          $('#modal_shield').width(window.innerWidth).height(window.innerHeight).show();
        }
        ,onClose: function(){
          $('#modal_shield').hide();
        }
		  });
    }
    ,getMenuBodyHeight: function(){
      return this.ui.menu_body.outerHeight() + this.ui.footer.outerHeight();
    }
    ,ui: {
      'header': '.navigation-header'
      ,'footer': '.navigation-footer'
      ,'logout': '.jsbtn_logout'
      ,'menu_body': '.js_menu_body'
    }
    ,resize: function(){
      this.closeMenu();
      this.$el.slidebar('reset', {
        height: this.getMenuBodyHeight()
		  });
    }
    ,closeMenu: function(){
      this.$el.slidebar('close');
    }
    ,logout: function(){
      this.view_menu.logout();
    }
    ,editProfile: function(id){
      var _this = this;
      //
      _this.view_profile.triggerMethod('editProfile');
    }
    ,callMenu: function(obj, options){
      var _this = this;
      //
      if (!_this.view_menu.callMenu(obj, options)) {
        standardLib.alertError('存在しないパーマリンクでした。');
      }
    }
    ,triggers: {
      'click @ui.logout': 'logout'
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
