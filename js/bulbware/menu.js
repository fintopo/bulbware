define([
  'bulbware/obj'
  ,'bulbware/model'
  ,'standard/lib'
], function(bulbwareObj, bulbwareModel, standardLib){
  //
  var modelMenu = bulbwareModel.Model.Base.extend({
    defaults: {
      code: ''
      ,obj: ''
      ,program: ''
      ,title: ''
      ,help: ''
      ,hidden: false
    }
    ,adjust: function() {
      var _this = this;
      var attr = _this.attributes;
      //
      var params = bulbwareObj.getProgram(attr.code);
      _(attr).extend(_(params).pick('title', 'help'));
      if (!attr.program) {
        attr.program = params.program;
      }
      //
      return attr;
    }
  });
  var collectionMenu = bulbwareModel.Collection.Base.extend({
    model: modelMenu
  });
  //
  var viewSubmenuItem = Marionette.ItemView.extend({
    initialize: function(options) {
      var _this = this;
      //
      _this.$el.addClass(options.css_prefix + _this.model.get('code'));
    }
    ,setActive: function(name, ret){
      var _this = this;
      //
      var code = _this.model.get('code');
      var method = (code == name) ? 'addClass': 'removeClass';
      _this.$el[method]('active');
      //
      ret.isActive = ret.isActive || (code == name);
    }
    ,callMenu: function(obj, options){
      var _this = this;
      if (!obj) return;
      if (options.flag) return;
      //
      var value = _(_this.model.attributes).chain()
          .pick('code', 'obj')
          .toArray()
          .contains(obj)
          .value();
      if (value) {
        options.flag = true;
        _this.selectMenu();
      }
    }
    ,selectMenu: function(){
      this.triggerMethod('selectMenu', this.model);
    }
    ,getURL: function(){
      return '';
    }
    ,events: {
      'click': 'clickSelectMenu'
    }
    ,clickSelectMenu: function(e){
      if (e.ctrlKey) {
        var url = this.getURL();
        if (url) {
//          window.open(url);
          return;
        }
      }
      this.selectMenu();
    }
  });
  //
  var viewMenuItem = Marionette.CompositeView.extend({
    childView: viewSubmenuItem
    ,initialize: function(options) {
      var _this = this;
      //
      _this.childViewOptions = {
        css_prefix: options.css_prefix
      };
      _this.$el.addClass(options.css_prefix + options.index);
      _this.collection = new collectionMenu(_this.model.get('submenu_items'));
    }
    ,onAddChild: function(view){
      var _this = this;
      //
      view.listenTo(_this, 'setActive', view.setActive);
      view.listenTo(_this, 'callMenu', view.callMenu);
    }
    ,setActive: function(name){
      var _this = this;
      //
      var ret = {
        isActive: false
      };
      //
      _this.triggerMethod('setActive', name, ret);
      //
      var method = (ret.isActive) ? 'addClass': 'removeClass';
      _this.$el[method]('active');
    }
    ,callMenu: function(obj, options){
      this.triggerMethod('callMenu', obj, options);
    }
    ,callFirstMenu: function(){
      var _this = this;
      //
      var ret = _this.model.get('skip');
      if (!ret) {
        _this.triggerMethod('selectMenu', _this.collection.first());
      }
      return ret;
    }
    ,childEvents: {
      'selectMenu': 'onChildSelectMenu'
    }
    ,onChildSelectMenu: function(childView, model){
      this.triggerMethod('selectMenu', model);
    }
  });
  //
  var viewMenu = Marionette.CompositeView.extend({
    childView: viewMenuItem
    ,childViewOptions: function(item, index){
      var _this = this;
      return {
        index: _.pad(index+1, 2, '0')
        ,css_prefix: _this.options.css_prefix
      };
    }
    ,initialize: function(options) {
      var _this = this;
      //
      _this.collection = new bulbwareModel.Collection.Base(
        _(_this.options.menu_items).chain()
            .filter(function(menu_item){
              var ret = bulbwareObj.LoginUser.inGroup(menu_item.groups);
              if (menu_item.subgroups) {
                ret = ret && bulbwareObj.LoginUser.inOptionGroup(menu_item.subgroups);
              }
              return ret;
            })
            .value()
      );
      _this.name = options.name;
    }
    ,onAddChild: function(view){
      var _this = this;
      //
      view.listenTo(_this, 'setActive', view.setActive);
      view.listenTo(_this, 'callMenu', view.callMenu);
    }
    ,setActive: function(name){
      this.triggerMethod('setActive', name);
    }
    ,callFirstMenu: function(){
      var _this = this;
      //
      $.each(_this.children._views, function(key, view){
        return (view.callFirstMenu()) ? true : false;
      });
    }
    ,callMenu: function(obj){
      var _this = this;
      //
      var options = {
        flag: false
      };
      //
      if (!_.isUndefined(obj)) {
        this.triggerMethod('callMenu', obj, options);
      }
      //
      if (!options.flag) {
        _this.callFirstMenu();
      }
      //
      return _.isUndefined(obj) ? true : options.flag;
    }
    ,logout: function(){
      bulbwareObj.logout();
    }
    ,events: {
      'click .jsbtn_logout': 'clickLogout'
    }
    ,clickLogout: function(){
      this.logout();
    }
    ,childEvents: {
      'selectMenu': 'selectMenu'
    }
    ,selectMenu: function(view, model){
      this.triggerMethod('selectMenu', model);
    }
  });
  //
  var getMainMenu = function(viewMenu, options){
    return new viewMenu(_.extend({
      css_prefix: 'prefix'
      ,menu_items: standardLib.menuItems
    }, options));
  };
  //
  return {
    View: {
      Menu: viewMenu
      ,MenuItem: viewMenuItem
      ,SubmenuItem: viewSubmenuItem 
    }
    ,getMainMenu: getMainMenu
  };
});
