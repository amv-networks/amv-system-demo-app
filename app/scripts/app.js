'use strict';

var appendPrefixPreventingSubstitutionByGruntReplaceAndUglify = function (value) {
  return '@@' + value;
};
var variableNameThatShouldNotBeReplaced = appendPrefixPreventingSubstitutionByGruntReplaceAndUglify('___ENV_REPLACE_WORKAROUND___');
var replaceTaskInvoked = variableNameThatShouldNotBeReplaced !== '@@___ENV_REPLACE_WORKAROUND___';

/**
 * @ngdoc overview
 * @name amvGeolocationUi
 * @description
 * # amvGeolocationUi
 *
 * Main module of the application.
 */
angular
  .module('amvGeolocationUi', [
    'ngAnimate',
    /*'ngAria',*/
    'ngCookies',
    'ngMessages',
    'ngSanitize',
    'ngTouch',
    'ui.router',
    'ui-leaflet',
    'knalli.angular-vertxbus',
    'js-data'
  ])
  .factory('Materialize', ['$window', function ($window) {
    return $window.Materialize;
  }])
  .factory('amvTrafficsoftRestJs', ['$window', function ($window) {
    return $window.amvTrafficsoftRestJs;
  }])
  .factory('DSLocalForageAdapter', ['$window', function ($window) {
    return $window.DSLocalForageAdapter;
  }])
  .run(['DS', 'DSLocalForageAdapter', function (DS, DSLocalForageAdapter) {
    var localForageAdapter = new DSLocalForageAdapter();
    DS.registerAdapter('localForage', localForageAdapter, {default: true});
  }])
  .factory('SettingsResource', ['DS', function (DS) {
    return DS.defineResource('SettingsResource');
  }])

  .factory('amvApplicationInfo', [function () {
    if (replaceTaskInvoked) {
      return {
        version: '@@___ENV_APP_VERSION___'
      };
    }
    return {
      version: 'dev'
    };
  }])
  .factory('amvGitInfo', function () {
    if (replaceTaskInvoked) {
      return {
        local: {
          branch: {
            shortSHA: '@@___ENV_GITINFO_SHORT_SHA___',
            name: '@@___ENV_GITINFO_BRANCH_NAME___',
            lastCommitNumber: '@@___ENV_GITINFO_LAST_COMMIT_NUMBER___'
          }
        },
        remote: {
          origin: {
            url: '@@___ENV_GITINFO_REMOTE_URL___'
          }
        }
      };
    }

    return {
      local: {
        branch: {
          shortSHA: '${shortSHA}',
          name: '${branchName}',
          lastCommitNumber: '${lastCommitNumber}'
        }
      },
      remote: {
        origin: {
          url: '${remoteUrl}'
        }
      }
    };
  })
  .factory('amvClientSettingsTemplate', function () {
    return {
      api: {
        baseUrl: 'http://www.example.com',
        options: {
          contractId: 1,
          auth: {
            username: 'username',
            password: 'password',
          },
          vehicleIds: [1, 2, 3],
        }
      },
      enableStreamingUpdates: false,
      enablePeriodicUpdateInterval: true,
      periodicUpdateIntervalInSeconds: 60,
      debug: false
    };
  })
  .factory('amvClientSettings', ['SettingsResource', function (SettingsResource) {
    return {
      get: function () {
        return SettingsResource.findAll().then(function (settingsArray) {
          if (settingsArray.length !== 1) {
            throw new Error('Cannot find settings.');
          } else {
            return settingsArray[0];
          }
        });
      }
    };
  }])
  .factory('amvClientFactory', ['amvTrafficsoftRestJs', 'amvClientSettings', function (amvTrafficsoftRestJs, amvClientSettings) {
    return {
      get: function () {
        return amvClientSettings.get().then(function (settings) {
          return settings.api;
        }).then(function (apiSettings) {
          return amvTrafficsoftRestJs(apiSettings.baseUrl, apiSettings.options);
        });
      }
    };
  }])
  .factory('amvXfcdClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: function () {
        return amvClientFactory.get().then(function (factory) {
          return factory.xfcd();
        });
      }
    };
  }])
  .config(function (vertxEventBusProvider) {
    vertxEventBusProvider
      .enable()
      .useReconnect()
      .useUrlServer('http://geolocation.amv-networks.com')
      .useUrlPath('/eventbus');

    // for local development
    //vertxEventBusProvider.useUrlServer('http://localhost:8081');
  })
  .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');

    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: 'views/page/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'views/page/settings.html',
        controller: 'SettingsCtrl',
        controllerAs: 'settings'
      })
      .state('vehicle', {
        url: '/vehicle-detail/:id',
        templateUrl: 'views/page/vehicle-detail.html',
        controller: 'VehicleDetailCtrl',
        controllerAs: 'vehicleDetail',
        resolve: {
            amvVehicleId: ['$stateParams', function($stateParams) {
              return $stateParams.id;
            }]
        }
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/page/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      });
  }])

  .controller('TopNavigationController', ['amvGitInfo', function (amvGitInfo) {
    this.gitinfo = angular.copy(amvGitInfo);
  }]);
