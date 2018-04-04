/*!
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */
;(function ( $, window, document, undefined ) {
    var pluginName = "ScrollupArrow",
        defaults = {
            bottom: '2rem',
            right: 0,
            left: 'unset',
            speed: 1000,
            heightToFade: 500,
            hideMobile: true
        }; 

    function Plugin( element, options ) {
        this.element = $(element);
        this.options = $.extend( {}, defaults, options) ; 
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }
 
    Plugin.prototype = {
        init: function() {
          this.element.css({
            'bottom': this.options.bottom,
            'right': this.options.right,
            'left': this.options.left
          });
          this.scrollTo(this.element, this.options);
          this.hideOnScroll(this.element, this.options);
          if(this.options.hideMobile){
            this.hideOnWidth(this.element, this.options); 
          }
        },
      scrollTo: function(el, options) {       
        el.on('click', function(evt) {
          evt.preventDefault();
          $('html, body').animate({
             scrollTop: 0
          }, options.speed)
	      });
      },
      hideOnScroll: function(el, options){
         $(window).on('scroll',function() {
          if( $(this).scrollTop() < options.heightToFade) {
            el.fadeOut();
          } else
            el.fadeIn();
        });
      },
      hideOnWidth: function(el, options) {
        if($(window).width() < 375) {
          el.hide();
          $(window).off('scroll');
        }
        else  
          this.hideOnScroll(this.element, this.options);
      }
    };  
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if ( !$.data(this, "plugin_" + pluginName )) {
                $.data( this, "plugin_" + pluginName,
                new Plugin( this, options ));
            }
        });
    } 
})( jQuery, window, document );
