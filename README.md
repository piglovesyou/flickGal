# flickGal
![flickGal](https://raw.github.com/piglovesyou/flickGal/master/src/title.png)

A light weight jQuery plugin to implement flick gallery for smart phone.

## Features
Main features of this plugin are:
- Light weight. (3.4k)
- Designer friendly. (HTML based)

This plugin __cannot__ do:
- Vertical flick scroll (who ever wants?)
- Auto scrolling with timer. This will need a lot of options that I don't like.

## Demo

Here is a quick demo.

http://stakam.net/jquery/flickgal/demo

Tested on iOS Safari and Android 4.0. PC browsers? Yeah. IE? Na.


## Download
[Right click on this link](https://raw.github.com/piglovesyou/flickGal/master/jquery.flickgal.min.js) or you can just clone this project.


## How to use
Only 3 steps!
### 1. Build HTML like below.
```html
<div class="yourElement"><!-- Main container -->

  <div class="container"><!-- Flickable elements container (required) -->
    <div class="containerInner"><!-- (required) -->
      <div id="sea01" class="item"><img alt="" src="images/sea/01.jpg" /></div><!-- must have `item' for class name -->
      <div id="sea02" class="item"><img alt="" src="images/sea/02.jpg" /></div>
      <div id="sea03" class="item"><img alt="" src="images/sea/03.jpg" /></div>
    </div>
  </div>

  <div class="nav"><!-- Tab, indicator or something like that (optional) -->
    <ul>
      <li class="sea01"><a href="#sea01">・</a></li>
      <li class="sea02"><a href="#sea02">・</a></li>
      <li class="sea03"><a href="#sea03">・</a></li>
    </ul>
  </div>

  <div class="arrows"><!-- Next and prev buttons (optional) -->
    <span class="prev">Previous</span><!-- must have `prev' for className -->
    <span class="next">Next</span><!-- must have `next' for className -->
  </div>

</div>
```

### 2. Write CSS.
```css
.yourElement .item { width: 200px } /* This is required if you have <img> element in .item element. */
.yourElement .moving {
  /* You can change transition-duration of course. */
  transition: transform .2s ease-out;
  -webkit-transition: -webkit-transform .2s ease-out;
  -moz-transition: -moz-transform .2s ease-out;
}
```

### 3. Include javascripts and run.
```html
<script src="./javascripts/jquery-1.4.3.min.js"></script>
<script src="./javascripts/jquery.flickgal.js"></script>
<script>
$(function(){
  $(".yourElement").flickGal();
});
</script>
```

## Available options
```javascript
$(function(){
  $(".yourElement").flickGal({
    infinitCarousel : false,
    lockScroll      : true
  });
});
```
| Options | Default value | Description |
| ------------ | ------------- | ------------ |
| infinitCarousel | false  | If true and you have prev/next elements, the last item slides to the first item and vise versa.  |
| lockScroll | true  | Lock horizontal scroll while sliding. If you have large images in .item element, you may want this fasle. |


## Advanced use
FlickGal provides 3 custom events.
```javascript
$(function(){
  $(".yourElement").flickGal()
    .on('fg_flickstart', function (e, index) {
      // Emitted when a user starts flicking.

    }).on('fg_flickend', function (e, index) {
      // Emitted when a user ends flicking.

    }).on('fg_change', function (e, index) {
      // Emitted when the item on center changed.
    });
});
```


## Lisence
```
Copyright (c) 2012 Soichi Takamura (http://stakam.net/)
Dual licensed under the MIT and GPL licenses:
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
```
