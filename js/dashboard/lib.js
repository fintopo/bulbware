define([
], function(){
  //
  var common = function(){
console.log('common');
    //オブジェクトメニュー　設定
    $('.q_batch_menu, .q_list_batch_menu').find('.dropdown-menu').find('.q_stop_propagation').click(function(e){
    	e.stopPropagation();
    });
    
    //
    //Plugin bootstrap tool tip
    $('[rel=tooltip], .n_tooltip').tooltip({
    	container: 'body'
    }).focus(function () {
    	$(this).tooltip('hide');
    });
    
    
    //Plugin bootstrap popover
    $('.n_btn_popover').popover({
    	trigger:'hover',
    	container: 'body',
    	html:true
    });
    //Plugin bootstrap popover
    var isVisible = false;
    var clickedAway = false;
    $('.n_btn_popover_html > .trigger').popover({ 
    	trigger: 'manual',
    	html : true, 
    	title: function() {
    	  return $(this).parent().find('.head').html();
    	},
    	content: function() {
    	  return $(this).parent().find('.content').html();
    	}
    }).click(function (e) {
    	$(this).popover('show');
    	clickedAway = false
    	isVisible = true
    	e.preventDefault()
    });
    $(document).click(function (e) {
    	if (isVisible & clickedAway) {
    	  $('.n_btn_popover_html > .trigger').popover('hide')
    	  isVisible = clickedAway = false
    	} else {
    	  clickedAway = true
    	}
    });
    
    //Plugin jQuery-ui datepicker
    $('.n_datepicker').datepicker({
      // 日付選択用パラメータ
      closeText: '閉じる',
      prevText: '&#x3c;前',
      nextText: '次&#x3e;',
      currentText: '今日',
      monthNames: ['1月','2月','3月','4月','5月','6月',
    		           '7月','8月','9月','10月','11月','12月'],
      monthNamesShort: ['1月','2月','3月','4月','5月','6月',
    		                '7月','8月','9月','10月','11月','12月'],
      dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
      dayNamesShort: ['日','月','火','水','木','金','土'],
      dayNamesMin: ['日','月','火','水','木','金','土'],
      weekHeader: '週',
      dateFormat: 'yy/mm/dd',
      firstDay: 0,
      isRTL: false,
      showMonthAfterYear: true,
      yearSuffix: '年',
      showButtonPanel: true
    });
    
    //dropdownタッチ対応
    function touchFix(){
    	$('body')
    		  .on('touchstart.dropdown', '.dropdown-menu', function (e) {e.stopPropagation();})
    		  .on('touchstart.dropdown', '.dropdown-submenu', function (e) {e.preventDefault();});
    }
    touchFix();
    
    //  	
    var heightCheck = function(){
      var windowHeight = $(window).height();
      var headerHeight = $('.q_content_header').outerHeight();
      //  search
    	var $search = $('#n_tab_search').find('.q_tab_body');
    	var searchHeight = windowHeight - headerHeight;
    	//  list
      var $list = $('#n_tab_list');    
      var listHeaderHeight = $list.find('.q_list_header').outerHeight();
      var listHeight = windowHeight - headerHeight;
      //  grid
    	var $grid = $('#n_tab_grid').find('.q_tab_body');
    	var gridHeight = windowHeight - headerHeight;
      //  detail
    	var $detail = $('#n_tab_detail');
    	var detailHeaderHeight = $detail.find('.q_detail_header').outerHeight();
    	var detailHeight = windowHeight - headerHeight;
      //
      $search.css({
        'height': searchHeight
      });
    	$list.find('.tab-content').css({
        'min-height': listHeight
    	});
    	$list.find('.q_tab_body').css({
      	'padding-top': listHeaderHeight,
      	'height': listHeight,
    	});
    	$grid.css({
      	'height': gridHeight
      });
    	$detail.find('.tab-content').css({
      	'min-height': detailHeight
    	});
    	$detail.find('.q_tab_left_wrapper').css({
      	'padding-top': detailHeaderHeight,
      	'height': detailHeight,
    	});    		
    	
    	//
    	var $sbRight = $('.slidebar_right');
    	var sbRightTopPadding = detailHeaderHeight + headerHeight
    	if($('html').hasClass('q_width_fix')){
      	$sbRight.css({
        	'z-index':30,
        	'padding-top': 40
        });
    	} else{
      	$sbRight.css({
        	'z-index':2,
        	'padding-top': sbRightTopPadding - 1
        });
    	}
    }
    heightCheck();
    
    //width切り替えボタン
    var widthSwichText = function(){
      var $swich = $('#q_width_swich').find('a');
  		if ($('html').hasClass('q_width_fix')){
    		$swich.find('span').text('Resize Large');
    		$swich.find('i').addClass('fa-resize-full').removeClass('fa-resize-small');
    	}else{
    		$swich.find('span').text('Resize Small');
    		$swich.find('i').addClass('fa-resize-small').removeClass('fa-resize-full');
      }
    }
    var widthSwich = function(){
      var $swich = $('#q_width_swich').find('a');
      widthSwichText();          
      function textToggle(){
        widthSwichText();
		    heightCheck();
      };
      $swich.off().on('click', function(){	
  	    $('html').toggleClass('q_width_fix');
  	    $.cookie("contents_width", $('html').attr('class') , {expires: 7});
      	textToggle();
      	QUOTA.lib.eventChangeTab.n_tab_list();
      });
      var CookieName = $.cookie('contents_width');
      if (CookieName != null) {
  	    $('html').addClass(CookieName);
      	textToggle();
      }
    }
    widthSwich();
    
    
    //Gridタブ用
    var init_masonry = function(){
    	var $container = $('#n_tab_grid .q_grid_body');
    	var $grid_item = $container.find('.q_grid_item');
      if ($grid_item.length == 0) return;
    	var gutter = 15;
    	var min_width = 190;
    	$container.imagesLoaded(function(){
  	    $container.masonry({
	        itemSelector : $grid_item,
	        gutterWidth: gutter,
	        isAnimated: true,
      		columnWidth:function( containerWidth ) {
            var num_of_boxes = (containerWidth/min_width | 0);
            var box_width = (((containerWidth - (num_of_boxes)*gutter)/num_of_boxes) | 0) ;	
            if (containerWidth < min_width) {
              box_width = containerWidth;
            }
            $grid_item.width(box_width);
            return box_width;
      		}
  	    });
    	});
    }
    init_masonry();
    
    //media D&D    
    var media_drag = function(){
      var $slidebar = $('.slidebar_right');
      var $slidebar_body = $slidebar.find('.slidebar_body');
      var $drag_item = $slidebar_body.find('.q_move_item_wrap').find('img');
      var $drop_main = $('.q_detail_thumb_main,.q_drop_area_sample, .q_drop_area_bulk');
      
      $drag_item.draggable({
        revert: 'invalid',
        helper: 'clone',
        cursor: 'move',
        opacity:.5,
        start:function (e, ui) {
        	$slidebar_body.css('overflow-y','visible');
        },
        stop:function (e, ui) {
        	$slidebar_body.css('overflow-y','auto');
        },
      });
      
      $drop_main.droppable({
        activeClass: "q_drop_active",
        hoverClass: "q_drop_hover",
        drop: function (e, ui) {
          var $dropped_image = $(ui.draggable);
          var $image = $(this).find('img');
          var $image_link = $image.parent('.gallery-link');
          if (!$image) return;
          $image.attr('src', $dropped_image.attr('src'));
          $image.data('filename', $dropped_image.data('filename'));
          $image.data('file_id', $dropped_image.data('file_id'));
          $image.data('original-title', $dropped_image.data('original-title'));
          $image_link.attr('href', $dropped_image.data('filename'));
          $image_link.attr('title', $dropped_image.attr('alt'));
        }
      });      
    };
    media_drag();    
    
    $('.num3').comma3();	
    
    $('.drilldown').drilldown();
    
    $('.inputcounter').inputcounter();
    
    $('.accordion').accordion({});

    //商品締め処理スライドバー      
    $('.q_body_close_merchandise .slidebar_bottom').slidebar({
      position: 'bottom',
      parentClass: '.q_tab_body'
    });        

    //画像拡大
    $('.gallery-group-link').on('click', function (event) {
      event.preventDefault();
      var target = event.target || event.srcElement,
      link = target.src ? target.parentNode : target,
      options = {
        index: link, 
        event: event
      },
      $links = $('.gallery').find('.gallery-group-link');
      blueimp.Gallery($links, options);
    });
    $('.gallery-link').on('click', function (event) {
      event.preventDefault();
      var target = event.target || event.srcElement,
      link = target.src ? target.parentNode : target,
      options = {
        index: link, 
        event: event
      },
      $links = $(this);
      blueimp.Gallery($links, options);
    });
    
  };
  //
  return {
    common: common
  };
});
