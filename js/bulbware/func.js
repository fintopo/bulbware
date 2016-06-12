define([
  'standard/lib'
], function(standardLib){
  // objからcodeを得る
  var getMenuCode = (function(){
    // menuItemsを検索用に展開しておく。
    var search_items =  _(standardLib.menuItems).chain()
        .map(function(menu_item){
          return menu_item.submenu_items;
        })
        .flatten()
        .value();
    //
    return function(obj){
      return _(search_items).chain()
          .findWhere({obj: obj})
          .result('code')
          .value();      
    };
  })();
  //
  var getOrderCode = function(OrderTypes){
    return function(orderType){
      return _(OrderTypes).chain()
          .invert()
          .result(orderType)
          .value();
    };
  };
  // OrderTypeからobjを得る
  var getOrderObj = function(OrderTypes, OrderObj){
    return function(orderType){
      var type = _(OrderTypes).chain()
          .invert()
          .result(orderType)
          .value();
      return OrderObj[type];
    };
  };
  // タイプ名を指定して、コード一覧を得る
  var getOrderTypes = function(OrderTypes){
    return function(types){
      return _(OrderTypes).chain()
          .pick(types)
          .values()
          .value();
    };
  };
  //
  return {
    getOrderObj: getOrderObj
    ,getMenuCode: getMenuCode
    ,getOrderCode: getOrderCode
    ,getOrderTypes: getOrderTypes
  };
});
