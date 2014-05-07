define([
  'bulbware/model'
  ,'models/lib'
], function(bulbwareModel, modelsLib){
  //
  var modelProject = bulbwareModel.Model.Project.extend({
    app: modelsLib.app
    ,get_update_params: function(){
      var _this = this;
      var ret = bulbwareModel.Model.Project.prototype.initialize.apply(this, arguments);
      //
      return _(ret).extend({
        sorttext: _this.get('name')
      });
    }
  });
  //
  var collectionProjects = bulbwareModel.Collection.Projects.extend({
    app: modelsLib.app
    ,model: modelProject
    ,search_params: {
      create_name: 'Main' // 存在しない場合は生成する
    }
  });
  //
  return {
    Collection: {
      Projects: collectionProjects
    }
    ,Model: {
      Project: modelProject
    }
  };
});
