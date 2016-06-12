define([
  'text!standard/templates/japanese.html'
  ,'text!standard/templates/programs.html'
  ,'standard/lib'
  ,'standard/models/profile'
  ,'moment'
], function(language, templatePrograms, standardLib, modelProfile, moment){
  var wait_count = 1;
  //
  var Today = moment().format('YYYY-MM-DD');
  //
  templatePrograms = SNBinder.get_named_sections_text(templatePrograms);
  // テンプレート展開時の追加プロパティ
  var templateParams = {
    Text: _.extend({}, SNBinder.get_named_sections_text(language), templatePrograms)
    ,Today: Today
  };
  standardLib.expandTemplateParams(templateParams);
  // ログインユーザー
  var LoginUser = new modelProfile.Model.Profile();
  LoginUser.listenToOnce(LoginUser, 'sync', function(model){
    _(templateParams).extend({
      LoginUser: model.attributes
    });
    wait_count--;
  });
  LoginUser.fetch();
  //
  var logout = function(){
    location.href = '/user/logout';
  };
  //
  var getProgram = function(code){
    return _(['title', 'help', 'program']).reduce(function(ret, type){
      var value = templatePrograms[type+'_'+code] || $.trim(templatePrograms['no'+type]);
      if (value) {
        ret[type] = value;
      }
      return ret;
    }, {});
  };
  //
  return {
    checkFinishedLoad: function(){
      return (wait_count <= 0);
    }
    ,templateParams: templateParams
    ,getProgram: getProgram
    ,LoginUser: LoginUser
    ,logout: logout
    ,Today: Today
  };
});
