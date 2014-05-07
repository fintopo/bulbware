define([
  'bulbware/lib'
], function(BulbwareLib){
  var mixinMethod = function(view, property, methodName) {
    // http://open.bekk.no/mixins-in-backbone

    // if the method is defined on from ...
    if (!_.isUndefined(property[methodName])) {
      var old = view.prototype[methodName];

      // ... we create a new function on to
      view.prototype[methodName] = function() {
        // wherein we first call the method which exists on `to`
        var oldReturn = old.apply(this, arguments);

        // and then call the method on `from`
        var newReturn = property[methodName].apply(this, arguments);

        // and then return the expected result,
        // i.e. what the method on `to` returns
        return newReturn || oldReturn;

      };
    }
  };
  var mixin = function(view, property){
    _.extend(view.prototype, _(property).omit('events', 'initialize', 'render'));
    mixinMethod(view, property, 'initialize');
    mixinMethod(view, property, 'render');
    view.prototype.events = _.defaults(_.result(view.prototype, 'events') || {}, property.events);
  };
  var mixinTemplate = function(view, templates, section, options){
    mixin(view, _.extend({
      tagName: _.trim(templates[section+'_tagName']) || 'div'
      ,className: _.trim(templates[section+'_className']) || ''
    }, (view.prototype.itemView) ? {
      itemViewContainer: _.trim(templates[section+'_container']) || ''
    } : null, (view.prototype.toEdit) ? {
      template: function(attributes){
        var template = (attributes.is_edit) ? templates[section+'_edit'] : templates[section+'_view'];
        return SNBinder.bind(template, attributes);
      }
    } : {
      template: function(attributes){
        return SNBinder.bind(templates[section], attributes);
      }
    }, options));
  };
  var mixinToggleEdit = function(view){
    mixin(view, {
      initialize: function(options) {
        options = options || {};
        this.listenTo(this, 'show', this.setFocus);
        this.listenTo(this, 'toEdit', this.setFocus);
        this.setIsEdit(options.is_edit || this.model.isNew() || false);
      }
      ,setIsEdit: function(value){
        this.is_edit = value;
        this.model.set('is_edit', value); // Marionette.ItemViewのtemplateを関数にした時にthisがviewを示していないため、attributesに含めておく
        //
        if (value) {
          this.$el.addClass('view_open');
          this.$el.removeClass('view_close');
        } else {
          this.$el.addClass('view_close');
          this.$el.removeClass('view_open');
        }
      }
      ,setFocus: function(){
        var $input = _.result(this.ui, 'first');
        if ($input) {
          $input.focus();
        }
      }
      ,events: {
        'click .jscbtn_to_view': 'toView'
        ,'click .jscbtn_to_edit': 'toEdit'
        ,'click .jscbtn_save': 'save'
        ,'click .jscbtn_delete': 'delete'
      }
      ,toEdit: function(){
        this.setIsEdit(true);
        this.render();
        this.trigger('toEdit');
      }
      ,toView: function(){
        this.setIsEdit(false);
        this.render();
        this.trigger('toView');
      }
      ,save: function(){
        var _this = this;
        //
        _this.trigger('beforeSave');
        if (typeof _this.beforeSave == 'function') {
          _this.beforeSave();
        }
        //
        var flagNew = _this.model.isNew();
        _this.model.save(null, {
          success: function(){
            _this.trigger('afterSave');
            //
            if (flagNew && _this.model.collection) {
              _this.model.collection.add(_this.model);
            }
            _this.toView();
          }
        });
      }
      ,delete: function(){
        var _this = this;
        //
        if (typeof _this.beforeDelete == 'function') {
          if (_this.beforeDelete() === false) {
            return;
          }
        }
        //
        _this.model.destroy({
          success: function(){
            _this.trigger('afterDelete');
          }
        });
      }      
    });
  };
  //
  return {
    mixin: {
      toggleEdit: mixinToggleEdit
      ,template: mixinTemplate
    }
  };
});
