define([
  'bulbware/lib'
  ,'text!standard/template/japanese.html'
  ,'standard/lib'
  ,'standard/model/profile'
], function(bulbwareLib, common_language, standardLib, modelProfile){
  var wait_count = 1;
  // テンプレート展開時の追加プロパティ
  var templateParams = {
    Text: _.extend({}, SNBinder.get_named_sections_text(common_language))
    ,Today: moment().format('YYYY-MM-DD')
  };
  standardLib.expandTemplateParams(templateParams);
  // ログインユーザー
  var Profile = new modelProfile.Model.Profile();
  Profile.listenToOnce(Profile, 'sync', function(model){
    _(templateParams).extend({
      Profile: model.attributes
    });
    wait_count--;
  });
  Profile.fetch();
  //
  var logout = function(){
    location.href = '/user/logout';
  };
  //
  return {
    checkFinishedLoad: function(){
      return (wait_count <= 0);
    }
    ,templateParams: templateParams
    ,Profile: Profile
    ,logout: logout
  };
});
