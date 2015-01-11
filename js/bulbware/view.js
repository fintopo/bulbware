define([
  'bulbware/lib'
  ,'bulbware/obj'
  ,'standard/lib'
  ,'text!standard/template/panel.html'
  //
  ,'bower_components/applyStyles/jquery.apply_styles'
], function(bulbwareLib, bulbwareObj, standardLib, panel_templates){
  panel_templates = SNBinder.get_named_sections_text(panel_templates);
  //
  var bindTemplate = function(template, attributes){
    return SNBinder.bind(template, _.extend({
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
        return bindTemplate(template, _.extend({}, attributes, options.additionalTemplateParams));
      } catch (e) {
        console.log(e, section, mode_section, templates, attributes);
      }
    };
    //
    var property = {
      tagName: _.trim(templates[section+'_tagName']) || 'div'
      ,className: _.trim(templates[section+'_className']) || ''
      ,templates: templates
      ,template_section: section
      ,template: function(attributes){
        return createHTML(section, attributes);
      }
      ,createHTML: createHTML
    };
    //
    if (view.prototype.childView) {
      _(property).extend({
        childViewContainer: _.trim(templates[section+'_container']) || ''
      });
    }
    //
    bulbwareLib.mixin(view, property);
  };
  //
  var mixinView = function(view){
    // Viewの共通機能
    bulbwareLib.mixin(view, {
      onShow: function(){
        _.result(this, 'adjust');
      }
      ,onRender: function(){
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
        //
        if (this._isShown){
          _.result(this, 'adjust');
        }
      }
      ,scrollTop: function(mode, options){
        var _this = this;
        //
        options = _.extend({
          offset: 0
        }, options);
        //
        if (mode) {
          var top = _this.$el.offset().top;
          top -= options.offset;
          $('html,body').animate({ scrollTop: top }, 'slow');
        } else {
          _this.$el.get(0).scrollIntoView(true);
        }
      }
    });
  };
  //
  var mixinEdit = function(view){
    // 編集用にする
    bulbwareLib.mixin(view, {
      save: function(callback){
        var _this = this;
        //
        _this.triggerMethod('save');
        //
        var flagNew = _this.model.isNew();
        _this.listenToOnce(_this.model, 'sync', function(){
          _.defer(function(){
            if (flagNew && _this.model.collection && !_this.model.flagAdd) {
              _this.model.collection.add(_this.model);
            }
            //
            _this.triggerMethod('after:save', flagNew);
            //
            if (_.isFunction(callback)) {
              callback();
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
          commonLib.wait(function(){
            return !values.wait;
          }, function(){
            destroyModel();
          });
        } else {
          destroyModel();
        }
      }      
      ,events: {
        'click .jsbtn_save': 'clickSave'
        ,'click .jsbtn_delete': 'clickDelete'
      }
      ,clickSave: function(){
        this.save();
      }
      ,clickDelete: function(){
        this.deleteModel();
      }
    });
  };
  var mixinDetailEdit = function(view){
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
        if (!_.result(this.model, 'checkEdit')) return;
        //
        var values = {
          breakDelete: false
          ,wait: false
        };
        var destroyModel = function(){
          if (values.breakDelete) {
            return;
          }
          _this.model.removeCollection();
        };
        //
        _this.triggerMethod('delete', values);
        if (values.wait) {
          commonLib.wait(function(){
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
  //
  var mixinToggleEdit = function(view){
    // 開閉型編集にする
    mixinDetailEdit(view);
    bulbwareLib.mixin(view, {
      initialize: function(options) {
        options = options || {};
        this.listenTo(this, 'toEdit', this.setFocus);
        this.setIsEdit(options.is_edit || this.model.isNew() || false);
      }
      ,setIsEdit: function(value){
        this.is_edit = value;
        //
        var mode_section = this.model.get('mode_section') || '_edit';
        //
        if (value) {
          mode_section = String(mode_section).replace('edit', 'editing');
          //
          this.$el.addClass('view_open');
          this.$el.removeClass('view_close');
        } else {
          mode_section = String(mode_section).replace('editing', 'edit');
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
        ,'click .jsbtn_save_to_view': 'saveToView'
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
      ,saveToView: function(){
        if (!this.is_edit) return;
        if (this.model.validationError) return;
        this.toView();
      }
    });
  };
  //
  var mixinOrderEdit = function(view){
    // 伝票編集用にする
    mixinEdit(view);
    bulbwareLib.mixin(view, {
      changeStatus: function(){
        var _this = this;
        //
        _this.listenToOnce(_this.model, 'sync', function(){ // fetchのoptions.successではadjustが実行されない。
          _.defer(function(){
            _this.triggerMethod('changeStatus');
            _.result(this, 'adjust');
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
          _this.save(function(){
            if (!_this.model.statusUpdateError) {
              _this.model.closeOrder(function(msgs) {
                if (!_this.model.statusUpdateError) {
                  _this.changeStatus();
                }
                if (_.isFunction(callback)) {
                  callback();
                }
              }, {
                view: _this
              });
            }
          });
        } else {
          if (_.isFunction(callback)) {
            callback();
          }
        }
      }
      ,events: {
        'click .jsbtn_close_order': 'clickCloseOrder'
        ,'click .jsbtn_cancel_close_order': 'clickCancelCloseOrder'
        ,'click .jsbtn_plan_order': 'clickPlanOrder'
        ,'click .jsbtn_finished_order': 'clickFinishedOrder'
        ,'click .jsbtn_cancel_finished_order': 'clickCancelFinishedOrder'
        ,'click .jsbtn_close_and_create': 'closeAndCreate'
      }
      ,clickCloseOrder: function(){
        var _this = this;
        if (!_this.model.checkEdit()) return;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmClose, function(){
          _this.closeOrder();
        });
      }
      ,clickPlanOrder: function(){
        var _this = this;
        if (!_this.model.checkInput() && !_this.model.checkClose()) return;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmPlan, function(){
          _this.save(function(){
            if (!_this.model.statusUpdateError) {
              _this.model.planOrder(function(msgs) {
                if (msgs.messages.length == 0) {
                  _this.changeStatus();
                }
              }, {
                view: _this
              });
            }
          });
        });
      }
      ,clickCancelCloseOrder: function(){
        var _this = this;
        if (!_this.model.checkClose() && !_this.model.checkPlan()) return;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmCancelClose, function(){
          _this.model.cancelCloseOrder(function(msgs) {
            if (msgs.messages.length == 0) {
              _this.changeStatus();
            }
          }, {
            view: _this
          });
        });
      }
      ,clickFinishedOrder: function(){
        var _this = this;
        if (!_this.model.checkClose()) return;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmFinished, function(){
          _this.model.finishedOrder(function(msgs) {
            if (msgs.messages.length == 0) {
              _this.changeStatus();
            }
          }, _this);
        });
      }
      ,clickCancelFinishedOrder: function(){
        var _this = this;
        if (!_this.model.checkFinished()) return;
        //
        standardLib.confirm(bulbwareObj.templateParams.Text.ConfirmCancelFinished, function(){
          _this.model.cancelFinishedOrder(function(msgs) {
            if (msgs.messages.length == 0) {
              _this.changeStatus();
            }
          }, {
            view: _this
          });
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
        _this.autoSelect = options.autoSelect || _this.autoSelect;
      }
      ,search: function(){
        var _this = this;
        //
        var conditions = _.extend(_this.getConditions(), _this.optionalConditions);
        //
        _this.triggerMethod('search', conditions);
        //
        _this.collection.search(conditions, _.extend({
          success: function(){
            _this.triggerMethod('after:search');
          }
        }, _this.search_options));
      }
      ,onShow: function(){
        var _this = this;
        //
        if (_this.autoSelect) {
          this.search();
          _this.autoSelect = false;
        }
      }
      ,onDestroy: function(){
        this.collection.reset();
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
        // 指定したテキストでobjViewの抽出をする
        var search_values = search_text;
        if (_.isString(search_text)) {
          search_values = bulbwareLib.toString(search_text).split(' ');
        }
//console.log(search_values);
        var values = _(search_values).chain()
            .map(function(value){
              return _(bulbwareLib.toString(value)).words();
            })
            .flatten()
            .compact()
            .value();
        this.triggerMethod('extractView', values);
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
      ,extract: function(values) {
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
        if (mode) {
          _this.$el.show();
        } else {
          _this.$el.hide();
        }
      }
    });
  };
  //
  var mixinListView = function(viewList) {
    // 一覧検索用にする
    var viewItem = viewList.prototype.childView;
    mixinLoading(viewList);
    mixinExtractView(viewList, viewItem);
    bulbwareLib.mixin(viewList, {
      addNewView: function(id, attributes){
        var _this = this;
        //
        if (id || !_this.disabledAddNewView) {
          return _this.collection.getModel(id, {
            modeAddCollection: true
            ,model_defaults: attributes
            ,callback: function(model){
              _this.selectItem(model);
            }
          });
        } else {
          _this.triggerMethod('addNewView');
        }
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
      ,selectItem: function(model){
        this.triggerMethod('selectItem', model);
      }
      ,childEvents: {
        'selectItem': 'onChildSelectItem'
      }
      ,onChildSelectItem: function(childView, values){
        this.selectItem(values.model);
      }
    });
    bulbwareLib.mixin(viewItem, {
      triggers: {
        'click': 'selectItem'
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
      ,addDetail: function(){
        var _this = this;
        if (!_this.is_edit) return;
        //
        var model_defaults = _.result(_this, 'getModelDefaults');
        if (model_defaults === false) return;
        //
        var model = _this.collection.getModel(null, {
          modeAddCollection: true
          ,model_defaults: model_defaults
        });
        //
        return model;
      }
      ,save: function(){
        this.triggerMethod('save');
      }
      ,events: {
        'click .jsbtn_add_detail': 'clickAddDetail'
      }
      ,clickAddDetail: function(){
        this.addDetail();
        this.triggerMethod('adjust');
      }
    });
  };
  //
  var mixinPopupSelectMaster = function(viewPopup, viewEdit, viewList, viewItem){
    mixinListView(viewList, viewItem);
    //
    mixinEdit(viewEdit);
    bulbwareLib.mixin(viewEdit, {
      onAfterSave: function(){
        var _this = this;
        //
        _this.triggerMethod('appendItem', _this.model);
        _this.model.clear();
      }
      ,events: {
        'keyup input': 'changeInput'
      }
      ,changeInput: function(){
        var _this = this;
        //
        var search_text = _this.$('input').map(function(){
          return $(this).val();
        }).get();
        _this.triggerMethod('changeInput', search_text);
      }
    });
    //
    bulbwareLib.mixin(viewPopup, {
      viewEdit: viewEdit
      ,viewList: viewList
      ,initialize: function(options) {
        var _this = this;
        //
        _this.sm = options.sm;
        //
        _this.view_edit = new _this.viewEdit({});
        _this.listenTo(_this.view_edit, 'appendItem', _this.appendItem);
        _this.listenTo(_this.view_edit, 'changeInput', _this.changeInput);
        //
        _this.view_list = new _this.viewList({});
        _this.listenTo(this.view_list, 'selectItem', this.selectItem);
      }
      ,regions: {
        'edit': '.js_edit'
        ,'list': '.js_list'
      }
      ,onRender: function(){
        var _this = this;
        //
        _this.edit.show(_this.view_edit);
        _this.list.show(_this.view_list);
        //
        _this.dialog = _this.$('.js_popup').dialog(_.extend({
          width: 740,
          minHeight: 500,
          autoOpen: false,
          modal: true
        }, _this.options_dialog));
      }
      ,setData: function(values){
        this.view_list.collection.reset(values);
      }
      ,selectItem: function(model){
        var _this = this;
        //
        var ms = _this.sm.magicSuggest;
        ms.clear(true);
        ms.addToSelection(model.attributes);
        _this.dialog.dialog('close');
      }
      ,appendItem: function(model){
        var _this = this;
        //
        _this.sm.setValue({});
        _this.selectItem(model);
      }
      ,changeInput: function(search_text){
        this.view_list.extract(search_text);
      }
      ,events: {
        'click .jsbtn_open_popup': 'openPopup'
        ,'click .jsbtn_add_item': 'appendItem'
      }
      ,openPopup: function(){
        var _this = this;
        //
        _this.dialog.dialog('open');
      }
    });
  };
  // ファイルアップロード
  var mixinUploadFile = function(view){
    bulbwareLib.mixin(view, {
      flag_uploading: false
      ,uploadFile: function(e){
        var _this = this;
        if (_this.flag_uploading) return false;
        if (!_this.model.id) return false;
        if (!_this.$('.js_file :file').val()) return false;
        //
        _this.flag_uploading = true;
        var backup = $(e.target).html();
        $(e.target).html(bulbwareObj.templateParams.Text.loading);
        //
        var form = _this.$('.js_file').get()[0];
        _this.model.uploadFile(form, {
          error: function() {
            console.log('error');
            $(e.target).html(backup);
            _this.flag_uploading = false;
          },
          success: function(ret) {
            var blob_key = ret.blob_key;
            _this.model.set_options({
              image: blob_key
            });
            _this.$('.js_image').attr('src', '/picture?key='+blob_key);
            _this.$('.js_file :file').val('');
            $(e.target).html(backup);
            _this.flag_uploading = false;
          }
        });
        
        // false を返してデフォルトの動作をキャンセル
        return false;      
      }
      ,events: {
        'click .jsbtn_upload_file': 'uploadFile'
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
  // パネル管理
  var viewPanel = Marionette.LayoutView.extend({
    regions: {
      'body': '.js_body'
    }
    ,onRender: function(){
      var _this = this;
      //
      _this.body.show(_this.options.view);
    }
    ,isCurrent: function(){
      return this.$el.hasClass('current');
    }
    ,setCurrent: function(){
      var _this = this;
      //
      _this.$el.parent().children().removeClass('current');
      _this.$el.addClass('current');
    }
    ,unsetCurrent: function(){
      var _this = this;
      //
      _this.$el.removeClass('current');
      _this.triggerMethod('unsetCurrent', this);
    }
    ,triggers: {
      'click .jsbtn_close_panel': 'closePanel'
      ,'click .jsbtn_open_window': 'openWindow'
      ,'click .jsbtn_permalink': 'click:permalink'
      ,'click .jsbtn_set_current': 'setCurrent'
      ,'click .jsbtn_current': 'clickCurrent'
      ,'click .jsbtn_call_order': 'clickCallOrder'
    }
    ,closePanel: function(){
      var _this = this;
      //
      _this.triggerMethod('closePanel', {
        view: _this
        ,model: _this.model
      });
    }
    ,onClosePanel: function(){
      var _this = this;
      //
      _.defer(function(){
        _this.destroy();
      });
    }
    ,onClickCurrent: function(){
      this.setCurrent();
    }
    ,onClickCallOrder: function(e){
      var _this = this;
      //
      var obj = $(e.currentTarget).data('obj');
      var id = $(e.currentTarget).data('id');
      this.triggerMethod('callOrder', obj, id);
    }
    ,getFragment: function(){
      return this.options.view.getFragment();
    }
  });
  mixinView(viewPanel);
  //
  var panelController = function(options){
    options = _.extend({
      selector: '#main'
      ,maxPanels: 10
      ,onBeforeShow: function(view){}
      ,onAfterShow: function(view){}
      ,onSetCurrent: function(view){}
    }, options);
    var panels = [];
    //
    var searchIndex = function(view){
      return _(panels).reduce(function(ret, panel, index){
        return ((panel.name == view.objName) && (panel.id == _.result(view.model, 'id'))) ? index : ret;
      }, -1);
    };
    //
    return {
      search: function(name, id){
        if (!name) return;
        if (!id) return;
        return _(panels).findWhere({name: name, id: id});
      }
      ,show: function(view, template){
        var model_id = _.result(view.model, 'id');
        if (!view.model || !model_id) {
          console.log(view.objName, model_id);
        }
        //
        var baseView = viewPanel.extend();
        mixinTemplate(baseView, panel_templates, template || 'standard');
        var view_panel = new baseView({
          view: view
        });
        options.onBeforeShow.call(this, view_panel);
        //
        $(options.selector).append(view_panel.$el);
        view_panel._isShown = true;
        view_panel.render();
        this.setCurrent(view_panel);
        //
        var index = searchIndex(view);
        panels.push({
          name: view.objName
          ,id: model_id || null
          ,view: view_panel
        });
        if (index >= 0) { // 同じパネルがある場合は古いものを消す。
          panels[index].view.destroy();
          panels.splice(index, 1);
        }
        if (panels.length > options.maxPanels) {
          var panel = panels.shift();
          panel.view.destroy();
        }
        //
        options.onAfterShow.call(this, view_panel);
      }
      ,close: function(view){
        var index = searchIndex(view);
        if (index >= 0) {
          panels.splice(index, 1);
        }
        return this.last();
      }
      ,current: function(){
        // カレントパネルを返す
        return _(panels).chain()
            .find(function(panel){
              return panel.view.isCurrent();
            })
            .result('view')
            .value();
      }
      ,setCurrent: function(view){
        if (!view) return;
        if (view == this.current()) return;
        view.setCurrent();
        options.onSetCurrent.call(this, view);
      }
      ,last: function(){
        // 最後のパネルをカレントにする
        var view = _(panels).chain()
            .last()
            .result('view')
            .value();
        this.setCurrent(view);
        return view;
      }
      ,prev: function(){
        // カレントを前のパネルに移動する
        var view = _(panels).chain()
            .reduce(function(ret, panel){
              if (!ret.flag) {
                if (panel.view.isCurrent()) {
                  ret.flag = true;
                } else {
                  ret.view = panel.view;
                }
              }
              return ret;
            }, {
              view: null
              ,flag: false
            })
            .result('view')
            .value();
        this.setCurrent(view);
        return view;
      }
      ,next: function(){
        // カレントを次にパネルに移動する
        var view = _(panels).chain()
            .reduceRight(function(ret, panel){
              if (!ret.flag) {
                if (panel.view.isCurrent()) {
                  ret.flag = true;
                } else {
                  ret.view = panel.view;
                }
              }
              return ret;
            }, {
              view: null
              ,flag: false
            })
            .result('view')
            .value();
        this.setCurrent(view);
        return view;
      }
      ,move: function(scrollTop){
        // scrollTopに近いパネルをカレントにする
        var view = _(panels).chain()
            .find(function(panel){
              var top = panel.view.$el.offset().top;
              return (top > scrollTop);
            })
            .result('view')
            .value();
        this.setCurrent(view);
        return view;
      }
    };
  };
  //
  return {
    mixin: {
      template: mixinTemplate // テンプレート展開を追加する function(view, templates, section, options)
      ,view: mixinView
      ,edit: mixinEdit // 編集用にする function(view)
      ,detailEdit: mixinDetailEdit // 明細編集用にする function(view)
      ,toggleEdit: mixinToggleEdit // 開閉型編集にする function(view)
      ,orderEdit: mixinOrderEdit // 伝票編集用にする function(view)
      ,details: mixinDetails // 明細一覧用にする function(view)
      ,conditions: mixinConditions // 検索条件用にする function(view){
      ,list: mixinListView // 一覧検索用にする function(viewList, viewItem)
      ,extractView: mixinExtractView // 一覧抽出機能をつける function(viewList, viewItem)
      ,projectDetailEdit: mixinProjectDetailEdit // プロジェクト明細用
      ,popupSelectMaster: mixinPopupSelectMaster // マスター選択のポップアップView
      ,uploadFile: mixinUploadFile
    }
    ,createViewList: createViewList
    ,bindTemplate: bindTemplate
    ,panelController: panelController
  };
});
