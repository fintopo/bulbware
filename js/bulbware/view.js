define([
  'bulbware/lib'
  ,'bulbware/obj'
  ,'standard/lib'
  ,'text!standard/templates/panel.html'
  ,'moment'
  ,'underscore.string'
  //
  ,'bower_components/applyStyles/jquery.apply_styles'
], function(bulbwareLib, bulbwareObj, standardLib, panel_templates, moment, _s){
  panel_templates = SNBinder.get_named_sections_text(panel_templates);
  //
  var bindTemplate = function(template, attributes, templates){
    var step = _(template).clone();
    while (step.indexOf('$(_templates.') > 0) {
      step = SNBinder.bind(step, _.extend({
        id_s: (_.result(attributes, 'id') || '新規登録')
        ,templates: templates
      }, attributes, bulbwareObj.templateParams));
    }
    //
    return SNBinder.bind(step, _.extend({
      id_s: (_.result(attributes, 'id') || '新規登録')
    }, attributes, bulbwareObj.templateParams));
  };
  //
  var mixinTemplate = function(view, templates, section, options){
    // テンプレート展開を追加する
    options = _.extend({
      additionalTemplateParams: {}
    }, options);
    //
    var createHTML = function(section, attributes){
      try {
        var mode_section = _.result(attributes, 'mode_section');
        var template = templates[section+(mode_section || '')] || templates[section];
        return bindTemplate(template, _.extend({}, attributes, options.additionalTemplateParams), templates);
      } catch (e) {
        console.log(e, section, mode_section, templates, attributes);
      }
    };
    //
    var property = {
      tagName: _s.trim(templates[section+'_tagName']) || 'div'
      ,className: _s.trim(templates[section+'_className']) || ''
      ,templates: templates
      ,template_section: section
      ,template_options: options
      ,template: function(attributes){
        return createHTML(section, attributes);
      }
      ,createHTML: createHTML
    };
    //
    if (view.prototype.childView) {
      _(property).extend({
        childViewContainer: _s.trim(templates[section+'_container']) || ''
      });
    }
    //
    bulbwareLib.mixin(view, property);
  };
  //
  var mixinView = function(view){
    // Viewの共通機能
    bulbwareLib.mixin(view, {
      adjust: function(){
        this.triggerMethod('applyStyles');
        standardLib.adjustView.call(this);
      }
      ,onAdjust: function(){
        this.adjust();
      }
      ,onShow: function(){
        _.result(this, 'adjust');
      }
      ,onRender: function(){
        this.triggerMethod('applyStyles');
        if (this._isShown){
          _.result(this, 'adjust');
        }
      }
      ,onApplyStyles: function(){
        if (this.templates) {
          var params = $.fn.applyStyles('parse', {
            css: 'main {' + (this.templates[this.template_section+'_style'] || '') + '}'
          });
          this.$el.applyStyles({
            styles: _(params).chain().first().result('styles').value() || null
            ,css: String(this.templates[this.template_section+'_css'] || '').trim() || null
          });   
        }
        this.$el.applyStyles(this.styles);
      }
      ,getScrollOptions: function(){
        var _this = this;
        //
        return _.extend({
          mode: true
          ,offset: 60
        }, _(_this).result('optionsScroll'));
      }
      ,scrollTop: _.debounce(function(){
        var _this = this;
        //
        var options = _this.getScrollOptions();
        if (options.mode) {
          var top = _this.$el.offset().top;
          top -= options.offset;
          $('html,body').animate({ scrollTop: top }, 'slow');
        } else {
          _this.$el.get(0).scrollIntoView(true);
        }
      }, 300)
      ,insertHeader: function($this, view_header, max_height, options){
        // 印刷用ページにするため1ページ毎にページヘッダを挿入する
        // $thisの位置がmax_heightをオーバーしていたらview_headerを挿入する
        var _this = this;
        //
        options = _.extend({
          forceOutHeader: true // trueにするとヘッダ(Hタグ)がページの最後に残らないようにする。
        }, options);
        //
        var offset = $this.offset();
        var height = $this.outerHeight(true);
        if (offset.top + height >= max_height) {
          var view = new view_header({
            model: _this.model
          });
          view.render();
          //
          var $prev = $this.prev();
          if (options.forceOutHeader && $prev.length && _($prev.get(0).tagName.toLowerCase()).startsWith('h')) {
            $prev.before(view.$el);
          } else {
            $this.before(view.$el);
          }
          //
          return view.$el.offset().top;
        }
        return false;
      }
    });
  };
  //
  var mixinEdit = function(view){
    // 編集用にする
    mixinView(view);
    bulbwareLib.mixin(view, {
      save: function(callback){
        var _this = this;
        //
        var breakSave = _this.triggerMethod('save');
        if (breakSave) {
          _this.triggerMethod('break:save');
          return;
        }
        //
        var flagNew = _this.model.isNew();
        _this.listenToOnce(_this.model, 'sync', function(){
          _.defer(function(){
            if (flagNew && _this.model.collection) {
              _this.model.collection.add(_this.model);
            }
            //
            _this.triggerMethod('after:save', flagNew);
            //
            if (_.isFunction(callback)) {
              callback(flagNew);
            }
          });
        });
        _this.model.save(null, {
          view: _this
        });
      }
      ,deleteModel: function(callback){
        var _this = this;
        //
        var values = {
          breakDelete: false
          ,wait: false
        };
        var destroyModel = function(){
          if (values.breakDelete) {
            return;
          }
          _this.model.destroy({
            success: function(){
              _this.triggerMethod('after:delete');
              //
              if (_.isFunction(callback)) {
                callback();
              }
            }
          });
        };
        //
        _this.triggerMethod('delete', values);
        if (values.wait) {
          bulbwareLib.wait(function(){
            return !values.wait;
          }, function(){
            destroyModel();
          });
        } else {
          destroyModel();
        }
      }      
      ,copyView: function(){
        var _this = this;
        //
        _this.triggerMethod('copyView', _this.model);
      }
      ,events: {
        'click .jsbtn_save': 'clickSave'
        ,'click .jsbtn_delete': 'clickDelete'
        ,'click .jsbtn_copy': 'clickCopy'
      }
      ,clickSave: function(){
        this.save();
      }
      ,clickDelete: function(){
        this.deleteModel();
      }
      ,clickCopy: function(){
        this.copyView();
      }
    });
  };
  var mixinDetailEdit = function(view, delete_method){
    delete_method || (delete_method = 'removeCollection');
    // 明細編集用にする
    mixinView(view);
    bulbwareLib.mixin(view, {
      initialize: function(options) {
        options = options || {};
        this.listenTo(this, 'show', this.setFocus);
      }
      ,setFocus: function(){
        var $input = _.result(this.ui, 'first');
        if ($input) {
          $input.focus();
        }
      }
      ,events: {
        'click .jsbtn_delete_detail': 'deleteDetail'
      }
      ,deleteDetail: function(){
        var _this = this;
        if (_this.model.checkEdit && !_this.model.checkEdit()) return;
        //
        var values = {
          breakDelete: false
          ,wait: false
        };
        var destroyModel = function(){
          if (values.breakDelete) {
            return;
          }
          _this.model[delete_method]();
        };
        //
        _this.triggerMethod('delete', values);
        if (values.wait) {
          bulbwareLib.wait(function(){
            return !values.wait;
          }, function(){
            destroyModel();
          });
        } else {
          destroyModel();
        }
      }
    });
  };
  var mixinOnDeleteDetail = function(view, text){
    bulbwareLib.mixin(view, {
      onDelete: function(values){
        var _this = this;
        //
        values.wait = true;
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmDelete, function(){
          values.wait = false;
        }, function(){
          values.breakDelete = true;
          values.wait = false;
        });
      }
    });
  };
  //
  var mixinToggleEdit = function(view, delete_method, options){
    // 開閉型編集にする
    var options_scroll = _.extend({}, _(standardLib.toggleEditOptions).result('scrollOptions'), _(options).result('scrollOptions'));
    //
    mixinDetailEdit(view, delete_method);
    bulbwareLib.mixin(view, {
      optionsScroll: options_scroll
      ,initialize: function(options) {
        options = options || {};
        this.listenTo(this, 'toEdit', this.setFocus);
console.log(this.model, this.model.isNew());
        this.setIsEdit(options.is_edit || this.model.isNew() || false);
      }
      ,setIsEdit: function(value){
        var _this = this;
//console.log('setIsEdit', value);
        _this.is_edit = value;
        //
        var mode_section = this.model.get('mode_section') || '_edit';
        //
        if (_this.is_edit) {
          if (String(mode_section).indexOf('editing') < 0){
            if (String(mode_section).indexOf('edit') >= 0){
              mode_section = String(mode_section).replace('edit', 'editing');
            } else {
              mode_section += '_open';
            }
          }
          //
          this.$el.addClass('view_open');
          this.$el.removeClass('view_close');
          //
          if (_(this.getScrollOptions()).result('scrollWithEditing')) {
            this.scrollTop();
          }
        } else {
          mode_section = String(mode_section).replace('editing', 'edit').replace('_open', '');
          //
          this.$el.addClass('view_close');
          this.$el.removeClass('view_open');
        }
        //
        this.model.set({
          'mode_section': mode_section
        }, {silent: true}); // Marionette.ItemViewのtemplateを関数にした時にthisがviewを示していないため、attributesに含めておく
      }
      ,events: {
        'click .jsbtn_to_view': 'toView'
        ,'click .jsbtn_to_edit': 'toEdit'
        ,'click .jsbtn_save_to_view': '_saveToView'
      }
      ,toEdit: function(){
        this.setIsEdit(true);
        this.render();
      }
      ,toView: function(){
        this.setIsEdit(false);
        this.render();
      }
      ,onRender: function(){
        if (!this._isShown) return;
        this.triggerMethod((this.is_edit) ? 'toEdit': 'toView');
      }
      ,onShow: function(){
        this.triggerMethod((this.is_edit) ? 'toEdit': 'toView');
      }
      ,_saveToView: function(){
        if (!this.is_edit) return;
        if (this.model.validationError) return;
        if (!_(this).result('saveToView')) {
          this.toView();
        }
        this.triggerMethod('saveToView', this.model);
      }
    });
  };
  //
  var mixinOrderEdit = function(view){
    // 伝票編集用にする
    mixinEdit(view);
    bulbwareLib.mixin(view, {
      changeStatus: function(callback){
        var _this = this;
        //
        _this.listenToOnce(_this.model, 'sync', function(){ // fetchのoptions.successではadjustが実行されない。
          _.defer(function(){
            _this.triggerMethod('changeStatus');
            _.result(_this, 'adjust');
            if (_.isFunction(callback)) {
              callback();
            }
          });
        });
        _this.model.fetch();
      }
      ,closeAndCreate: function(){
        var _this = this;
        //
        _this.closeOrder(function(){
          if (!_this.model.statusUpdateError) {
            _this.triggerMethod('createNewObject', null, _.result(_this, 'getCreateDefaults'));
          }
        });
      }
      ,closeOrder: function(callback){
        var _this = this;
        //
        if (_this.model.checkEdit()) {
          _this.model.changeStatus = true; // save後にステータス変更があることを示すフラグ。
          _this.save(function(isNew){
            if (!_this.model.statusUpdateError) {
              _this.model.closeOrder(function(msgs) {
                if (!_this.model.statusUpdateError) {
                  _this.changeStatus(function(){
                    if (_.isFunction(callback)) {
                      callback(isNew);
                    }
                    _this.model.changeStatus = false;
                  });
                } else {
                  if (_.isFunction(callback)) {
                    callback(isNew);
                  }
                  _this.model.changeStatus = false;
                }
              }, {
                view: _this
              });
            } else {
              _this.model.changeStatus = false;              
            }
          });
        } else {
          if (_.isFunction(callback)) {
            callback();
          }
        }
      }
      ,planOrder: function(){
        var _this = this;
        //
        var func = function(){
          if (!_this.model.statusUpdateError) {
            _this.model.planOrder(function(msgs) {
              if (msgs.messages.length == 0) {
                _this.changeStatus();
              }
            }, {
              view: _this
            });
          }
        };
        //
        if (_this.model.checkInput()){
          _this.save(func);
        } else if (_this.model.checkClose()) {
          func();
        }
      }
      ,cancelCloseOrder: function(){
        var _this = this;
        if (!_this.model.checkClose() && !_this.model.checkPlan()) return;
        //
        _this.model.cancelCloseOrder(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.changeStatus();
          }
        }, {
          view: _this
        });
      }
      ,confirmOrder: function(date){
        var _this = this;
        if (!_this.model.checkClose()) return;
        //
        _this.save(function(){
          if (!_this.model.statusUpdateError) {
            _this.model.confirmOrder(function(msgs) {
              if (msgs.messages.length == 0) {
                _this.changeStatus();
              }
            }, {
              view: _this
              ,'Date': date
            });
          }
        });
      }
      ,cancelConfirmOrder: function(){
        var _this = this;
        if (!_this.model.checkConfirm()) return;
        //
        _this.model.cancelConfirmOrder(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.changeStatus();
          }
        }, {
          view: _this
        });
      }
      ,finishedOrder: function(date){
        var _this = this;
        if (!_(_this.model).result('checkClose') && !_(_this.model).result('checkPlan') && !_(_this.model).result('checkConfirm')) return;
        //
        _this.model.finishedOrder(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.triggerMethod('finishedOrder');
            _this.changeStatus();
          }
        }, {
          view: _this
          ,'Date': date
        });
      }
      ,cancelFinishedOrder: function(){
        var _this = this;
        if (!_this.model.checkFinished()) return;
        //
        _this.model.cancelFinishedOrder(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.changeStatus();
          }
        }, {
          view: _this
        });
      }
      ,events: {
        'click .jsbtn_close_order': 'clickCloseOrder'
        ,'click .jsbtn_cancel_close_order': 'clickCancelCloseOrder'
        ,'click .jsbtn_plan_order': 'clickPlanOrder'
        ,'click .jsbtn_confirm_order': 'clickConfirmOrder'
        ,'click .jsbtn_cancel_confirm_order': 'clickCancelConfirmOrder'
        ,'click .jsbtn_finished_order': 'clickFinishedOrder'
        ,'click .jsbtn_cancel_finished_order': 'clickCancelFinishedOrder'
        ,'click .jsbtn_close_and_create': 'closeAndCreate'
      }
      ,clickCloseOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmClose, function(){
          _this.closeOrder();
        });
      }
      ,clickPlanOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmPlan, function(){
          _this.planOrder();
        });
      }
      ,clickCancelCloseOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmCancelClose, function(){
          _this.cancelCloseOrder();
        });
      }
      ,clickConfirmOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmConfirm, function(){
          _this.confirmOrder();
        });
      }
      ,clickCancelConfirmOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmCancelConfirm, function(){
          _this.cancelConfirmOrder();
        });
      }
      ,clickFinishedOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmFinished, function(){
          _this.finishedOrder(_(_this).result('getFinishedOrderDate'));
        });
      }
      ,clickCancelFinishedOrder: function(){
        var _this = this;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmCancelFinished, function(){
          _this.cancelFinishedOrder();
        });
      }
    });
  };
  //
  var mixinProjectDetailEdit = function(view){
    // プロジェクト明細用
    bulbwareLib.mixin(view, {
      changeStatus: function(){
        var _this = this;
        //
        _this.listenToOnce(_this.model, 'sync', function(){ // fetchのoptions.successではadjustが実行されない。
          _.defer(function(){
            _this.render();
          });
        });
        _this.model.fetch();
      }
      ,events: {
        'click .jsbtn_finished_detail': 'clickFinishedDetail'
        ,'click .jsbtn_cancel_finished_detail': 'clickCancelFinishedDetail'
      }
      ,clickFinishedDetail: function(){
        var _this = this;
        //
        this.model.finishedDetail(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.changeStatus();
          }
        });
      }
      ,clickCancelFinishedDetail: function(){
        var _this = this;
        //
        this.model.cancelFinishedDetail(function(msgs) {
          if (msgs.messages.length == 0) {
            _this.changeStatus();
          }
        });
      }
    });
  };
  //
  var mixinConditions = function(view){
    // 検索条件用にする
    mixinView(view);
    bulbwareLib.mixin(view, {
      initialize: function(options) {
        var _this = this;
        options || (options = {});
        //
        _this.autoSelect = _this.initAutoSelect = options.autoSelect || _this.autoSelect;
      }
      ,search: function(){
        var _this = this;
        //
        var conditions = _(_this.getConditions()).chain()
            .reduce(function(ret, value, name){ // 値のない条件を除去する
              if (value) {
                ret[name] = value;
              }
              return ret;
            }, {})
            .extend(_this.optionalConditions)
            .value();
        var break_search = _this.triggerMethod('search', conditions);
        if (break_search) {
          _this.triggerMethod('after:search');
          return false;
        }
        //
        _this.collection.search(conditions, _.extend({
          success: function(){
            _this.triggerMethod('after:search');
          }
        }, _this.search_options));
        //
        return true;
      }
      ,onShow: function(){
        var _this = this;
        //
        if (_this.autoSelect) {
          this.search();
          _this.autoSelect = false;
        }
      }
      ,events: {
        'click .jsbtn_search': 'clickSearch'
      }
      ,clickSearch: function(){
        this.search();
      }
    });
  };
  //
  var mixinLoading = function(view) {
    // 検索時にローディングアイコンを表示する
    bulbwareLib.mixin(view, {
      collectionEvents: {
        'sync': 'removeLoading'
        ,'reset': 'removeLoading'
        ,'search': 'addLoading'
      }
      ,addLoading: function(){
        var _this = this;
        //
        if (_this.$childViewContainer) {
          _this.$childViewContainer.html(bulbwareObj.templateParams.Text.loadingBlock);
        }
      }
      ,removeLoading: function(){
        var _this = this;
        //
        _this.$('.js_loading').remove();
      }
    });
  };
  //
  var mixinExtractView = function(viewList, viewItem, viewEmpty) {
    // 一覧検索用にする
    mixinLoading(viewList);
    bulbwareLib.mixin(viewList, {
      emptyView: viewEmpty
      ,extract: function(search_text){
        var _this = this;
        // 指定したテキストでobjViewの抽出をする
        var search_values = search_text;
        if (_.isString(search_text)) {
          search_values = bulbwareLib.toString(search_text).split(' ');
        }
//console.log(search_values);
        var values = _(search_values).chain()
            .map(function(value){
              return _s(bulbwareLib.toString(value)).words();
            })
            .flatten()
            .compact()
            .value();
        _this.extractResults = {
          values: values
          ,count: 0
          ,show: 0
          ,hide: 0
        };
        _this.triggerMethod('extractView', values, _this.extractResults);
console.log(_this.extractResults);
      }
      ,onAddChild: function(view){
        var _this = this;
        //
        view.listenTo(_this, 'extractView', view.extract);
      }
    });
    bulbwareLib.mixin(viewItem, {
      onRender: function(){
        this.replaceBodyText();
      }
      ,replaceBodyText: function(){
        var _this = this;
        //
        _this.body_text = bulbwareLib.toString(_(_this.$el.html()).stripTags());
      }
      ,extract: function(values, results) {
        // values（配列）に一致する文字列があれば表示する
        var _this = this;
        //
        var mode = true;
        if (values.length > 0) {
          mode = _(values).reduce(function(ret, value){
            if (!ret) {
              ret = (_this.body_text.indexOf(value) >= 0);
            }
            return ret;
          }, false);
        }
        results.count++;
        if (mode) {
          _this.$el.show();
          results.show++;
        } else {
          _this.$el.hide();
          results.hide++;
        }
      }
    });
  };
  //
  var mixinListView = function(viewList, viewItem, viewEmpty) {
    // 一覧検索用にする
    mixinLoading(viewList);
    mixinExtractView(viewList, viewItem);
    bulbwareLib.mixin(viewList, {
      emptyView: viewEmpty
      ,addNewView: function(id, tab){
        var _this = this;
        //
        if (id || !_this.disabledAddNewView) {
          _this.collection.getModel(id, {
            modeAddCollection: true
            ,callback: function(model){
              _this.selectItem(model, false, tab);
            }
          });
        } else {
          _this.triggerMethod('addNewView');
        }
      }
      ,copyNewView: function(model){
        var _this = this;
        //
        var new_model = model.copyModel();
        _this.collection.add(new_model);
        _this.selectItem(new_model, true);
      }
      ,getView: function(model){
        var _this = this;
        //
        var view;
        if (_this.viewEdit) {
          view = new _this.viewEdit({
            model: model
          });
        }
        //
        return view;
      }
      ,orderTypeItem: 'OrderType'
      ,selectItem: function(model, flag_copy, tab){
        var _this = this;
        // this.orderTypesが指定されていて、modelのタイプと違う場合、選択できないようにする
        // modelのタイプは、this.orderTypeItem で項目名を指定する
        if (_this.orderTypes) {
          var order_types = (_.isArray(_this.orderTypes)) ? _this.orderTypes : [_this.orderTypes];
          if (!_(order_types).contains(Number(model.get(_this.orderTypeItem)))) {
            model.removeCollection();
            return;
          }
        }
        //
        var view = _this.getView(model);
        this.triggerMethod('selectItem', model, view, flag_copy, tab);
        model.trigger('active');
      }
      ,childEvents: {
        'selectItem': 'onChildSelectItem'
      }
      ,onChildSelectItem: function(childView, values){
        this.selectItem(values.model);
      }
    });
    bulbwareLib.mixin(viewItem, {
      modelEvents: {
        'active': 'active'
        ,'inactive': 'inactive'
      }
      ,triggers: {
        'click': 'selectItem'
      }
      ,active: function() {
        this.$el.addClass('jsc_item_active');
      }
      ,inactive: function() {
        this.$el.removeClass('jsc_item_active');
      }
    });
  };
  //
  var mixinDetails = function(view) {
    // 明細一覧用にする
    mixinView(view);
    mixinLoading(view);
    bulbwareLib.mixin(view, {
      is_edit: true
      ,ui: {
        'edit_mode': '.js_edit_mode'
      }
      ,onRender: function(){
        var _this = this;
        //
        var method = (_this.is_edit) ? 'show' : 'hide';
        _this.ui.edit_mode[method]();
      }
      ,onAddChild: function(view){
        if (view.save) {
          view.listenTo(this, 'save', view.save);
        }
      }
      ,addDetail: function(callback){
        var _this = this;
        if (!_this.is_edit) return;
        //
        var model_defaults = _.result(_this, 'getModelDefaults');
        if (model_defaults === false) return;
        //
        var model = _this.collection.getModel(null, {
          modeAddCollection: true
          ,model_defaults: model_defaults
          ,callback: callback
        });
        //
        return model;
      }
      ,save: function(){
        var ret1 = this.triggerMethod('save'); // 明細のsaveを呼び出す。
        var ret2 = this.triggerMethod('after:save');
        return ret2 || ret1;
      }
      ,collectionEvents: {
        'add': 'adjust'
      }
      ,events: {
        'click .jsbtn_add_detail': 'clickAddDetail'
      }
      ,clickAddDetail: function(){
        this.addDetail();
      }
    });
  };
  // ダウンロード機能
  // FileAPI(FileSave.js)を使って、ファイルにダウンロードする
  // Excelで読み込めるようにするため、BOMあり、UTF-16、TAB区切り、ファイルの拡張子をcsvにする。
  // http://qiita.com/bump_of_kiharu/items/f41beec668e1f3ea675e
  var mixinDownload = function(viewList, filename, type){
    bulbwareLib.mixin(viewList, {
      filenameOfDownload: filename || 'data.csv'
      ,typeOfDownload: type || 'text/csv;charset=utf-16;'
      ,onAddChild: function(view){
        var _this = this;
        //
        view.listenTo(_this, 'download', view.download);
      }
      ,events: {
        'click .jsbtn_download': 'download'
      }
      ,download: function(){
        var _this = this;
        //
        var data = [];
        var items = _.result(_this, 'itemsOfDownload');
        var attributes = _.result(_this, 'attributesOfDownload');
        // タイトル1行目
        (function(data, items, attributes){
          var convert = function(value){
            return String(_(language).result(value) || value).replace(/[\t\r\n]/g, ' ');
          };
          var language = _this.template_options.additionalTemplateParams.ObjectText;
          var row = _(items).map(convert);
          row = row.concat(_(attributes).map(convert));
          row.push('id');
          data.push(row.join('\t'));
        })(data, items, attributes);
        // タイトル2行目
        (function(data, items, attributes){
          var row = items.concat(_(attributes).map(function(attribute, index){
            return 'Attributes'+index+'.'+attribute;
          }));
          row.push('id');
          data.push(row.join('\t'));
        })(data, items, attributes);
        //
        _this.triggerMethod('download', data, items, attributes);
        data = data.join('\r\n');
/*        // UTF-8
        var blob = (function(data){
          var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
          return new Blob([bom, data], {type: _this.typeOfDownload});
        })(data);
*/
        // UTF-16
        var blob = (function(data){
          var data_code = _(data).map(function(s){
            return s.charCodeAt();
          });
          var data_u16 = new Uint16Array(data_code);
          var bom = new Uint8Array([0xFF, 0xFE]);
          return new Blob([bom, data_u16], {type: _this.typeOfDownload});
        })(data);
        //
        saveAs(blob, _this.filenameOfDownload);
      }
    });
    bulbwareLib.mixin(viewList.prototype.childView, {
      download: function(data, items, attributes){
        var _this = this;
        if (_this.$el.is(':hidden')) return;
        //
        var convert = function(value){
          return '"' + String(value).replace(/\t/g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/"/g, '""') + '"';
        };
        //
        var values = _(items).map(function(item){
          return convert(_this.model.get(item));
        });
        values = values.concat(_(attributes).map(function(attribute){
          return convert(_this.model.get(attribute).AttributeCode);
        }));
        values.push(_this.model.id || '');
        data.push(values.join('\t'));
      }
    });
  };
  // トグル開閉機能を付いける
  var mixinToggleButton = function(view){
    bulbwareLib.mixin(view, {
      events: {
        'click .jsbtn_toggle_block': 'clickToggleBlock'
      }
      ,clickToggleBlock: function(e){
        $(e.currentTarget).next().slideToggle();
      }
    });
  };
  // timeline機能をつける
  var mixinTimeline = function(viewList){
    var viewItem = viewList.prototype.childView;
    bulbwareLib.mixin(viewList, {
      ui: {
        'view_period': '.jsinput_view_period'
        ,'view_start_date': '.jsdate_view_start'
      }
      ,onRender: function(){
        var _this = this;
        //
        _this.canvas_width = _this.$('canvas').attr('width');
        _this.canvas_height = _this.$('canvas').attr('height');
        _this.view_days = _this.getViewPeriod();
        _this.view_start_date = _this.getViewStartDate();
        _this.drawTimelineHeader();
        // マウス操作
        var $canvas = _this.$('canvas');
        $canvas.mousedown(function(e) {
          var mx = e.pageX;
          var my = e.pageY;
          var start_date = _this.view_start_date;
          var width_1day = _this.canvas_width / _this.view_days;
          _this.triggerMethod('MouseDown');
          $(document).on('mousemove.timelineCanvas', function(e) {
            var move_day = (e.pageX - mx) / width_1day;
            if (Math.abs(move_day) > 1) {
              var new_start_date = moment(start_date).add(move_day, 'days');
              if (new_start_date.isValid()) {
                _this.moveTimeline(new_start_date.format('YYYY-MM-DD'), _this.view_days);
              }
            }
            return false;
          }).one('mouseup.timelineCanvas', function() {
            $(document).off('mousemove.timelineCanvas');
            // click
            if ((mx == e.pageX) && (my == e.pageY)) {
              var move_day = _this.view_days / 3;
              var px = mx - $canvas.offset().left;
              if (px < _this.canvas_width / 10) {
                move_day *= -1;
              } else if (px < _this.canvas_width * 9 / 10) {
                move_day = 0;
              }
              if (move_day) {
                var new_start_date = moment(start_date).add(move_day, 'days');
                if (new_start_date.isValid()) {
                  _this.moveTimeline(new_start_date.format('YYYY-MM-DD'), _this.view_days);
                }
              }
            }
            //
            _this.triggerMethod('MouseUp');
            return false;
          });
          return false;
        });
      }
      ,drawTimelineHeader: function(){
        // アクション描画
        var _this = this;
        //
        var $canvas = _this.$('canvas');
        var canvas = $canvas.get(0);
        if (!canvas.getContext) return;
        var w = _this.canvas_width;
        var h = _this.canvas_height;
        var x0 = 0;
        var y0 = 25;
        var scale_size = 5;
        var text_height = 20;
        var width_1day = w / _this.view_days;
        var getDayX = function(day){ // 日数からX座標を計算する
          return day * width_1day;
        };
        var getDateX = function(event_date){ // 日付からX座標を計算する
          var days = moment(_this.view_start_date).diff(event_date, 'days');
          return getDayX(days);
        };
        //
        var context = canvas.getContext('2d');
        context.strokeStyle = 'black';
        context.fillStyle = 'black';
        context.font = '10pt sans-serif';
        // タイムライン
        context.beginPath();
        context.clearRect(0, 0, w, h);
        context.moveTo(x0, y0);
        context.lineTo(w, y0);
        context.closePath();
        _(_this.view_days).times(function(day){
          var x = getDayX(day);
          //
          var d = moment(_this.view_start_date).subtract(day, 'days');
          if (d.weekday() == 1) {
            context.moveTo(x, y0 - scale_size);
            context.lineTo(x, h);
            //
            var t = d.format('M/D');
            var tm = context.measureText(t);
            context.fillText(t, x - tm.width / 2, y0 - scale_size * 1.5);   	  
          } else {
            context.moveTo(x, y0 - scale_size);
            context.lineTo(x, y0 + scale_size);
          }
          //
          context.closePath();
        });
        context.stroke();   
        // 表示期間移動用アイコン
        var bm = 5;
        var bw = (_this.canvas_width / 10) - bm;
        // 左
        context.moveTo(bm, y0);
        context.lineTo(bw, y0 - bw / 2);
        context.lineTo(bw, y0 + bw / 2);
        context.closePath();
        // 右
        context.moveTo(_this.canvas_width - bm, y0);
        context.lineTo(_this.canvas_width - bw, y0 - bw / 2);
        context.lineTo(_this.canvas_width - bw, y0 + bw / 2);
        context.closePath();
        //
        context.fillStyle = 'rgba(100, 100, 100, 0.5)';
        context.fill();   
      }
      ,childViewOptions: function(){
        var _this = this;
        //
        return {
          view_period: _this.getViewPeriod()
          ,view_start_date: _this.getViewStartDate()
        };
      }
      ,onAddChild: function(view){
        var _this = this;
        //
        view.listenTo(_this, 'changeTimeline', view.changeTimeline);
        view.listenTo(_this, 'getSelected', view.getSelected);
        view.listenTo(_this, 'showDetails', view.showDetails);
      }
      ,showDetails: function(mode){
        var _this = this;
        //
        _this.triggerMethod('showDetails', mode);
      }
      ,triggers: {
        'change @ui.view_period': 'changeTimeline'
        ,'change @ui.view_start_date': 'changeTimeline'
      }
      ,onChangeTimeline: function(){
        var _this = this;
        //
        _this.view_days = _this.getViewPeriod();
        _this.view_start_date = _this.getViewStartDate();
        _this.drawTimelineHeader();
      }
      ,getViewPeriod: function(){
        var _this = this;
        //
        return _this.ui.view_period.val();
      }
      ,getViewStartDate: function(){
        return this.ui.view_start_date.val();
      }
      ,getSelected: function(){
        var _this = this;
        //
        var models = [];
        _this.triggerMethod('getSelected', models);
        return models;
      }
      ,moveTimeline: function(start_date, period){
        var _this = this;
        //
        _this.ui.view_period.val(period);
        _this.ui.view_start_date.val(start_date).change();
      }
      ,childEvents: {
        'moveTimeline': 'childMoveTimeline'
      }
      ,childMoveTimeline: function(view, start_date, period){
        this.moveTimeline(start_date, period);
      }
    });
    bulbwareLib.mixin(viewItem, {
      initialize: function(options) {
        var _this = this;
        //
        _this.view_days = options.view_period || 7;
        _this.view_start_date = options.view_start_date || moment();
      }
      ,ui: {
        'select': '.jscheck_select'
      }
      ,onRender: function(){
        var _this = this;
        //
        _this.canvas_width = _this.$('canvas').attr('width');
        _this.canvas_height = _this.$('canvas').attr('height');
        _this.drawTimeline();
      }
      ,drawTimeline: function(){
        // アクション描画
        var _this = this;
        //
        var $canvas = _this.$('canvas');
        var canvas = $canvas.get(0);
        if (!canvas.getContext) return;
        var w = _this.canvas_width;
        var h = _this.canvas_height;
        var x0 = 0;
        var y0 = 25;
        var scale_size = 5;
        var text_height = 20;
        var width_1day = w / _this.view_days;
        var getDayX = function(day){ // 日数からX座標を計算する
          return day * width_1day;
        };
        var getDateX = function(event_date){ // 日付からX座標を計算する
          var days = moment(_this.view_start_date).diff(event_date, 'days');
          return getDayX(days);
        };
        //
        var context = canvas.getContext('2d');
        context.strokeStyle = 'black';
        context.fillStyle = 'black';
        context.font = '10pt sans-serif';
        // タイムライン
        context.beginPath();
        context.clearRect(0, 0, w, h);
        context.moveTo(x0, y0);
        context.lineTo(w, y0);
        context.closePath();
        _(_this.view_days).times(function(day){
          var x = getDayX(day);
          //
          var d = moment(_this.view_start_date).subtract(day, 'days');
          if (d.weekday() == 1) {
            context.moveTo(x, 0);
            context.lineTo(x, h);
          } else {
            context.moveTo(x, y0 - scale_size);
            context.lineTo(x, y0 + scale_size);
          }
          //
          context.closePath();
        });
        context.stroke();   
        // アクション
        context.beginPath();     
        var marker_size = Math.min(getDayX(1) / 2, 8);
        _(_this.getEvents()).each(function(event){      
          var start_date = event.start_date;
          var end_date = event.end_date;
          if (moment(start_date).isAfter(end_date)) {
            var t = bulbwareLib.swap(start_date, end_date);
            start_date = t[0];
            end_date = t[1];
          }
          // 描画条件設定
          context.strokeStyle = event.strokeStyle || 'black';
          context.fillStyle = event.fillStyle || 'black';
          context.font = event.font || '10pt sans-serif';
          // マークを表示する
          var event_start_x = getDateX(end_date);
          _(moment(end_date).diff(start_date, 'days') + 1).times(function(days){
            var x = event_start_x + getDayX(days);
            switch (event.mark) {
            case 'circle':
              context.arc(x, y0, marker_size, 0, Math.PI*2, true);
              context.fill();
              break;
            }
          });
          // title表示
          context.fillText(event.title, event_start_x, y0 - marker_size - 5);
        });
        context.stroke();        
      }
      ,changeTimeline: function(values){
        var _this = this;
        //
        _this.view_days = values.view.getViewPeriod();
        _this.view_start_date = values.view.getViewStartDate();
        _this.drawTimeline();
      }
      ,getSelected: function(models){
        var _this = this;
        //
        if (_this.ui.select.checked()) {
          models.push(_this.model);
        }
      }
      ,showDetails: function(mode){
        var _this = this;
        //
        var method = (_this.getShowMode(mode)) ? 'show' : 'hide';
        _this.$el[method]();
      }
    });
  };
  //
  var createViewList = function(View, viewBody){
    return function(){
      var conditions;
      if (View.conditions) {
        conditions = new View.conditions();
      }
      //
      var list;
      if (View.list) {
        list = new View.list();
        list.viewEdit = viewBody;
      }
      //
      return {
        conditions: conditions
        ,list: list
      };
    };
  };
  //
  return {
    mixin: {
      template: mixinTemplate // テンプレート展開を追加する function(view, templates, section, options)
      ,view: mixinView
      ,edit: mixinEdit // 編集用にする function(view)
      ,detailEdit: mixinDetailEdit // 明細編集用にする function(view)
      ,onDeleteDetail: mixinOnDeleteDetail // 明細削除時の確認ダイアログの表示をする
      ,toggleEdit: mixinToggleEdit // 開閉型編集にする function(view)
      ,orderEdit: mixinOrderEdit // 伝票編集用にする function(view)
      ,details: mixinDetails // 明細一覧用にする function(view)
      ,conditions: mixinConditions // 検索条件用にする function(view){
      ,list: mixinListView // 一覧検索用にする function(viewList, viewItem)
      ,extractView: mixinListView // 一覧検索用にする function(viewList, viewItem)
      ,extract: mixinExtractView // 一覧抽出機能をつける function(viewList, viewItem)
      ,projectDetailEdit: mixinProjectDetailEdit // プロジェクト明細用
      ,download: mixinDownload
      ,toggleButton: mixinToggleButton
      ,timeline: mixinTimeline
    }
    ,createViewList: createViewList
    ,bindTemplate: bindTemplate
  };
});
