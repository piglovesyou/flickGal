
muffin = require 'muffin'
Q = require 'q'
_ = require 'underscore'



option '-w', '--watch', 'continue to watch the files and rebuild them when they change'



# Start develop.
task 'build', 'Build coffeescripts.', (options) ->
  # options = _.defaults
  #   watch: true
  # , options
  muffin.run
    files: './**/*'
    options: options
    map:
      '.*?\/(jquery.flickgal).coffee': (matches) ->
        muffin.compileScript matches[0], "./#{matches[1]}.js", options



# Minify script for production use.
task 'minify', 'Minify script.', (options) ->
  muffin.run
    files: './**/*'
    options: options
    map: '(jquery.flickgal).js': (matches) ->
      q = muffin.readFile matches[0]
      Q.when q, (result) ->
        if _.isString result
          a = result.match(/\/\*[\s\S]+?\*\//)
          if a and a[0]
            licence = a[0]
            muffin.exec "java -jar ~/compiler.jar --js=#{matches[1]}.js --js_output_file=#{matches[1]}.min.js --compilation_level=ADVANCED_OPTIMIZATIONS --output_wrapper \"#{licence}\n(function(){%output%})();\""


