/*****************************************************************************
 jQuery flickGal 1.1
 
 Copyright (c) 2011 Soichi Takamura (http://stakam.net/jquery/flickgal/demo.html)
 
 Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
 
 **************************************************************************** */

(function (jQuery) {

    jQuery['fn']['flickGal'] = function (options) {

        options = jQuery['extend']({
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
        var browser = (userAgent.indexOf('webkit') >= 0) ? BrowserType.WEBKIT :
                      (userAgent.indexOf('gecko') >= 0) ? BrowserType.GECKO :
                      (userAgent.indexOf('msie') >= 0) ? BrowserType.MSIE:
                      (userAgent.indexOf('opera') >= 0) ? BrowserType.OPERA : BrowserType.OTHER;
        var isMobile = !!(userAgent.indexOf('iphone') >= 0 ||
                          userAgent.indexOf('ipad') >= 0 ||
                          userAgent.indexOf('android') >=0);
        var CSS_PREFIX;
        switch (browser) {
          case BrowserType.WEBKIT: CSS_PREFIX = '-webkit-'; break;
          case BrowserType.GECKO: CSS_PREFIX = '-moz-'; break;
          case BrowserType.MSIE: CSS_PREFIX = '-ms-'; break;
          case BrowserType.OPERA: CSS_PREFIX = '-o-'; break;
          case BrowserType.OTHER: CSS_PREFIX = ''; break;
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
            TRANSITION_END: (browser == BrowserType.WEBKIT) ? 'webkitTransitionEnd' :
                            (browser == BrowserType.OPERA) ? 'oTransitionEnd' : 'transitionend',
                                                                      // im not sure about these..
            ORIENTATION_CHAGE: 'orientationchange',
            CLICK: 'click'
        };

        /** @return {String} */
        function getCssTranslateValue (translateX/** @type{Number|String} */) {
            return [TRANSLATE_PREFIX, translateX, TRANSLATE_SUFFIX].join('')
        }

        // ==== Each execution ====

        return this['each'](function () {

            // initializing variables
            var $flickBox = jQuery(this),
                $container = jQuery('.container', $flickBox)['css']({
                    overflow: 'hidden'
                }),
                $box = jQuery('.containerInner', $container)['css']({
                    position: 'relative',
                    overflow: 'hidden',
                    top: 0,
                    left: 0
                }),
                $items = jQuery('.item', $box)['css']({
                    'float': 'left'
                }),
                item_length = $items['length'],
                item_width = $items.outerWidth(true),
                box_width = item_width * item_length,
                box_height = $items.outerHeight(true),
                minLeft = 0,
                maxLeft = ((item_width * item_length) - item_width) * -1,
                cd = 0,

            // currently displayed
                containerOffsetLeft = $container['offset']()['left'],
                containerBaseX = 0; // left offset (needed to orientationing)
            $container.height(box_height).scroll(function () {
                jQuery(this).scrollLeft(0);
            });
            $box.height(box_height).width(box_width)
                ['css'](CSS_TRANSFORM, getCssTranslateValue(getTranslateX()));

            // **** define left offset ****
            function redefineLeftOffset(e) {
                containerBaseX = ($container.innerWidth() - item_width) / 2;
                moveToIndex(cd);
            }
            window.addEventListener(EventType.ORIENTATION_CHAGE, redefineLeftOffset, false);
            redefineLeftOffset();

            // **** navigation behavior ****
            var $nav = jQuery('.nav', $flickBox),
                $nav_a = $nav.find('a[href^=#]'),
                $nav_children = $nav_a.parent();
            var useNav = !!($nav['length'] && $nav_a['length'] && $nav_children['length']);
            if (useNav) {
                $nav_children['eq'](0)['addClass']('selected');
                $nav_a.bind(EventType.START, function (e) {
                    var index = $nav_a.index(this);
                    moveToIndex(index);
                    return false;
                }).bind(EventType.CLICK, function () {
                    return false;
                });
            }

            // **** box behavior **** 
            var box = $box[0];
            box.addEventListener(EventType.MOVE, touchHandler, false);
            box.addEventListener(EventType.START, touchHandler, false);
            box.addEventListener(EventType.END, touchHandler, false);
            box.addEventListener(EventType.TRANSITION_END, transitionEndHandler, false);

            // **** back and forth arrows behavior (optional) ****
            var $prev = jQuery('.prev', $flickBox),
                $next = jQuery('.next', $flickBox);
            var useArrows = !!($prev['length'] && $next['length']);
            if (useArrows) {
                function prevTappedHandler() {
                    cd = (cd > 0) ? cd - 1 : options['infinitCarousel'] ? item_length - 1 : cd;
                    moveToIndex(cd);
                }

                function nextTappedHandler() {
                    cd = (cd < item_length - 1) ? cd + 1 :
                        options['infinitCarousel'] ? 0 : cd;
                    moveToIndex(cd);
                }

                function disableArrow() {
                    $prev.add($next)['removeClass']('off');

                    if (cd === 0) {
                        $prev['addClass']('off');
                    } else if (cd === item_length - 1) {
                        $next['addClass']('off');
                    }
                }
                
                $prev.bind(EventType.START, prevTappedHandler);
                $next.bind(EventType.START, nextTappedHandler);
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
                            $box['css'](CSS_TRANSFORM,
                                getCssTranslateValue(startLeft + diffX));
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
                          $box['removeClass']('moving')['css'](CSS_TRANSFORM,
                              getCssTranslateValue(containerBaseX + startLeft));
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

            /** @param {Number?} opt_cd */
            function moveToIndex(opt_cd) {

                $box['addClass']('moving');

                var l = getTranslateX();
                if (typeof(opt_cd) == 'number') {
                    cd = opt_cd;
                } else {
                    var endTime = (new Date()).getTime(),
                        timeDiff = endTime - startTime,
                        distanceX = endX - startX;

                    if (timeDiff < 300 && Math.abs(distanceX) > 30) {
                        distanceX > 0 ? cd-- : cd++;
                    } else {
                        var d = Math.abs((minLeft + l) - containerBaseX - item_width / 2);
                        cd = Math.floor(d / item_width);
                    }
                }

                if (cd > item_length - 1) {
                    cd = item_length - 1;
                } else if (cd < 0) {
                    cd = 0;
                }

                // detect right position to fit
                $box['css'](CSS_TRANSFORM,
                    getCssTranslateValue(containerBaseX + item_width * cd * -1));

                if (useNav) {
                    $nav_children['removeClass']('selected')['eq'](cd)['addClass']('selected');
                }
                if (useArrows) {
                    disableArrow();
                }
            }

            // ==== internal functions ====

            /** @return {Number} */
            function getTranslateX () {
                return $box['offset']()['left'];
            }
        });
    };
})(window['jQuery']);

