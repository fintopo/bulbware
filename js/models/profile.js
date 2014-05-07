define([
  'bulbware/model'
], function(bulbwareModel){
  //
  var modelProfile = bulbwareModel.Model.Profile.extend({
    adjust: function(){
      var _this = this;
      bulbwareModel.Model.Profile.prototype.adjust.apply(this, arguments);
      //
    }
  });
  //
  return {
    Model: {
      Profile: modelProfile
    }
  };
});
