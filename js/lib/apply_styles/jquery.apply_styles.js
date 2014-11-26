/*
 * applyStyles Ver.1.1.1(2014/11/26)
 * 
 * by fintopo(http://www.fintopo.jp/)
 */

(function($) {
  'use strict';

  var namespace = 'applyStyles';
  var methods = {
    init: function(options){
      options = $.extend({
        classes: null
        ,styles: null
        ,sections: null
      }, options);
      if (options.css) {
        var parsed = methods.parse.call(this, options);
        options.sections = [].concat(options.sections || [], parsed);
      }
      //
      var apply_styles = function($this, section){
        if (!$this) return;
        if (section.classes) {
          var classes = section.classes;
          if ($.type(classes) != 'string') {
            classes = section.classes.join(' ');
          }
          $this.addClass(classes);
        }
        if (section.styles) {
          $this.css(section.styles);
        }
        if (section.sections) {
console.log(section.sections);
          $.each(section.sections, function(index, section){
            apply_styles($this.find(section.name), section);
          });
        }
      };
      //
      return this.each(function(){
        apply_styles($(this), options);
      }); // end each
    }
    ,parse: function(options){
      if ($.type(options.css) != 'string') return;
      var params = options.css.replace(/[\n\r]/g,'').match(/(.+?\{.*?\})+?/mg);
      if (!params) return;
      var ret = $.map(params, function(section, index){
        var params = section.match(/(.+?)\{(.*?)\}/m);
        if (!params) return null;
        var name = params[1].trim();
        var value = params[2].trim();
        var classes = [];
        var styles = {};
        var values = value.match(/(.+?:.+?;)+?/mg);
        if (!values) return null;
        $.each(values, function(index, param){
          var params = param.match(/(.+)?:(.+)?;/m);
          var name = params[1].trim();
          var value = params[2].trim();
          if (name == '-as-classes') {
            classes.push(value);
          } else {
            styles[name] = value;
          }
        });
        return {
          'name': name
          ,'classes': classes
          ,'styles': styles
        };
      });
      return ret;
    }
  };
  $.fn.applyStyles = function(method){
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.'+namespace);
    }    
  };
})(jQuery);