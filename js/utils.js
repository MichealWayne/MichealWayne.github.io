/*
 * @author Wayne
 * @Date 2019-06-04 14:11:26
 * @LastEditTime 2023-01-11 21:17:53
 */
/**
 * Mobile navigation
 */
;(function( $, window, document, undefined ){
  "use strict";
  
  $(document).ready(function($) {

    var $body = $('body');

    if ($body.width() < 50 || $body.height() < 50) {
      $('body').html('Error! 浏览器窗口环境异常');
      return;
    }

    $('.button-toggle').click( function(e) {
      $body.toggleClass('menu-open');
      $('body,html').scrollTop( 0 );
      return false;
    });

    var defaultWindowWidth = $(window).width();
    $(window).resize(function() {
      if (defaultWindowWidth != $(window).width()) {
        $body.removeClass('menu-open');
      }
    });

  });
})(jQuery, window, document);


/**
 * Nav sticky
 */
;$(document).ready(function(){
  $(".site-nav").fixeditem({distance:0, pos:"top"})
});


/**
 * Scroll Up
 */
;$(document).ready(function() {
  $(".scroll-up").hide();
  $(function () {
    $(window).scroll(function () {
      if ($(this).scrollTop() > 600) {
        $('.scroll-up').fadeIn();
      } else {
        $('.scroll-up').fadeOut();
      }
    });
    $('a.scroll-up').click(function () {
      $('body,html').animate({
        scrollTop: 0
      }, 600);
      return false;
    });
  });
});
