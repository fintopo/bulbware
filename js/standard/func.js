define([
], function(){
  //
  var resetListBodyHeight = function(){
    // リスト領域の高さを計算する
    _.delay(function(){
      //
      var $list = $('#list');
      $list.find('.js_conditions').each(function(){
        var conditions_height = $(this).children(':first').outerHeight(true);
console.log('conditions_height', conditions_height);
        if (conditions_height <= 0) {
          conditions_height = 400;
        }
        $(this).slidebar('reset', {
          height: conditions_height
        });
      });
      //
      var height = $(window).outerHeight() - $('#header').outerHeight(true);
console.log('height', height);
      $list.css({
        height: height
      });
      $list.find('.cabinet-drawer').each(function(){
        $(this).find('.js_list_body').css({
          'height': height - $(this).find('.no-scroll').outerHeight(true)
        });
      });
    }, 500);
  };
  //
  return {
    resetListBodyHeight: resetListBodyHeight
  };
});
