'use strict';

var appendPrefixPreventingSubstitutionByGruntReplaceAndUglify = function (value) {
  return '@@' + value;
};
var variableNameThatShouldNotBeReplaced = appendPrefixPreventingSubstitutionByGruntReplaceAndUglify('___ENV_REPLACE_WORKAROUND___');
var replaceTaskInvoked = variableNameThatShouldNotBeReplaced !== '@@___ENV_REPLACE_WORKAROUND___';

angular
  .module('amvSystemDemoUi', [
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
  .factory('amvDemoVehicle', [function () {
    var vehicleMoves = Math.random() >= 0.3 ? true : false;
    var fuelLevel = Math.round(2 + Math.random() * 59);
    var speed = Math.round((vehicleMoves ? Math.random() * 100 : 0) * 10) / 10;

    return {
      id: -1,
      name: 'Demo Vehicle',
      location: {
        lat: Math.round((49.301369 + Math.random() / 100) * 1000000) / 1000000,
        lng: Math.round((8.638769 + Math.random() / 100) * 1000000) / 1000000
      },
      provider: 'amv networks',
      requestTime: Date.now(),
      date: Date.now(),
      data: {
        speed: speed,
        states: [{
          param: 'vbat',
          value: 12.3
        }, {
          param: 'move',
          value: vehicleMoves ? 1 : 0
        }, /*{
         param: 'gsmt',
         value: Math.round(5 + Math.random() * 25 * 10) / 10
         }*/],
        xfcds: [{
          param: 'kmrd',
          value: 1337
        }, {
          param: 'atmp',
          value: Math.round(-5 + Math.random() * 40 * 10) / 10
        }, {
          param: 'fcon',
          value: Math.round(Math.random() * 15 * 10) / 10
        }, {
          param: 'hbrk',
          value: vehicleMoves ? 0 : (Math.random() > 0.5 ? 1 : 0)
        }, {
          param: 'wrlt',
          value: (Math.random() > 0.1 ? 1 : 0)
        }, {
          param: 'flev',
          value: Math.round(2 + Math.random() * 59)
        }, {
          param: 'chrp',
          value: vehicleMoves ? 0 : (Math.random() > 0.5 ? 1 : 0)
        }, {
          param: 'range',
          value: fuelLevel * 15
        }, {
          param: 'appe',
          value: Math.min(100, Math.round(Math.random() * speed))
        }]
      }
    };
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
  .factory('amvSystemDemoUiSettingsTemplate', function () {
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
      enableDemoMode: true,
      enableStreamingUpdates: false,
      enablePeriodicUpdateInterval: true,
      periodicUpdateIntervalInSeconds: 60,
      debug: false
    };
  })
  .factory('amvSystemDemoUiSettings', ['SettingsResource', 'amvSystemDemoUiSettingsTemplate', function (SettingsResource, amvSystemDemoUiSettingsTemplate) {
    return {
      get: function () {
        return SettingsResource.findAll().then(function (settingsArray) {
          if (settingsArray.length !== 1) {
            throw new Error('Cannot find settings.');
          } else {
            var settings = _.defaults({}, settingsArray[0]);
            return _.defaults(settings, amvSystemDemoUiSettingsTemplate);
          }
        });
      }
    };
  }])
  .factory('amvClientFactory', ['amvTrafficsoftRestJs', 'amvSystemDemoUiSettings', function (amvTrafficsoftRestJs, amvSystemDemoUiSettings) {
    return {
      get: function () {
        return amvSystemDemoUiSettings.get().then(function (settings) {
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
      .state('canparams', {
        url: '/can-params',
        templateUrl: 'views/page/can-params.html',
        controller: 'CanParamsCtrl',
        controllerAs: 'canParams'
      })
      .state('stateparams', {
        url: '/state-params',
        templateUrl: 'views/page/state-params.html',
        controller: 'StateParamsCtrl',
        controllerAs: 'stateParams'
      })
      .state('vehicle', {
        url: '/vehicle-detail/:id',
        templateUrl: 'views/page/vehicle-detail.html',
        controller: 'VehicleDetailCtrl',
        controllerAs: 'vehicleDetail',
        resolve: {
          amvVehicleId: ['$stateParams', function ($stateParams) {
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
  .run(['$timeout', 'Materialize', 'amvSystemDemoUiSettings', function ($timeout, Materialize, amvSystemDemoUiSettings) {

    Materialize.toast('Welcome to the amv System Demo Application.', 5000);

    amvSystemDemoUiSettings.get()
      .then(function (settings) {
        $timeout(function () {
          if (settings.enableDemoMode) {
            Materialize.toast('Demonstration mode is enabled. ', 5000);
          }
          $timeout(function () {
            if (settings.enableStreamingUpdates) {
              Materialize.toast('Streaming data is enabled. ', 5000);
            }
          }, 3000);
        }, 3000);
      })
      .catch(function () {
        $timeout(function () {
          Materialize.toast('Demonstration mode is enabled. Play around!', 7000);

          $timeout(function () {
            Materialize.toast('... or adapt the application settings and use your own data :D', 8000);
          }, 5000);
        }, 2000);
      });
  }])
  .controller('TopNavigationController', ['amvGitInfo', function (amvGitInfo) {
    this.gitinfo = angular.copy(amvGitInfo);
  }]);
