(function($) {
  var namespace = 'slidebar';
  var methods = {
    init: function(options){
      options = $.extend({
        position: 'left'
        ,open: false
        ,speed: 300
        ,minSize: 10
        ,closeWidth: 0
        ,closeHeight: 0
        ,classOpen: 'slidebar-open'
        ,classClose: 'slidebar-close'
        ,classExpand: 'slidebar-expand'
        ,mode: 'width'
        // ,duration: 400
        ,onOpen: null
        ,onBeforeOpen: null
        ,onClose: null
        ,onBeforeClose: null
        ,onMouseDown: null
        ,onMouseUp: null
      }, options);
      //
      return this.each(function(){
        var _this = this;
        var $this = $(this);
        var data = $this.data(namespace);
        if (!data) {
          options = $.extend({
            width: $this.data('width'),
            height: $this.data('height')
          }, options);
          $this.data(namespace, {
            options: options
          });
          $this.find('.slidebar-open')
            .unbind('click.'+namespace)
            .bind('click.'+namespace, function(){
              methods.open.apply(_this);
            });
          $this.find('.slidebar-close')
            .unbind('click.'+namespace)
            .bind('click.'+namespace, function(){
              methods.close.apply(_this);
            });
          //
          $this.find('.slidebar-resize').mousedown(function(e) {
            var options = $this.data(namespace).options;
            var mx = e.pageX;
            var my = e.pageY;
            //
            if (typeof options.onMouseDown == 'function') {
              options.onMouseDown.call($this, mx, my);
            }
            //
            $(document).on('mousemove.'+namespace, function(e) {
              var params = {};
              var f_close = false;
              var f_expand = false;
              switch (options.mode) {
              case 'position':
                var width, height;
                switch(options.position) {
                case 'top':
                  var top = Number($this.css('top').replace('px', ''));
                  height = Number($this.css('height').replace('px', ''));
                  if (height > options.height) {
                    top += (height - options.height);
                  }
                  params.top = (top - my) + e.pageY;
                  if ((options.height + params.top) <= (options.closeHeight - options.height + options.minSize)) {
                    f_close = true;
                    params.top = options.closeHeight - options.height;
                  } else if (params.top > 0) {
                    params.height += params.top;
                    params.top = 0;
                  }
                  break;
                case 'bottom':
                  var bottom = Number($this.css('bottom').replace('px', ''));
                  height = Number($this.css('height').replace('px', ''));
                  if (height > options.height) {
                    bottom += (height - options.height);
                  }
                  params.bottom = bottom + my - e.pageY;
                  if ((options.height + params.bottom) <= (options.closeHeight - options.height + options.minSize)) {
                    f_close = true;
                    params.bottom = options.closeHeight - options.height;
                  } else if (params.bottom > 0) {
                    params.height += params.bottom;
                    params.bottom = 0;
                  }
                  break;
                case 'right':
                  var right = Number($this.css('right').replace('px', ''));
                  width = Number($this.css('width').replace('px', ''));
                  if (width > options.width) {
                    right += (width - options.width);
                  }
                  params.right = right + mx - e.pageX;
                  if ((options.width + params.right) <= (options.closeWidth - options.width + options.minSize)) {
                    f_close = true;
                    params.right = options.closeWidth - options.width;
                  } else if (params.right > 0) {
                    params.width += params.right;
                    params.right = 0;
                  }
                  break;
                case 'left':
                  var left = Number($this.css('left').replace('px', ''));
                  width = Number($this.css('width').replace('px', ''));
                  if (width > options.width) {
                    left += (width - options.width);
                  }
                  params.left = (left - mx) + e.pageX;
                  params.width = options.width;
                  if ((options.width + params.left) <= (options.closeWidth - options.width + options.minSize)) {
                    f_close = true;
                    params.left = options.closeWidth - options.width;
                  } else if (params.left > 0) {
                    params.width += params.left;
                    params.left = 0;
                  }
                }
                break;
              default: // mode:width
                switch(options.position) {
                case 'top':
                  params.height =   ( $this.height() - my ) + e.pageY;
                  if (params.height <= (options.closeHeight + options.minSize)) {
                    f_close = true;
                    params.height = options.closeHeight;
                  }
                  break;
                case 'bottom':
                  params.height = $this.height() + my - e.pageY;
                  if (params.height <= (options.closeHeight + options.minSize)) {
                    f_close = true;
                    params.height = options.closeHeight;
                  }
                  break;
                case 'right':
                  params.width = $this.width() + mx - e.pageX;
                  if (params.width <= (options.closeWidth + options.minSize)) {
                    f_close = true;
                    params.width = options.closeWidth;
                  }
                  break;
                case 'left':
                  params.width =   ( $this.width() - mx ) + e.pageX;
                  if (params.width <= (options.closeWidth + options.minSize)) {
                    f_close = true;
                    params.width = options.closeWidth;
                  }
                  f_expand = (params.width > Number(options.width.replace('px', '')));
                }
              }
              //
              $this.removeClass(options.classExpand);
              if (f_close) {
                $this
                  .removeClass(options.classOpen)
                  .addClass(options.classClose);
              } else {
                $this
                  .removeClass(options.classClose)
                  .addClass(options.classOpen);
                if (f_expand) {
                  $this.addClass(options.classExpand);
                }
              }
              $this.css(params);
              mx = e.pageX;
              my = e.pageY;
              return false;
            }).one('mouseup', function() {
              $(document).off('mousemove.'+namespace);
              //
              if (typeof options.onMouseUp == 'function') {
                options.onMouseUp.call($this);
              }
              //
              if ((mx == e.pageX) && (my == e.pageY)) {
                // click
                methods.toggle.apply(_this);
              }
            });
            return false;
          });
          //
          if (options.open) {
            methods.open.apply(_this);
          } else {
            methods.close.apply(_this);
          }
        }
      }); // end each
    },
    destroy: function(){
      return this.each(function(){
        var $this = $(this);
        $(window).unbind('.'+namespace);
        $this.removeData(namespace);
      });
    }
    ,toggle: function(){
      var $this = $(this);
      var options = $this.data(namespace).options;
      if ($this.hasClass(options.classOpen)) {
        methods.close.apply(this);
        return 'close';
      } else {
        methods.open.apply(this);
        return 'open';
      }
    }
    ,open: function(options){
      var $this = $(this);
      options = $.extend($this.data(namespace).options, options);
      //
      if (typeof options.onBeforeOpen == 'function') {
        options.onBeforeOpen.call(this);
      }
      //
      var params = {};
      switch (options.mode) {
      case 'position':
        params[options.position] = 0;
        switch(options.position) {
        case 'top':
        case 'bottom':
          params.height = options.height;
          break;
        case 'right':
        case 'left':
          params.width = options.width;
        }
        break;
      default: // mode: width
        switch(options.position) {
        case 'top':
        case 'bottom':
          params.height = options.height;
          break;
        case 'right':
        case 'left':
          params.width = options.width;
        }
      }            
      $this
          .css(params)
          .removeClass(options.classClose)
          .addClass(options.classOpen)
          .removeClass(options.classExpand);
      //
      if (typeof options.onOpen == 'function') {
        options.onOpen.call(this);
      }
    },
    close: function(options){
      var $this = $(this);
      options = $.extend($this.data(namespace).options, options);
      //
      if (typeof options.onBeforeClose == 'function') {
        options.onBeforeClose.call(this);
      }
      //
      var params = {};
      switch (options.mode) {
      case 'position':
        switch(options.position) {
        case 'top':
          params.top = options.closeHeight - options.height;
          params.height = options.height;
          break;
        case 'bottom':
          params.bottom = options.closeHeight - options.height;
          params.height = options.height;
          break;
        case 'right':
          params.right = options.closeWidth - options.width;
          params.width = options.width;
          break;
        case 'left':
          params.left = options.closeWidth - options.width;
          params.width = options.width;
          break;
        }
        break;
      default:
        switch(options.position) {
        case 'top':
        case 'bottom':
          params.height = options.closeHeight;
          break;
        case 'right':
        case 'left':
          params.width = options.closeWidth;
          break;
        }
      }
      $this
          .css(params)
          .removeClass(options.classOpen)
          .addClass(options.classClose)
          .removeClass(options.classExpand);
      //
      if (typeof options.onClose == 'function') {
        options.onClose.call(this);
      }
    }
    ,reset: function(options){
      var $this = $(this);
      $.extend($this.data(namespace).options, options);
    }
  };
  $.fn.slidebar = function(method){
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.'+namespace);
    }    
  };
})(jQuery);