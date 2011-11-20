###

 jQuery flickGal 1.1.9
 
 Copyright (c) 2011 Soichi Takamura (http://stakam.net/jquery/flickgal/demo.html)
 
 Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
 
###


###
  init variables about browsers environment
###
BrowserType =
  WEBKIT: 0
  GECKO: 1
  MSIE: 2
  OPERA: 3
  OTHER: 4

userAgent = navigator.userAgent.toLowerCase()

if userAgent.indexOf('webkit') >= 0
  currentBrowser = BrowserType.WEBKIT
else if userAgent.indexOf('gecko') >= 0
  currentBrowser = BrowserType.GECKO
else if userAgent.indexOf('msie') >= 0
  currentBrowser = BrowserType.MSIE
else if userAgent.indexOf('opera') >= 0
  currentBrowser = BrowserType.OPERA
else
  currentBrowser = BrowserType.OTHER

isMobile = userAgent.indexOf('iphone') >= 0 or userAgent.indexOf('ipad') >= 0 or userAgent.indexOf('android') >= 0

switch currentBrowser
  when BrowserType.WEBKIT
    CSS_PREFIX = '-webkit-'
  when BrowserType.GECKO
    CSS_PREFIX = '-moz-'
  when BrowserType.MSIE
    CSS_PREFIX = '-ms-'
  when BrowserType.OPERA
    CSS_PREFIX = '-o-'
  when BrowserType.OTHER
    CSS_PREFIX = ''

CSS_TRANSITION = CSS_PREFIX + 'transition'
CSS_TRANSFORM = CSS_PREFIX + 'transform'
CSS_TRANSFORM_ORIGIN = CSS_PREFIX + 'transform-origin'
TRANSLATE_PREFIX = if currentBrowser == BrowserType.WEBKIT then 'translate3d(' else 'translate('
TRANSLATE_SUFFIX = if currentBrowser == BrowserType.WEBKIT then 'px,0,0)' else 'px,0)'

EventType =
  START: if isMobile then 'touchstart' else 'mousedown'
  END: if isMobile then 'touchend' else 'mouseup'
  MOVE: if isMobile then 'touchmove' else 'mousemove'
  TRANSITION_END: if currentBrowser == BrowserType.WEBKIT then 'webkitTransitionEnd' else if currentBrowser == BrowserType.OPERA then 'oTransitionEnd' else 'transitionend'
  ORIENTATION_CHAGE: 'orientationchange'
  CLICK: 'click'
  RESIZE: 'resize'


###
  common function
###
getCssTranslateValue = (translateX) ->
  [ TRANSLATE_PREFIX, translateX, TRANSLATE_SUFFIX ].join ''


###
  implement plugin
###
window['jQuery']['fn']['flickGal'] = (options) ->


  ###
    option
  ###
  options = $['extend'](
    'infinitCarousel': false
    'lockScroll': true
  , options)
  

  ###
    iterate each element in jQuery object
  ###
  this['each'] ->


    ###
      private variables
    ###
    $flickBox = $(this)
    $container = $('.container', $flickBox)['css'](overflow: 'hidden')
    $box = $('.containerInner', $container)['css'](
      position: 'relative'
      overflow: 'hidden'
      top: 0
      left: 0
    )
    $items = $('.item', $box)['css']('float': 'left')
    itemLength = $items['length']
    itemWidth = $items['outerWidth'](true)
    boxWidth = itemWidth * itemLength
    boxHeight = $items['outerHeight'](true)
    minLeft = 0
    maxLeft = ((itemWidth * itemLength) - itemWidth) * -1
    cd = 0 # currently displayed index
    containerOffsetLeft = 0
    containerBaseX = 0


    ###
      private functions
    ###
    getGeckoTranslateX = ($elm) ->
      try
        translateX = window['parseInt'](/(,.+?){3} (.+?)px/.exec($elm['css'](CSS_TRANSFORM))[2])
        return if not window['isNaN'](translateX) then translateX + containerOffsetLeft else 0
      0
    
    getTranslateX = ->
      if currentBrowser isnt BrowserType.GECKO
        $box['offset']()['left']
      else getGeckoTranslateX($box)
    
    redefineLeftOffset = (e) ->
      containerOffsetLeft = $container['offset']()['left']
      containerBaseX = ($container['innerWidth']() - itemWidth) / 2
      moveToIndex cd
    

    ###
      implement navigation
    ###
    $nav = $('.nav', $flickBox)
    $navA = $nav['find']('a[href^=#]')
    $navChildren = $navA['parent']()
    useNav = !!($nav['length'] and $navA['length'] and $navChildren['length'])


    ###
      implement next/prev arrows
    ###
    $prev = $('.prev', $flickBox)
    $next = $('.next', $flickBox)
    useArrows = !!($prev['length'] and $next['length'])
    if useArrows
      prevTappedHandler = ->
        cd = if cd > 0 then cd - 1 else if options['infinitCarousel'] then itemLength - 1 else cd
        moveToIndex cd
      
      nextTappedHandler = ->
        cd = if cd < itemLength - 1 then cd + 1 else if options['infinitCarousel'] then 0 else cd
        moveToIndex cd
      
      disableArrow = ->
        $prev.add($next)['removeClass'] 'off'
        if cd == 0
          $prev['addClass'] 'off'
        else $next['addClass'] 'off'  if cd == itemLength - 1


    ###
      implement core event handling
    ###
    startX = 0
    endX = 0
    startTime = 0
    startLeft = 0
    isMoving = false
    touchHandler = (e) ->
      touch = if isMobile then e.touches[0] else e
      switch e.type
        when EventType.MOVE
          console.log options['lockScroll']
          e.preventDefault()  if options['lockScroll']
          if isMoving
            diffX = containerBaseX + touch.pageX - startX
            $box['css'] CSS_TRANSFORM, getCssTranslateValue(startLeft + diffX)
        when EventType.START
          e.preventDefault()  unless isMobile
          isMoving = true
          startTime = (new Date()).getTime()
          startX = if isMobile then touch.pageX else e.clientX
          startLeft = getTranslateX() - containerOffsetLeft - containerBaseX
          $box['removeClass']('moving')['css'] CSS_TRANSFORM, getCssTranslateValue(containerBaseX + startLeft)  if $box['hasClass']('moving')
        when EventType.END
          startLeft = 0
          isMoving = false
          endX = if isMobile then e.changedTouches[0].pageX else e.clientX
          moveToIndex()
    
    transitionEndHandler = ->
      $box['removeClass'] 'moving'
    
    moveToIndex = (opt_cd) ->
      $box['addClass'] 'moving'
      if typeof (opt_cd) == 'number'
        cd = opt_cd
      else
        endTime = new Date().getTime()
        timeDiff = endTime - startTime
        distanceX = endX - startX
        if timeDiff < 300 and Math.abs(distanceX) > 30
          if distanceX > 0 then cd-- else cd++
        else
          currX = getTranslateX() - containerOffsetLeft
          d = Math.abs((minLeft + currX) - containerBaseX - itemWidth / 2)
          cd = Math.floor(d / itemWidth)
      if cd > itemLength - 1
        cd = itemLength - 1
      else cd = 0  if cd < 0
      $box['css'] CSS_TRANSFORM, getCssTranslateValue(containerBaseX + itemWidth * cd * -1)
      $navChildren['removeClass']('selected')['eq'](cd)['addClass'] 'selected'  if useNav
      disableArrow()  if useArrows


    ###
      initialize base variable and bind events
    ###
    $container['height'](boxHeight)['scroll'] ->
      $(this)['scrollLeft'] 0
    
    $box['height'](boxHeight)['width'](boxWidth)['css'] CSS_TRANSFORM, getCssTranslateValue(getTranslateX())

    $(window)['bind'] (if isMobile then EventType.ORIENTATION_CHAGE else EventType.RESIZE), redefineLeftOffset
    redefineLeftOffset()

    if useNav
      $navChildren['eq'](0)['addClass'] 'selected'
      $navA['bind'](EventType.START, (e) ->
        index = $navA['index'](this)
        moveToIndex index
        false
      )['bind'] EventType.CLICK, ->
        false

    if useArrows
      $prev['bind'] EventType.START, prevTappedHandler
      $next['bind'] EventType.START, nextTappedHandler
      disableArrow()

    touchEvents = [ EventType.MOVE, EventType.START, EventType.END ]
    if isMobile
      box = $box[0]
      $['each'] touchEvents, (i, e) ->
        box.addEventListener e, touchHandler, false
      box.addEventListener EventType.TRANSITION_END, transitionEndHandler, false
    else
      $box['bind'](touchEvents.join(' '), touchHandler)['bind'] EventType.TRANSITION_END, transitionEndHandler

