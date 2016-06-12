define([
  'bulbware/menu'
  ,'bulbware/lib'
], function(bulbwareMenu, bulbwareLib){
  //
  var viewSubmenuItem = bulbwareMenu.View.SubmenuItem.extend({
    onRender: function(){
      var _this = this;
      //
      if (bulbwareLib.getCookie('screen_mode') == _this.model.get('obj')) {
        _this.$el.addClass('active');
      }
    }
    ,getURL: function(){
      return location.pathname + '#' + this.model.get('code');
    }
  });
  //
  var viewMenuItem = bulbwareMenu.View.MenuItem.extend({
    childView: viewSubmenuItem
  });
  //
  var viewMenu = bulbwareMenu.View.Menu.extend({
    childView: viewMenuItem
  });
  //
  return {
    View: {
      Menu: viewMenu
      ,MenuItem: viewMenuItem
      ,SubmenuItem: viewSubmenuItem 
    }
    ,getMainMenu: bulbwareMenu.getMainMenu
  };
});
