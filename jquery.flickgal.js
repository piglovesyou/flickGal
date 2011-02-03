/*****************************************************************************
 jQuery flickGal 1.0.1
 
 Copyright (c) 2011 Soichi Takamura (http://stakamura.me/jquery/flickgal/demo.html)
 
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

        return this.each(function () {

            // initializing
            var $flickBox = $(this),
                $container = $(".container", $flickBox).css({
                    overflow: "hidden"
                }),
                $box = $(".containerInner", $container).css({
                    position: "relative",
                    overflow: "hidden",
                    top: 0,
                    left: 0
                }),
                $items = $(".item", $box).css({
                    float: "left"
                }),
                item_length = $items.length,
                item_width = $items.outerWidth(true),
                box_width = item_width * item_length,
                box_height = $items.outerHeight(true),
                minLeft = 0,
                maxLeft = ((item_width * item_length) - item_width) * -1,
                eventIndex = 0,
                cd = 0,
                // currently displayed
                containerOffsetLeft = $container.offset().left,
                containerBaseX = 0; // left offset (needed to orientationing)
            $container.height(box_height).scroll(function () {
                $(this).scrollLeft(0);
            });
            $box.height(box_height).width(box_width).css({
                "-webkit-transform": "translate3d(" + getTranslateX() + "px,0,0)"
            });

            // events occur on eigher iphone or pc
            var eventStr = [{
                s: "mousedown",
                e: "mouseup",
                m: "mousemove"
            }, {
                s: "touchstart",
                e: "touchend",
                m: "touchmove"
            }];
            var userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.search(/iphone/) >= 0 || userAgent.search(/ipad/) >= 0) eventIndex = 1;

            // **** define left offset ****

            function redefineLeftOffset(e) {
                containerBaseX = ($container.innerWidth() - item_width) / 2;
                moveToIndex(cd);
            }
            window.addEventListener("orientationchange", redefineLeftOffset, false);
            redefineLeftOffset();

            // **** navigation behavior ****
            var $nav = $(".nav", $flickBox),
                $nav_a = $nav.find("a[href^=#]"),
                $nav_children = $nav_a.parent();
            var ifNavExists = ($nav.length && $nav_a.length && $nav_children.length) ? true : false;
            if (ifNavExists) {
                $nav_children.eq(0).addClass("selected");
                $nav_a.bind(eventStr[eventIndex]["s"], function (e) {
                    var i = $nav_a.index(this);
                    moveToIndex(i);
                    return false;
                }).bind("click", function () {
                    return false;
                });
            }

            // **** box behavior **** 
            var box = $box[0];
            box.addEventListener(eventStr[eventIndex]["m"], touchHandler, false);
            box.addEventListener(eventStr[eventIndex]["s"], touchHandler, false);
            box.addEventListener(eventStr[eventIndex]["e"], touchHandler, false);
            box.addEventListener("webkitTransitionEnd", finishAnimation, false);

            // **** back and forth arrows behavior (optional) ****
            var $prev = $(".prev", $flickBox),
                $next = $(".next", $flickBox);
            var ifArrowsExists = ($prev.length && $next.length) ? true : false;
            if (ifArrowsExists) {
                function prevTappedHandler() {
                    cd = (cd > 0) ? cd - 1 : (options.infinitCarousel) ? item_length - 1 : cd;
                    moveToIndex(cd);
                }

                function nextTappedHandler() {
                    cd = (cd < item_length - 1) ? cd + 1 : (options.infinitCarousel) ? 0 : cd;
                    moveToIndex(cd);
                }

                function attatchOfftoArrows() {
                    $prev.add($next).removeClass("off");

                    if (cd === 0) {
                        $prev.addClass("off");
                    } else if (cd === item_length - 1) {
                        $next.addClass("off");
                    }
                }
                
                $prev.bind(eventStr[eventIndex]["s"], prevTappedHandler);
                $next.bind(eventStr[eventIndex]["s"], nextTappedHandler);
                attatchOfftoArrows();
            }

            // ==== function - touch event handler ====
            var startX = 0,
                endX = 0,
                startTime = 0,
                startLeft = 0,
                ifMouseDown = 0,
                ifDefaultPrevented = 0;

            function touchHandler(e) {

                var touch = (eventIndex) ? e.touches[0] : e;

                // ############# touchMove
                if (e.type === eventStr[eventIndex]["m"]) {
                    if (ifDefaultPrevented === 0 && options.lockScroll) e.preventDefault();
                    if (ifMouseDown) {
                        var diffX = containerBaseX + touch.pageX - startX;
                        $box.css({
                            "-webkit-transform": ["translate3d(", startLeft + diffX, "px,0,0)"].join("")
                        });
                    }

                // ############# touchStart
                } else if (e.type === eventStr[eventIndex]["s"]) {
                    ifMouseDown = 1;

                    startTime = (new Date()).getTime();
                    startX = (eventIndex) ? touch.pageX : e.clientX;
                    startLeft = getTranslateX() - containerOffsetLeft - containerBaseX;

                    if ($box.hasClass('moving')) {
                        $box.removeClass('moving').css({
                            "-webkit-transform": ["translate3d(", containerBaseX + startLeft, "px,0,0)"].join("")
                        });
                    }

                // ############# touchEnd
                } else if (e.type === eventStr[eventIndex]["e"]) {
                    startLeft = ifMouseDown = ifDefaultPrevented = 0;
                    endX = (eventIndex) ? e.changedTouches[0].pageX : e.clientX;
                    moveToIndex();
                }
            }

            // ==== function - when the animation finished ====

            function finishAnimation() {
                $box.removeClass("moving");
            }

            // ==== function - scrolling box to fit to grid ====

            function moveToIndex(_cd) {

                $box.addClass("moving");

                var l = getTranslateX(); //parseInt($box.css("left"));
                if (typeof(_cd) == "number") cd = _cd;
                else {
                    var endTime = (new Date()).getTime();
                    var timeDiff = endTime - startTime;
                    var distanceX = endX - startX;

                    if (timeDiff < 300 && Math.abs(distanceX) > 30) {
                        if (distanceX > 0) cd--;
                        else cd++;
                    } else {
                        var d = Math.abs((minLeft + l) - containerBaseX - item_width / 2);
                        cd = Math.floor(d / item_width);
                    }
                }

                if (cd > item_length - 1) cd = item_length - 1;
                else if (cd < 0) cd = 0;

                // detect right position to fit
                $box.css({
                    "-webkit-transform": ["translate3d(", containerBaseX + item_width * cd * -1, "px,0,0)"].join("")
                });

                if (ifNavExists) $nav_children.removeClass("selected").eq(cd).addClass("selected");
                if (ifArrowsExists) attatchOfftoArrows();
            }

            // ==== function - getTranslateX ====

            function getTranslateX() {
                return $box.offset().left;
            }
        });

    };
})(jQuery);