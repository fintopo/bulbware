define([
  'bulbware/lib'
  ,'standard/lib'
  ,'moment'
], function(bulbwareLib, standardLib, moment){
  var url_base = '/api/';
  //
  var Model = Backbone.Model.extend({
    initialize: function(options) {
      options = options || {};
      if (!this.app) {
        this.app = options.app || 'standard';
      }
      if (!this.url_get) {
        this.url_get = this.url_base + this.app + this.api_get;
      }
      if (!this.url_update) {
        this.url_update = this.url_base + this.app + this.api_update;
      }
      if (!this.url_delete) {
        this.url_delete = this.url_base + this.app + this.api_delete;
      }
      if (!this.url_upload) {
        this.url_upload = this.url_base + this.app + this.api_upload;
      }
      //
      this.listenTo(this, 'change', this.adjustChange);
      this.listenTo(this, 'sync', this._adjust);
      this._adjust();
    }
    ,_adjust: function() {
      this.adjust();
      this.adjustChange();
      this.trigger('adjust');
    }
    ,adjustChange: function() {
      return this.attributes;
    }
    ,adjust: function() {
      var _this = this;
      // options
      var options = _this.get('options');
      try {
        _this.set('option_values', (_.isString(options) ? JSON.parse(options.split('\n').join('\\n')) : options), {silent: true});
      } catch(err) {
      }
      if (typeof _this.get('option_values') == 'undefined') {
        _this.set('option_values', {}, {silent: true});
      }
      //
      var create_datetime = moment(_this.get('create_datetime'));
      if (create_datetime.isValid()) {
        var create_date = create_datetime.format('YYYY-MM-DD');
        var create_time = create_datetime.format('HH:mm:ss');
      }
      var update_datetime = moment(_this.get('update_datetime'));
      if (update_datetime.isValid()) {
        var update_date = update_datetime.format('YYYY-MM-DD');
        var update_time = update_datetime.format('HH:mm:ss');
      }
      _this.set({
        create_date: create_date || '',
        create_time: create_time || '',
        update_date: update_date || '',
        update_time: update_time || ''
      }, {silent: true});
      //
      return _this.attributes;
    }
    ,get: function(attr) {
      var ret = _.result(this.attributes, 'attr');
      if (!ret) {
        ret = bulbwareLib.getDeep(this.attributes, attr);
      }
      return ret;
    }
    ,get_option: function(param) {
      var option_values = this.get('option_values');
      return (option_values) ? option_values[param] : undefined;
    },
    set_options: function(params, options){
      this.set({
        option_values: $.extend(true, {}, this.get('option_values'), params)
      }, _(options || {}).defaults({silent: true}));
    },
    get_update_params: function(){
      return {};
    },
    get_read_params: function(){
      return {};
    },
    get_cache_params: function(method){
      return {};
    },
    eventAfterUpdate: function(ret){
    },
    sync: function(method, model, options) {
      var _this = this;
      //
      var cache_params = $.extend({
        bypass_cache:true, 
        cache_result:true
      }, this.get_cache_params(method));
      //
      this.trigger(method);
      //
      switch (method) {
      case 'create':
      case 'update':
        var update_params = this.get_update_params();
        var option_values = this.get('option_values');
        if (option_values) {
          update_params.options = JSON.stringify(option_values);
        }
console.info(update_params);
        SNBinder.post(model.url_update, update_params, true, function(msgs) {
console.info(msgs);
          if (msgs.object) {
            if (!_this.reject_success) {
              standardLib.alertSuccess('保存しました');
            }
            //
            var success = options.success;
            if (typeof success == 'function') {
              success(msgs.object);
            }
          }
        });
        break;
      case 'delete':
        SNBinder.post(model.url_delete, {id: model.id}, false, function(){
          var success = options.success;
          if (typeof success == 'function') {
            success([]);
          }
        });
        break;
      default: // read
        var get_params = $.extend({
          id: model.id
        }, this.get_read_params());
        SNBinder.get(model.url_get, get_params, true, function(ret) {
          if (ret.options) {
            try {
              ret.option_values = JSON.parse(ret.options.split('\n').join('\\n'));
            } catch(err) {
              console.error(err + ':' + ret.options);
            }
          }
          if (!ret.option_values) {
            ret.option_values = {};
          }
          //
          var success = options.success;
          if (typeof success == 'function') {
            success(ret);
          }
        }, cache_params);
      }
    }
    ,toArrayTags: function(){
      var tags = this.get('tags');
      if (_.isString(tags)) {
        tags = tags.split(',');
      } else if (!_.isArray(tags)) {
        tags = [];
      }
      return tags;
    }
    ,inTags: function(tag){
      return _(this.toArrayTags()).contains(tag);
    }
    ,setTag: function(label, mode){
      var method = (mode) ? 'addTag' : 'removeTag';
      this[method](label);
    }
    ,addTag: function(tag) {
      var tags = this.get('tags') || [];
      tags.push(tag);
      tags = _(tags).chain()
          .uniq()
          .flatten()
          .value();
      this.set({
        tags: tags
      });
    }
    ,removeTag: function(tag) {
      var tags = this.get('tags') || [];
      tags = _(tags).chain()
          .uniq()
          .without(tag)
          .value();
      this.set({
        tags: tags
      });
    }
    ,uploadFile: function(data, options){
      var _this = this;
      //
      var formData = new FormData(data);
      $.ajax(_this.url_upload, _.extend({
        method: 'POST',
        contentType: false,
        processData: false,
        data: formData,
        dataType: 'json'
      }, options));
    }
  });
  var Collection = Backbone.Collection.extend({
    initialize: function(options) {
      options = options || {};
      if (!this.app) {
        this.app = options.app || 'standard';
      }
      if (!this.url_search) {
        this.url_search = this.url_base + this.app + this.api_search;
      }
      if (typeof options.search_params != 'undefined') {
        this.search_params = options.search_params;
      }
    },
    sync: function(method, model, options) {
      var _this = this;
      var cache_params = _.extend({
        bypass_cache:true, 
        cache_result:true
      }, options.cache_params);
      //
      _this.trigger(method);
      //
      SNBinder.get(model.url_search, _this.search_params, true, function(ret) {
        ret = _this.adjust(ret);
        var success = options.success;
        if (typeof success == 'function') {
          success(ret);
        }
      }, cache_params);
    }
    ,adjust: function(ret){
      return ret;
    }
    ,setSearchParams: function(params){
      this.search_params = _(this.conditionTypes).reduce(function(ret, func, name){
        if (ret[name]) {
          ret[name] = commonLib[func](ret[name]);
        }
        return ret;
      }, _.extend({}, params, _.result(this, 'option_search_params')));
    }
    ,search: function(params, options) {
      this.trigger('search');
      this.setSearchParams(params);
      this.fetch(_.extend({}, options, {reset: true}));
      //
      return this;
    }
    ,getModel: function(id, options){
      // Backbone.Collection.crate の代わり。
      // 新規登録時には、サーバーにオブジェクトを生成したくない。
      // createメソッドは、saveしてしまい、サーバーにオブジェクトが生成されるため。
      var _this = this;
      //
      options = _.extend({
        modeAddCollection: false
        ,callback: null
        ,model_defaults: null
        ,model_options: null
        ,modeInsertCollection: false // modelInsertで指定したモデルの後に追加する
        ,modelInsert: null
      }, options);
      //
      var call = true;
      var model = (id) ? _this.findWhere({id: id}) : null;
      if (!model) {
        model = new _this.model(_.extend({
          Header: _.result(_this.modelHeader, 'attributes')
        }, options.model_defaults), _.extend({
          collection: _this
        }, options.model_options));
        if (id) {
          model.id = id;
          call = false;
          if (_.isFunction(options.callback)) {
            _this.listenToOnce(model, 'sync', function(){ // fetchのoptions.successではsyncイベント発生前のためadjustが実行されない。
              _.defer(function(){
                options.callback(model);
              });
            });
          }
          model.fetch();
          options.modeAddCollection = true;
        }
        if (options.modeAddCollection){
          model.flagAdd = true;
          _this.add(model); 
        }
        if (options.modeInsertCollection){
          model.flagAdd = true;
          var index = _this.indexOf(options.modelInsert); 
          _this.models.splice(index+1, 0, model);
          _this.trigger('add', model, _this);
        }
      }
      if (_.isFunction(options.callback) && call) {
        options.callback(model);
      }
      //
      return model;
    }
  });
  // Profile
  var Profile = Model.extend({
    url_get: '/user/api/get_profile',
    url_update: '/user/api/update_profile',
    url_delete: '',
    url_upload: '/user/api/append_icon',
    defaults: {
      id: null,
      name: '',
      email: '',
      memo: '',
      options: {}
    },
    get_update_params: function(){
      return {
        name: this.get('name'),
        email: this.get('email'),
        memo: this.get('memo'),
        option_values: this.get('option_values')
      };
    }
    ,inGroup: function(groups){
      var _this = this;
      //
/*      var option_groups = _(_this.get('UserGroup')).words(',');
      return (_.intersection(option_groups, groups).length > 0);
*/
      return true;
    }
    ,inOptionGroup: function(groups){
      var _this = this;
      //
/*      var option_groups = _(_this.get('OptionUserGroup')).words(',');
      return (_.intersection(option_groups, groups).length > 0);
*/
      return true;
    }
  });
  // Project
  var Project = Model.extend({
    url_base: url_base,
    api_get: '/get_project',
    api_update: '/update_project',
    api_delete: '/delete_project',
    defaults: {
      id: null
      ,name: ''
      ,options: {}
      ,tags: []
      ,sorttext: ''
      ,owner_id: ''
      ,owner_name: ''
      ,create_datetime: ''
      ,update_datetime: ''
    },
    get_update_params: function(){
      return {
        id: (this.id || '')
        ,name: this.get('name')
        ,tags: this.toArrayTags()
        ,sorttext: this.get('sorttext')
      };
    }
    ,deleteElements: function(params, callback){
      params = _.extend({
        project: this.id
      }, params);
      SNBinder.post(this.url_base + this.app + '/delete_elements', params, true, callback);
    }
  });
  //
  var Projects = Collection.extend({
    url_base: url_base,
    api_search: '/search_projects',
    model: Project,
    search_params: {}
  });
  // Page
  var Page = Model.extend({
    url_base: url_base,
    api_get: '/get_page',
    api_update: '/update_page',
    api_delete: '/delete_page',
    defaults: {
      id: null
      ,name: ''
      ,options: {}
      ,tags: []
      ,sorttext: ''
      ,project_id: ''
      ,project_name: ''
      ,owner_id: ''
      ,owner_name: ''
      ,create_datetime: ''
      ,update_datetime: ''
    },
    get_update_params: function(){
      var _this = this;
      //
      return {
        id: (_this.id || '')
        ,name: _this.get('name')
        ,project_id: _this.get('project_id')
        ,tags: _this.toArrayTags()
        ,sorttext: _this.get('sorttext')
      };
    }
    ,deleteElements: function(params, callback){
      params = _.extend({
        page: this.id
      }, params);
      SNBinder.post(this.url_base + this.app + '/delete_elements', params, true, callback);
    }
  });
  //
  var Pages = Collection.extend({
    url_base: url_base,
    api_search: '/search_pages',
    model: Page,
    search_params: {}
  });
  // Item
  var Item = Model.extend({
    url_base: url_base,
    api_get: '/get_item',
    api_update: '/update_item',
    api_delete: '/delete_item',
    api_upload: '/append_file_to_item',
    defaults: {
      id: null
      ,name: ''
      ,options: {}
      ,tags: []
      ,sorttext: ''
      ,project_id: ''
      ,project_name: ''
      ,owner_id: ''
      ,owner_name: ''
      ,create_datetime: ''
      ,update_datetime: ''
    },
    get_update_params: function(){
      var _this = this;
      //
      return {
        id: (_this.id || '')
        ,name: _this.get('name')
        ,project_id: _this.get('project_id')
        ,tags: _this.toArrayTags()
        ,sorttext: _this.get('sorttext')
      };
    }
    ,deleteElements: function(params, callback){
      params = _.extend({
        item: this.id
      }, params);
      SNBinder.post(this.url_base + this.app + '/delete_elements', params, true, callback);
    }
  });
  //
  var Items = Collection.extend({
    url_base: url_base,
    api_search: '/search_items',
    model: Item,
    search_params: {}
  });
  // Attribute
  var Attribute = Model.extend({
    url_base: url_base,
    api_get: '/get_attribute',
    api_update: '/update_attribute',
    api_delete: '/delete_attribute',
    defaults: {
      id: null
      ,name: ''
      ,options: {}
      ,tags: []
      ,sorttext: ''
      ,project_id: ''
      ,project_name: ''
      ,owner_id: ''
      ,owner_name: ''
      ,create_datetime: ''
      ,update_datetime: ''
    },
    get_update_params: function(){
      var _this = this;
      //
      return {
        id: (_this.id || '')
        ,name: _this.get('name')
        ,project_id: _this.get('project_id')
        ,tags: _this.toArrayTags()
        ,sorttext: _this.get('sorttext')
      };
    }
    ,deleteElements: function(params, callback){
      params = _.extend({
        attribute: this.id
      }, params);
      SNBinder.post(this.url_base + this.app + '/delete_elements', params, true, callback);
    }
  });
  //
  var Attributes = Collection.extend({
    url_base: url_base,
    api_search: '/search_attributes',
    model: Attribute,
    search_params: {}
  });
  // Element
  var Element = Model.extend({
    url_base: url_base,
    api_get: '/get_element',
    api_update: '/update_element',
    api_delete: '/delete_element',
    defaults: {
      id: null
      ,options: {}
      ,tags: []
      ,sorttext: ''
      ,project_id: ''
      ,project_name: ''
      ,page_id: ''
      ,page_name: ''
      ,item_id: ''
      ,item_name: ''
      ,attribute_id: ''
      ,attribute_name: ''
      ,owner_id: ''
      ,owner_name: ''
      ,element_datetime: ''
      ,create_datetime: ''
      ,update_datetime: ''
    },
    get_update_params: function(){
      var _this = this;
      //
      var element_datetime = moment(_this.get('element_datetime'));
      if (element_datetime.isValid()) {
        element_datetime = element_datetime.format('YYYY/MM/DD HH:mm:ss');
      } else {
        element_datetime = '';
      }
      //
      return {
        id: (_this.id || '')
        ,project_id: _this.get('project_id')
        ,page_id: _this.get('page_id')
        ,item_id: _this.get('item_id')
        ,attribute_id: _this.get('attribute_id')
        ,tags: _this.toArrayTags()
        ,sorttext: _this.get('sorttext')
        ,element_datetime: element_datetime
      };
    }
  });
  //
  var Elements = Collection.extend({
    url_base: url_base,
    api_search: '/search_elements',
    model: Element,
    search_params: {}
  });
  //
  return {
    Collection: {
      Base: Collection
      ,Projects: Projects
      ,Pages: Pages
      ,Items: Items
      ,Attributes: Attributes
      ,Elements: Elements
    }
    ,Model: {
      Base: Model
      ,Profile: Profile
      ,Project: Project
      ,Page: Page
      ,Item: Item
      ,Attribute: Attribute
      ,Element: Element
    }
  };
});
