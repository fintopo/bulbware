define([
], function(){
  var router = Backbone.Router.extend({
    initialize: function(options) {
      this.view = options.view;
      Backbone.history.start();
    },
    routes: {
      ':tab': 'changeTab'
    },
    changeTab: function(tab) {
      var _this = this;
      //
      _this.view.$('.nav-tab').removeClass('active');
      _this.view.$('.tab-pane').removeClass('active');
      //
      _this.view.$('.tab-'+tab).addClass('active');
      //
      if (typeof this.view.afterChangeTab == 'function') {
        this.view.afterChangeTab(tab);
      }
    }
  });
  //
  return {
    router: router
  };
});