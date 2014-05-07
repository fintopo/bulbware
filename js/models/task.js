define([
  'bulbware/model'
  ,'models/lib'
], function(bulbwareModel, modelsLib){
  //
  var modelTask = bulbwareModel.Model.Element.extend({
    app: modelsLib.app
    ,tag_finished: 'finished'
    ,tag_unfinished: 'unfinished'
    ,defaults: function () {
      return _.defaults({
        options: {
          name: ''
          ,memo: ''
        }
      }, _.result(bulbwareModel.Model.Element.prototype, 'defaults'));
    }
    ,adjust: function(){
      var _this = this;
      bulbwareModel.Model.Element.prototype.adjust.apply(this, arguments);
      //
      _this.set({
        finished: (_this.inTags(_this.tag_finished)) ? 'checked' : ''
      });
    }
  });
  //
  var collectionTasks = bulbwareModel.Collection.Elements.extend({
    app: modelsLib.app
    ,model: modelTask
  });
  //
  return {
    Collection: {
      Tasks: collectionTasks
    }
    ,Model: {
      Task: modelTask
    }
  };
});
