'use strict';

var appendPrefixPreventingSubstitutionByGruntReplaceAndUglify = function(value) {
  return '@@' + value;
};

var variableNameThatShouldNotBeReplaced = appendPrefixPreventingSubstitutionByGruntReplaceAndUglify('___ENV_REPLACE_WORKAROUND___');
var replaceTaskInvoked = variableNameThatShouldNotBeReplaced !== '@@___ENV_REPLACE_WORKAROUND___';

var copyArray = function(array) {
  return (array || []).slice(0);
};

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
  .factory('Materialize', ['$window', $window => $window.Materialize])
  .factory('jQuery', ['$window', $window => $window.jQuery])
  .factory('lodash', ['$window', $window => $window._])
  .factory('amvTrafficsoftRestJs', ['$window', $window => $window.amvTrafficsoftRestJs])
  .factory('DSLocalForageAdapter', ['$window', $window => $window.DSLocalForageAdapter])
  .run(['DS', 'DSLocalForageAdapter', (DS, DSLocalForageAdapter) => {
    var localForageAdapter = new DSLocalForageAdapter();
    DS.registerAdapter('localForage', localForageAdapter, {default: true});
  }])
  .factory('SettingsResource', ['DS', DS => DS.defineResource('SettingsResource')])
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
        baseUrl: 'https://www.example.com',
        options: {
          contractId: 1,
          auth: {
            username: 'demo',
            password: 'demo-password',
          }
        }
      },
      app: {
          vehicleIds: [],
      },
      enableDemoMode: true,
      enableStreamingUpdates: false,
      enablePeriodicUpdateInterval: true,
      periodicUpdateIntervalInSeconds: 60,
      debug: false
    };
  })
  .factory('amvSystemDemoUiSettings', ['$log', 'lodash', 'SettingsResource', 'amvSystemDemoUiSettingsTemplate',
    function ($log, lodash, SettingsResource, amvSystemDemoUiSettingsTemplate) {
    return {
      get: () => SettingsResource.findAll()
        .then(settingsArray => {
          if (settingsArray.length !== 1) {
            throw new Error('Cannot find settings.');
          } else {
            var settings = lodash.defaults({}, settingsArray[0]);
            return lodash.defaults(settings, amvSystemDemoUiSettingsTemplate);
          }
        }).catch(e => {
          $log.debug('Continue with default settings: ', e.message);
          return amvSystemDemoUiSettingsTemplate;
        })
    };
  }])
  .factory('amvTrafficsoftApiSettings', ['amvTrafficsoftRestJs', 'amvSystemDemoUiSettings', function (amvTrafficsoftRestJs, amvSystemDemoUiSettings) {
    return {
      get: () => amvSystemDemoUiSettings.get().then(settings => settings.api)
    };
  }])
  .factory('authContractId', ['amvTrafficsoftRestJs', 'amvSystemDemoUiSettings', function (amvTrafficsoftRestJs, amvSystemDemoUiSettings) {
    return {
      get: () => amvSystemDemoUiSettings.get()
        .then(settings => settings.api.options.contractId)
    };
  }])
  .factory('amvClientFactory', ['amvTrafficsoftRestJs', 'amvTrafficsoftApiSettings', function (amvTrafficsoftRestJs, amvTrafficsoftApiSettings) {
    return {
      get: () => {
        return amvTrafficsoftApiSettings.get()
        .then(apiSettings => {
          return amvTrafficsoftRestJs(apiSettings.baseUrl, apiSettings.options);
        });
      }
    };
  }])
  .factory('amvXfcdClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: () => {
        return amvClientFactory.get().then(factory => factory.xfcd());
      }
  };
  }])
  .factory('carSharingReservationClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: () => amvClientFactory.get().then(factory => {
        return factory.carSharingReservation();
      })
    };
  }])
  .factory('amvContractClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: () => amvClientFactory.get().then(factory => factory.contract())
    };
  }])
  .factory('amvVehicleIds', ['$log', 'amvSystemDemoUiSettings', 'amvContractClient', 'authContractId', 'amvDemoVehicle',
  function ($log, amvSystemDemoUiSettings, amvContractClient, authContractId, amvDemoVehicle) {
    var MAX_VEHICLE_IDS = 10;

    return {
      get: () => amvSystemDemoUiSettings.get()
       .then(settings => settings.app)
       .then(appSettings => appSettings.vehicleIds)
       .then(vehicleIdsSettings => {
           var filteringEnabled = vehicleIdsSettings.length > 0;
           var vehicleIdsFilter = copyArray(vehicleIdsSettings);

           return amvContractClient.get().then(client => authContractId.get()
             .then(contractId => client.fetchSubscriptions(contractId)))
             .then(response => response.data.subscriptions)
             .catch(e => {
               $log.warn('Error while fetching subscriptions.. continuing with demo subscriptions: ' + e.message);
               return [{
                 vehicleId: amvDemoVehicle.id,
                 from: '1970-01-01T12:00:00+01:00'
               }];
             })
             .then(subscriptions => (subscriptions || []).map(s => s.vehicleId))
             .then(vehicleIds => {
                 if (filteringEnabled) {
                     vehicleIdsFilter.push(amvDemoVehicle.id);
                     return vehicleIds.filter(vehicleId => vehicleIdsFilter.indexOf(vehicleId) >= 0);
                 }
                 return vehicleIds;
             })
             .then(vehicleIds => vehicleIds.slice(0, MAX_VEHICLE_IDS));
        })
      };
  }])

  .factory('amvDemoVehicle', [function () {
    var vehicleId = 1;
    var vehicleMoves = Math.random() >= 0.3 ? true : false;
    var fuelLevel = Math.round(2 + Math.random() * 59);
    var speed = Math.round((vehicleMoves ? Math.random() * 100 : 0) * 10) / 10;

    return {
      id: vehicleId,
      name: 'Demo Vehicle',
      location: {
        lat: Math.round((49.301369 + Math.random() / 100) * 1000000) / 1000000,
        lng: Math.round((8.638769 + Math.random() / 100) * 1000000) / 1000000
      },
      provider: 'amv networks',
      requestTime: Date.now(),
      date: Date.now(),
      reservations: [{
          'reservationId': 1,
          'vehicleId': vehicleId,
          'from': '2018-06-30T18:22:37.732Z',
          'until': '2018-06-30T18:22:37.732Z',
          'rfid': {
            'driverTagId': '0123456789abcdef'
          },
        }, {
          'reservationId': 2,
          'vehicleId': vehicleId,
          'from': '2018-06-30T18:22:37.732Z',
          'until': '2018-06-30T18:22:37.732Z',
          'btle': {
            'accessCertificateId': 'string',
            'appId': 'string',
            'mobileSerialNumber': 'string'
          },
        }],
      data: {
        timestamp: Date.now(),
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
            return parseInt($stateParams.id);
          }]
        }
      })
      .state('vehicle_reservation', {
        url: '/vehicle-reservation/:id',
        templateUrl: 'views/page/vehicle-reservation.html',
        controller: 'VehicleReservationCtrl',
        controllerAs: 'vehicleReservation',
        resolve: {
          amvVehicleId: ['$stateParams', function ($stateParams) {
            return parseInt($stateParams.id);
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
  .run(['$timeout', '$rootScope', 'Materialize', function($timeout, $rootScope, Materialize) {
    $rootScope.$on('$viewContentLoaded', function() {
      $timeout(() => {
        // fix for weird input field label behaviour
        // https://github.com/InfomediaLtd/angular2-materialize/issues/131
        Materialize.updateTextFields();
      }, 100);
    });
  }])
  .run(['$timeout', 'Materialize', 'amvSystemDemoUiSettings', function ($timeout, Materialize, amvSystemDemoUiSettings) {

    Materialize.toast('Welcome to the amv System Demo Application.', 2000);

    amvSystemDemoUiSettings.get()
      .then(settings => {
        var settingsMessages = [];
        var contractId = settings.api.options.contractId;
        var username = settings.api.options.auth.username;

        settingsMessages.push(['Using user \'' + username +'\' and contract #' + contractId, 5000]);

        if (settings.app.vehicleIds.length > 0) {
         settingsMessages.push(['Vehicle filtering is enabled. ', 2000]);
        }
        if (settings.enableDemoMode) {
          settingsMessages.push(['Demonstration mode is enabled. ', 2000]);
        }
        if (settings.enableStreamingUpdates) {
          Materialize.toast('Streaming data is enabled. ', 2000);
        }

        var nextDelay = 2500;
        settingsMessages.forEach(keyValuePair => {
          $timeout(() => {
            var message = keyValuePair[0];
            var displayTimeInMs = keyValuePair[1];
            Materialize.toast(message, displayTimeInMs);
          }, nextDelay);
          nextDelay += 1000;
        });
      });
  }])
  .controller('TopNavigationController', ['amvGitInfo', function (amvGitInfo) {
    this.gitinfo = angular.copy(amvGitInfo);
  }]);
