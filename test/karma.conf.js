// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2016-01-11 using
// generator-karma 1.0.1

module.exports = function(config) {
  'use strict';

  var configuration = {
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      "jasmine"
    ],

    // list of files / patterns to load in the browser
    files: [
      'test/phantomjsPolyfills.js',
      // bower:js
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-aria/angular-aria.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-messages/angular-messages.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/Materialize/bin/materialize.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-simple-logger/dist/angular-simple-logger.js',
      'bower_components/leaflet/dist/leaflet-src.js',
      'bower_components/ui-leaflet/dist/ui-leaflet.js',
      'bower_components/sockjs-client/dist/sockjs.js',
      'bower_components/vertx3-eventbus-client/vertx-eventbus.js',
      'bower_components/angular-vertxbus/dist/angular-vertxbus.js',
      'bower_components/amv-trafficsoft-rest-js/dist/amv-trafficsoft-rest-js.js',
      'bower_components/js-data/dist/js-data.js',
      'bower_components/js-data-angular/dist/js-data-angular.js',
      'bower_components/localforage/dist/localforage.js',
      'bower_components/js-data-localforage/dist/js-data-localforage.js',
      'bower_components/moment/moment.js',
      'bower_components/angular-mocks/angular-mocks.js',
      // endbower
      "app/scripts/**/*.js",
      "test/mock/**/*.js",
      "test/spec/**/*.js"
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 9099,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    //browsers: [
    //  "PhantomJS"
    //],

    //browsers: ['Chrome', 'Firefox'],
    browsers: ['Chrome'],

    customLaunchers: {
      Chrome_without_security: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      },
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    // Which plugins to enable
    plugins: [
      'karma-chrome-launcher',
      "karma-jasmine"
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};
