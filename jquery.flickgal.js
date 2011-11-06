/*****************************************************************************
 jQuery flickGal 1.1.6
 
 Copyright (c) 2011 Soichi Takamura (http://stakam.net/jquery/flickgal/demo.html)
 
 Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
 
 **************************************************************************** */

(function ($, window) {

  $['fn']['flickGal'] = function (options) {

    options = $['extend']({
      'infinitCarousel': false,
      'lockScroll': true
    }, options);

    // ==== Common functions and variables ====
    // for setting browser prefix and some other
    var userAgent = navigator.userAgent.toLowerCase();

    /** @enum {Number} */
    var BrowserType = {
      WEBKIT: 0,
      GECKO: 1,
      MSIE: 2,
      OPERA: 3,
      OTHER: 4
    };
    var browser = (userAgent.indexOf('webkit') >= 0) ? BrowserType.WEBKIT : (userAgent.indexOf('gecko') >= 0) ? BrowserType.GECKO : (userAgent.indexOf('msie') >= 0) ? BrowserType.MSIE : (userAgent.indexOf('opera') >= 0) ? BrowserType.OPERA : BrowserType.OTHER;
    var isMobile = !! (userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0 || userAgent.indexOf('android') >= 0);
    var CSS_PREFIX;
    switch (browser) {
    case BrowserType.WEBKIT:
      CSS_PREFIX = '-webkit-';
      break;
    case BrowserType.GECKO:
      CSS_PREFIX = '-moz-';
      break;
    case BrowserType.MSIE:
      CSS_PREFIX = '-ms-';
      break;
    case BrowserType.OPERA:
      CSS_PREFIX = '-o-';
      break;
    case BrowserType.OTHER:
      CSS_PREFIX = '';
      break;
    }
    var CSS_TRANSITION = CSS_PREFIX + 'transition',
      CSS_TRANSFORM = CSS_PREFIX + 'transform',
      CSS_TRANSFORM_ORIGIN = CSS_PREFIX + 'transform-origin',
      TRANSLATE_PREFIX = (browser == BrowserType.WEBKIT) ? 'translate3d(' : 'translate(',
      TRANSLATE_SUFFIX = (browser == BrowserType.WEBKIT) ? 'px,0,0)' : 'px,0)';

    /** @enum {String} */
    var EventType = {
      START: isMobile ? 'touchstart' : 'mousedown',
      END: isMobile ? 'touchend' : 'mouseup',
      MOVE: isMobile ? 'touchmove' : 'mousemove',
      TRANSITION_END: (browser == BrowserType.WEBKIT) ? 'webkitTransitionEnd' : (browser == BrowserType.OPERA) ? 'oTransitionEnd' : 'transitionend',
      // im not sure about these..
      ORIENTATION_CHAGE: 'orientationchange',
      CLICK: 'click',
      RESIZE: 'resize'
    };

    /** @return {String} */
    function getCssTranslateValue(translateX /** @type{Number|String} */ ) {
      return [TRANSLATE_PREFIX, translateX, TRANSLATE_SUFFIX].join('')
    }
    

    // ==== Each execution ====
    return this['each'](function () {

      // initializing variables
      var $flickBox = $(this),
        $container = $('.container', $flickBox)['css']({
          overflow: 'hidden'
        }),
        $box = $('.containerInner', $container)['css']({
          position: 'relative',
          overflow: 'hidden',
          top: 0,
          left: 0
        }),
        $items = $('.item', $box)['css']({
          'float': 'left'
        }),
        itemLength = $items['length'],
        itemWidth = $items['outerWidth'](true),
        boxWidth = itemWidth * itemLength,
        boxHeight = $items['outerHeight'](true),
        minLeft = 0,
        maxLeft = ((itemWidth * itemLength) - itemWidth) * -1,

        // currently displayed index
        cd = 0,
        
        // these two will be updated by `redefineLeftOffset()'.
        containerOffsetLeft = 0, // left offset outside of the container
        containerBaseX = 0; // dispance of left blank when the first is center

      $container['height'](boxHeight)['scroll'](function () {
        $(this)['scrollLeft'](0);
      });
      $box['height'](boxHeight)['width'](boxWidth)['css'](CSS_TRANSFORM, getCssTranslateValue(getTranslateX()));

      // **** define left offset ****
      function redefineLeftOffset(e) {
        containerOffsetLeft = $container['offset']()['left'];
        containerBaseX = ($container['innerWidth']() - itemWidth) / 2;
        moveToIndex(cd);
      }
      $(window)['bind'](isMobile ? EventType.ORIENTATION_CHAGE : EventType.RESIZE, redefineLeftOffset);
      redefineLeftOffset();

      // **** navigation behavior ****
      var $nav = $('.nav', $flickBox),
        $navA = $nav['find']('a[href^=#]'),
        $navChildren = $navA['parent']();
      var useNav = !! ($nav['length'] && $navA['length'] && $navChildren['length']);
      if (useNav) {
        $navChildren['eq'](0)['addClass']('selected');
        $navA['bind'](EventType.START, function (e) {
          var index = $navA['index'](this);
          moveToIndex(index);
          return false;
        })['bind'](EventType.CLICK, function () {
          return false;
        });
      }

      // **** box behavior **** 
      var touchEvents = [EventType.MOVE, EventType.START, EventType.END];
      if (isMobile) {
        var box = $box[0];
        $['each'](touchEvents, function (i, e) {
          box.addEventListener(e, touchHandler, false);
        });
        box.addEventListener(EventType.TRANSITION_END, transitionEndHandler, false);
      } else {
        $box['bind'](touchEvents.join(' '), touchHandler)['bind'](EventType.TRANSITION_END, transitionEndHandler);
      }

      // **** back and forth arrows behavior (optional) ****
      var $prev = $('.prev', $flickBox),
        $next = $('.next', $flickBox);
      var useArrows = !! ($prev['length'] && $next['length']);
      if (useArrows) {
        function prevTappedHandler() {
          cd = (cd > 0) ? cd - 1 : options['infinitCarousel'] ? itemLength - 1 : cd;
          moveToIndex(cd);
        }

        function nextTappedHandler() {
          cd = (cd < itemLength - 1) ? cd + 1 : options['infinitCarousel'] ? 0 : cd;
          moveToIndex(cd);
        }

        function disableArrow() {
          $prev.add($next)['removeClass']('off');

          if (cd === 0) {
            $prev['addClass']('off');
          } else if (cd === itemLength - 1) {
            $next['addClass']('off');
          }
        }

        $prev['bind'](EventType.START, prevTappedHandler);
        $next['bind'](EventType.START, nextTappedHandler);
        disableArrow();
      }

      // ==== function - touch event handler ====
      var startX = 0,
        endX = 0,
        startTime = 0,
        startLeft = 0,
        isMoving = false;

      function touchHandler(e) {

        var touch = isMobile ? e.touches[0] : e;

        switch (e.type) {
          // ############# touchMove
        case EventType.MOVE:
          if (options['lockScroll']) e.preventDefault();
          if (isMoving) {
            var diffX = containerBaseX + touch.pageX - startX;
            $box['css'](CSS_TRANSFORM, getCssTranslateValue(startLeft + diffX));
          }
          break;

          // ############# touchStart
        case EventType.START:
          if (!isMobile) e.preventDefault();
          isMoving = true;

          startTime = (new Date()).getTime();
          startX = isMobile ? touch.pageX : e.clientX;
          startLeft = getTranslateX() - containerOffsetLeft - containerBaseX;

          if ($box['hasClass']('moving')) {
            $box['removeClass']('moving')['css'](CSS_TRANSFORM, getCssTranslateValue(containerBaseX + startLeft));
          }
          break;

          // ############# touchEnd
        case EventType.END:
          startLeft = 0;
          isMoving = false;
          endX = isMobile ? e.changedTouches[0].pageX : e.clientX;
          moveToIndex();
          break;
        }
      }

      // ==== function - when the animation finished ====

      function transitionEndHandler() {
        $box['removeClass']('moving');
      }

      // ==== function - scrolling box to fit to grid ====
      /**
       * @param {Number?} opt_cd
       */

      function moveToIndex(opt_cd) {

        $box['addClass']('moving');

        if (typeof (opt_cd) == 'number') {
          cd = opt_cd;
        } else {
          var endTime = new Date().getTime();
          var timeDiff = endTime - startTime;
          var distanceX = endX - startX;

          // when fast and large distance enough, go next/previous item
          if (timeDiff < 300 && Math.abs(distanceX) > 30) {
            distanceX > 0 ? cd-- : cd++;

          // else, just snap to the right item
          } else {
            var currX = getTranslateX() - containerOffsetLeft;
            console.log(containerBaseX, currX);
            var d = Math.abs((minLeft + currX) - containerBaseX - itemWidth / 2);
            cd = Math.floor(d / itemWidth);
          }
        }

        if (cd > itemLength - 1) {
          cd = itemLength - 1;
        } else if (cd < 0) {
          cd = 0;
        }

        // detect right position to fit
        $box['css'](CSS_TRANSFORM, getCssTranslateValue(containerBaseX + itemWidth * cd * -1));

        if (useNav) {
          $navChildren['removeClass']('selected')['eq'](cd)['addClass']('selected');
        }
        if (useArrows) {
          disableArrow();
        }
      }

      // ==== internal functions ====
      /** @return {Number} */

      function getTranslateX() {
        return !(browser == BrowserType.GECKO) ? $box['offset']()['left'] : getGeckoTranslateX($box);
      }

      function getGeckoTranslateX ($elm) {
        try {
          var translateX = window['parseInt'](/(,.+?){3} (.+?)px/.exec($elm['css'](CSS_TRANSFORM))[2]);
          return !window['isNaN'](translateX) ? translateX + containerOffsetLeft : 0;
        } catch (e) {}
        return 0;
      }

    });
  };
})(window['jQuery'], this);
