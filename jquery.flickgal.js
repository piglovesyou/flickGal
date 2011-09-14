/*****************************************************************************
 jQuery flickGal 1.0.1
 
 Copyright (c) 2011 Soichi Takamura (http://stakam.net/jquery/flickgal/demo.html)
 
 Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
 
 **************************************************************************** */
(function (jQuery) {

    jQuery.fn.flickGal = function (options) {

        var options = jQuery.extend({
            infinitCarousel: false,
            lockScroll: true
        }, options);

        // ==== Common functions and variables ====

        /** @return {String} */
        function getTranslateValue (translateX/** @type{Number|String} */) {
            return ['translate3d(', translateX, 'px,0,0)'].join('')
        }

        // Events occur on eigher iphone or pc
        var userAgent = navigator.userAgent.toLowerCase();
        var isMobile = !!(userAgent.search(/iphone/) >= 0 || userAgent.search(/ipad/) >= 0);
        /** @enum {String} */
        var EventType = {
            START: isMobile ? 'touchstart' : 'mousedown',
            END: isMobile ? 'touchend' : 'mouseup',
            MOVE: isMobile ? 'touchmove' : 'mousemove'
        };

        // ==== Each execution ====

        return this.each(function () {

            // initializing variables
            var $flickBox = $(this),
                $container = $('.container', $flickBox).css({
                    overflow: 'hidden'
                }),
                $box = $('.containerInner', $container).css({
                    position: 'relative',
                    overflow: 'hidden',
                    top: 0,
                    left: 0
                }),
                $items = $('.item', $box).css({
                    float: 'left'
                }),
                item_length = $items.length,
                item_width = $items.outerWidth(true),
                box_width = item_width * item_length,
                box_height = $items.outerHeight(true),
                minLeft = 0,
                maxLeft = ((item_width * item_length) - item_width) * -1,
                cd = 0,

            // currently displayed
                containerOffsetLeft = $container.offset().left,
                containerBaseX = 0; // left offset (needed to orientationing)
            $container.height(box_height).scroll(function () {
                $(this).scrollLeft(0);
            });
            $box.height(box_height).width(box_width)
                .css('-webkit-transform', getTranslateValue(getTranslateX()));

            // **** define left offset ****
            function redefineLeftOffset(e) {
                containerBaseX = ($container.innerWidth() - item_width) / 2;
                moveToIndex(cd);
            }
            window.addEventListener('orientationchange', redefineLeftOffset, false);
            redefineLeftOffset();

            // **** navigation behavior ****
            var $nav = $('.nav', $flickBox),
                $nav_a = $nav.find('a[href^=#]'),
                $nav_children = $nav_a.parent();
            var useNav = ($nav.length && $nav_a.length && $nav_children.length) ? true : false;
            if (useNav) {
                $nav_children.eq(0).addClass('selected');
                $nav_a.bind(EventType.START, function (e) {
                    var i = $nav_a.index(this);
                    moveToIndex(i);
                    return false;
                }).bind('click', function () {
                    return false;
                });
            }

            // **** box behavior **** 
            var box = $box[0];
            box.addEventListener(EventType.MOVE, touchHandler, false);
            box.addEventListener(EventType.START, touchHandler, false);
            box.addEventListener(EventType.END, touchHandler, false);
            box.addEventListener('webkitTransitionEnd', finishAnimation, false);

            // **** back and forth arrows behavior (optional) ****
            var $prev = $('.prev', $flickBox),
                $next = $('.next', $flickBox);
            var useArrows = !!($prev.length && $next.length);
            if (useArrows) {
                function prevTappedHandler() {
                    cd = (cd > 0) ? cd - 1 : options.infinitCarousel ? item_length - 1 : cd;
                    moveToIndex(cd);
                }

                function nextTappedHandler() {
                    cd = (cd < item_length - 1) ? cd + 1 : options.infinitCarousel ? 0 : cd;
                    moveToIndex(cd);
                }

                function disableArrow() {
                    $prev.add($next).removeClass('off');

                    if (cd === 0) {
                        $prev.addClass('off');
                    } else if (cd === item_length - 1) {
                        $next.addClass('off');
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
                        if (options.lockScroll) e.preventDefault();
                        if (isMoving) {
                            var diffX = containerBaseX + touch.pageX - startX;
                            $box.css('-webkit-transform', getTranslateValue(startLeft + diffX));
                        }
                        break;

                // ############# touchStart
                    case EventType.START:
                        isMoving = true;

                        startTime = (new Date()).getTime();
                        startX = isMobile ? touch.pageX : e.clientX;
                        startLeft = getTranslateX() - containerOffsetLeft - containerBaseX;

                        if ($box.hasClass('moving')) {
                          $box.removeClass('moving')
                              .css('-webkit-transform', getTranslateValue(containerBaseX + startLeft));
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

            function finishAnimation() {
                $box.removeClass('moving');
            }

            // ==== function - scrolling box to fit to grid ====

            function moveToIndex(_cd) {

                $box.addClass('moving');

                var l = getTranslateX();
                if (typeof(_cd) == 'number') {
                    cd = _cd;
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
                $box.css('-webkit-transform', getTranslateValue(containerBaseX + item_width * cd * -1));

                if (useNav) {
                  $nav_children.removeClass('selected').eq(cd).addClass('selected');
                }
                if (useArrows) {
                  disableArrow();
                }
            }

            // ==== internal functions ====

            /** @return {Number} */
            function getTranslateX () {
                return $box.offset().left;
            }
        });

    };
})(jQuery);

