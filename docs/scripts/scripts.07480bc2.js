'use strict';

var appendPrefixPreventingSubstitutionByGruntReplaceAndUglify = function(value) {
  return '@@' + value;
};

var variableNameThatShouldNotBeReplaced = appendPrefixPreventingSubstitutionByGruntReplaceAndUglify('___ENV_REPLACE_WORKAROUND___');
var replaceTaskInvoked = variableNameThatShouldNotBeReplaced !== '42';

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
        version: 'app'
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
            shortSHA: '4b984e5',
            name: 'master',
            lastCommitNumber: '30'
          }
        },
        remote: {
          origin: {
            url: 'https://github.com/amv-networks/amv-system-demo-app.git'
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
            username: 'username',
            password: 'password',
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
      get: () => amvTrafficsoftApiSettings.get()
        .then(apiSettings => amvTrafficsoftRestJs(apiSettings.baseUrl, apiSettings.options))
    };
  }])
  .factory('amvXfcdClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: () => amvClientFactory.get().then(factory => factory.xfcd())
    };
  }])
  .factory('amvContractClient', ['amvClientFactory', function (amvClientFactory) {
    return {
      get: () => amvClientFactory.get().then(factory => factory.contract())
    };
  }])
  .factory('amvVehicleIds', ['$log', 'amvContractClient', 'authContractId', 'amvDemoVehicle',
  function ($log, amvContractClient, authContractId, amvDemoVehicle) {
    return {
      get: () => amvContractClient.get().then(client => authContractId.get()
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
      };
  }])

  .factory('amvDemoVehicle', [function () {
    var vehicleMoves = Math.random() >= 0.3 ? true : false;
    var fuelLevel = Math.round(2 + Math.random() * 59);
    var speed = Math.round((vehicleMoves ? Math.random() * 100 : 0) * 10) / 10;

    return {
      id: 1,
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

    Materialize.toast('Welcome to the amv System Demo Application.', 5000);

    amvSystemDemoUiSettings.get()
      .then(settings => {
        $timeout(() => {
          if (settings.enableDemoMode) {
            Materialize.toast('Demonstration mode is enabled. ', 5000);
          }
          $timeout(() => {
            if (settings.enableStreamingUpdates) {
              Materialize.toast('Streaming data is enabled. ', 5000);
            }
          }, 3000);
        }, 3000);
      })
      .catch(() => {
        $timeout(() => {
          Materialize.toast('Demonstration mode is enabled. Play around!', 7000);

          $timeout(() => {
            Materialize.toast('... or adapt the application settings and use your own data :D', 8000);
          }, 5000);
        }, 2000);
      });
  }])
  .controller('TopNavigationController', ['amvGitInfo', function (amvGitInfo) {
    this.gitinfo = angular.copy(amvGitInfo);
  }]);

'use strict';

angular.module('amvSystemDemoUi')
  .directive('initSidenavToggleButton', ['jQuery', function(jQuery) {
    return {
      controller: [function() {
          jQuery('.button-collapse').sideNav();
      }]
    };
  }])
  .directive('amvVehicleDetail', ['amvCanParams', 'amvStateParams', function (amvCanParams, amvStateParams) {
    return {
      transclude: true,
      scope: {
        vehicle: '&vehicle'
      },
      controllerAs: 'ctrl',
      controller: ['$scope', function ($scope) {
        var self = this;

        var vehicle = $scope.vehicle();

        self.model = {};
        self.model.vehicle = vehicle;
        self.model.requestTime = moment(vehicle.requestTime);
        self.model.requestTimeFromNow = moment(vehicle.requestTime).fromNow();
        self.model.positionTime = moment(vehicle.data.timestamp);
        self.model.positionTimeFromNow = moment(vehicle.data.timestamp).fromNow();

        amvCanParams.get().then(function (response) {
          self.canParamsMap = _.keyBy(response, 'code');
        });

        amvStateParams.get().then(function (response) {
          self.stateParamsMap = _.keyBy(response, 'code');
        });

        this.map = {
          center: {
            lat: self.model.vehicle.location.lat,
            lng: self.model.vehicle.location.lng,
            //zoom: 5
            zoom: 12
          },
          markers: [],
          events: {},
          defaults: {
            scrollWheelZoom: true,
            center: {
              lat: 49,
              lng: 10,
              zoom: 5
            }
          },
          tiles: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          },
          controls: {
            fullscreen: {
              position: 'topleft'
            }
          }
        };

        $scope.$watch(function () {
          return self.map.center.zoom;
        }, function (zoom) {
          self.map.tiles.url = (zoom > 6) ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        });

        var createMarkerForGeolocation = function (geolocation) {
          return {
            lat: geolocation.location.lat,
            lng: geolocation.location.lng,
            draggable: false,
            //focus: true,
            icon: {
              //iconUrl: markerIconUrl,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
              popupAnchor: [0, 0]
            }
          };
        };

        function isLocalizable(geolocation) {
          return (!!geolocation && !!geolocation.location &&
          geolocation.location.lat &&
          geolocation.location.lng);
        }

        var removeMarkersFromMap = function () {
          self.map.markers = [];
        };

        var addMarkerForGeolocationToMap = function (geolocation) {
          var localizable = isLocalizable(geolocation);
          if (localizable) {
            var marker = createMarkerForGeolocation(geolocation);
            self.map.markers.push(marker);
          }
        };

        var zoomToLocation = function (geolocation, level) {
          var zoomLevel = level > 0 ? level : 11;
          var localizable = isLocalizable(geolocation);
          if (localizable) {
            self.map.center = {
              lat: geolocation.location.lat,
              lng: geolocation.location.lng,
              zoom: zoomLevel
            };
          }
        };

        removeMarkersFromMap();
        addMarkerForGeolocationToMap(self.model.vehicle);
        zoomToLocation(self.model.vehicle, 17);
      }],
      templateUrl: 'views/directives/amv-vehicle-detail.html'
    };
  }])
  .directive('materializeModal', [function () {
    return {
      transclude: true,
      scope: {
        id: '@id',
        headerText: '@headerText'
      },
      templateUrl: 'views/directives/materialize-modal.html'
    };
  }])
  .directive('materializeModalActivator', ['$window', '$compile', '$timeout', function ($window, $compile, $timeout) {
    var $ = $window.$;
    return {
      scope: {
        dismissible: '=',
        opacity: '@',
        inDuration: '@',
        outDuration: '@',
        startingTop: '@',
        endingTop: '@',
        ready: '&?',
        complete: '&?',
        open: '=?',
        enableTabs: '@?'
      },
      link: function (scope, element, attrs) {
        $timeout(function () {
          var modalEl = $(attrs.href ? attrs.href : '#' + attrs.target);
          $compile(element.contents())(scope);

          var complete = function () {
            if (angular.isFunction(scope.complete)) {
              scope.$apply(scope.complete);
            }

            scope.open = false;
            scope.$apply();
          };
          var ready = function () {
            if (angular.isFunction(scope.ready)) {
              scope.$apply(scope.ready);
            }
            // Need to keep open boolean in sync.
            scope.open = true;
            scope.$apply();

            // If tab support is enabled we need to re-init the tabs
            // See https://github.com/Dogfalo/materialize/issues/1634
            if (scope.enableTabs) {
              modalEl.find('ul.tabs').tabs();
            }
          };
          var options = {
            dismissible: (angular.isDefined(scope.dismissible)) ? scope.dismissible : undefined,
            opacity: (angular.isDefined(scope.opacity)) ? scope.opacity : undefined,
            inDuration: (angular.isDefined(scope.inDuration)) ? scope.inDuration : undefined,
            outDuration: (angular.isDefined(scope.outDuration)) ? scope.outDuration : undefined,
            startingTop: (angular.isDefined(scope.startingTop)) ? scope.startingTop : undefined,
            endingTop: (angular.isDefined(scope.endingTop)) ? scope.endingTop : undefined,
            ready: ready,
            complete: complete,
          };
          modalEl.modal(options);
          element.modal(options);

          // Setup watch for opening / closing modal programatically.
          if (angular.isDefined(attrs.open) && modalEl.length > 0) {
            scope.$watch('open', function (value) {
              if (!angular.isDefined(value)) {
                return;
              }
              if (value === true) {
                modalEl.modal('open');
              } else {
                modalEl.modal('close');
              }
            });
          }
        });
      }
    };
  }])

  .directive('materializeTooltippedDisabled', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        var rmDestroyListener = Function.prototype; //assigning to noop

        function init() {
          element.addClass('tooltipped');
          $compile(element.contents())(scope);

          $timeout(function () {
            // https://github.com/Dogfalo/materialize/issues/3546
            // if element.addClass('tooltipped') would not be executed, then probably this would not be needed
            if (element.attr('data-tooltip-id')) {
              element.tooltip('remove');
            }
            element.tooltip();
          });
          rmDestroyListener = scope.$on('$destroy', function () {
            element.tooltip('remove');
          });
        }

        attrs.$observe('tooltipped', function (value) {
          if (value === 'false' && rmDestroyListener !== Function.prototype) {
            element.tooltip('remove');
            rmDestroyListener();
            rmDestroyListener = Function.prototype;
          } else if (value !== 'false' && rmDestroyListener === Function.prototype) {
            init();
          }
        });

        if (attrs.tooltipped !== 'false') {
          init();
        }

        // just to be sure, that tooltip is removed when somehow element is destroyed, but the parent scope is not
        element.on('$destroy', function () {
          element.tooltip('remove');
        });

        scope.$watch(function () {
          return element.attr('data-tooltip');
        }, function (oldVal, newVal) {
          if (oldVal !== newVal && attrs.tooltippify !== 'false') {
            $timeout(function () {
              element.tooltip();
            });
          }
        });

      }
    };
  }]);

/* jshint loopfunc:true */
'use strict';

angular.module('amvSystemDemoUi')
  .controller('MainCtrl', ['$scope', '$log', '$timeout',
    'Materialize', 'amvSystemDemoUiSettings', 'amvXfcdClient', 'amvVehicleIds', 'amvDemoVehicle',
    function ($scope, $log, $timeout, Materialize, amvSystemDemoUiSettings, amvXfcdClient, amvVehicleIds, amvDemoVehicle) {
      var self = this;

      this.map = {
        center: {
          lat: 49,
          lng: 10,
          zoom: 3
        },
        markers: [],
        events: {},
        defaults: {
          scrollWheelZoom: true,
          center: {
            lat: 49,
            lng: 10,
            zoom: 5
          }
        },
        tiles: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        },
        controls: {
          fullscreen: {
            position: 'topleft'
          }
        }
      };

      $scope.$watch(function () {
        return self.map.center.zoom;
      }, function (zoom) {
        self.map.tiles.url = (zoom > 6) ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      });

      var createMarkerForVehicle = function (vehicle) {

        var markerMessage = '<div>' +
          '<h6>' + vehicle.name + '</h6>' +
          '<small>' +
          '<i class="material-icons tiny">room</i> lat/lng: ' + vehicle.location.lat + ' / ' + vehicle.location.lng +
          '</small>' +
          '<br />' +
          '<small>' +
          ' <i class="material-icons tiny">av_timer</i> speed: ' + (vehicle.data.speed || 0) + ' km/h' +
          '</small>' +
          '<br />' +
          '<span>' +
          //'' + vehicle.condition.temperature +
          '</span><br />' +
          //'<span>' + vehicle.condition.state + '</span><br />' +
          '<small><i class="material-icons tiny">router</i> Data Provider: ' + vehicle.provider + '</small><br />' +
          '<small><i class="material-icons tiny">query_builder</i> Request Time: ' + vehicle.requestTime + '</small><br />' +
          '<small><i class="material-icons tiny">query_builder</i> Position Time: ' + vehicle.data.timestamp + '</small>' +
          '</div>';

        return {
          lat: vehicle.location.lat,
          lng: vehicle.location.lng,
          message: markerMessage,
          draggable: false,
          //focus: true,
          icon: {
            //iconUrl: markerIconUrl,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, 0]
          }
        };
      };

      function isLocalizable(vehicle) {
        return (!!vehicle && !!vehicle.location &&
        vehicle.location.lat &&
        vehicle.location.lng);
      }

      var removeMarkersFromMap = function () {
        self.map.markers = [];
      };

      var addMarkerForVehicleToMap = function (vehicle) {
        var localizable = isLocalizable(vehicle);
        if (localizable) {
          var marker = createMarkerForVehicle(vehicle);
          self.map.markers.push(marker);
        }
      };

      $scope.$on('leafletDirectiveMap.mymap.click', function (event, args) {
        var leafEvent = args.leafletEvent;
        var positionClicked = {
          location: {
            lat: leafEvent.latlng.lat,
            lng: leafEvent.latlng.lng
          }
        };
        $log.log('clicked ' + positionClicked);
      });


      function apiResponseToVehicle(data) {
        return {
          id: data.id,
          name: data.name || data.id,
          location: {
            lat: data.latitude,
            lng: data.longitude
          },
          provider: 'amv networks',
          requestTime: Date.now(),
          date: Date.now(),
          data: data
        };
      }

      $scope.zoomToLocation = function (vehicle, level) {
        var zoomLevel = level > 0 ? level : 11;
        var localizable = isLocalizable(vehicle);
        if (!localizable) {
          Materialize.toast('No location data available for ' + vehicle.name, 2000);
        } else {
          Materialize.toast('Zoom to ' + vehicle.name, 1000);
          self.map.center = {
            lat: vehicle.location.lat,
            lng: vehicle.location.lng,
            zoom: zoomLevel
          };
        }
      };

      (function init() {
        self.loading = true;
        self.vehicles = [];
        self.periodicUpdateTimeoutPromise = null;

        $scope.$on('$destroy', function () {
          $timeout.cancel(self.periodicUpdateTimeoutPromise);
        });

        var addVehicle = function (vehicle) {
          self.vehicles.push(vehicle);
          addMarkerForVehicleToMap(vehicle);
        };

        var fetchData = function (vehicleIds) {
          self.loading = true;

          return amvXfcdClient.get().then(function (client) {
            return client.getLastData(vehicleIds);
          }).then(function (response) {
            $log.log('ok, got data');

            var hasData = !!response.data && response.data.length > 0;
            if (!hasData) {
              return [];
            }
            return response.data;
          }).finally(function () {
            self.loading = false;
          });
        };

        var fetchDataAndPopulateLocations = function (vehicleIds, onVehicleData) {
          return fetchData(vehicleIds).then(function (dataArray) {
            if (dataArray && dataArray.length > 0) {
              onVehicleData(dataArray);
            }
            return dataArray;
          });
        };

        var invokeRecursiveFetchDataAndPopulateLocations = function (vehicleIds, onVehicleData, timeoutIntervalInMilliseconds) {
          var actualTimeoutIntervalInMilliseconds = Math.max(timeoutIntervalInMilliseconds, 5000);

          return fetchDataAndPopulateLocations(vehicleIds, onVehicleData).then(function (dataArray) {
            self.periodicUpdateTimeoutPromise = $timeout(function () {
              invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, onVehicleData, actualTimeoutIntervalInMilliseconds);
            }, actualTimeoutIntervalInMilliseconds);

            return dataArray;
          });
        };

        var removeAllVehicles = function () {
          self.vehicles = [];
        };
        var addDemoVehicle = function () {
          addVehicle(amvDemoVehicle);
        };

        amvVehicleIds.get().then(function(vehicleIds) {
          amvSystemDemoUiSettings.get()
            .catch(function (e) {
              self.loading = false;

              addDemoVehicle();

              $log.log(e);
            })
            .then(function (settings) {
              self.settings = settings;

              //var apiSettings = settings.api || {};
              //var vehicleIds = apiSettings.options.vehicleIds || []; <- vehicleIds from subscription!
              var timeoutIntervalInMilliseconds = (settings.periodicUpdateIntervalInSeconds || 10) * 1000;

              var runRecursive = settings.enablePeriodicUpdateInterval;

              var onVehicleData = function (vehicleDataArray) {
                removeMarkersFromMap();

                removeAllVehicles();

                if (settings.enableDemoMode) {
                  addDemoVehicle();
                }

                vehicleDataArray.forEach(function (data) {
                  var vehicle = apiResponseToVehicle(data);
                  addVehicle(vehicle);
                });

              };

              var fetchMethod = runRecursive ? function () {
                return invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, onVehicleData, timeoutIntervalInMilliseconds);
              } : function () {
                return fetchDataAndPopulateLocations(vehicleIds, onVehicleData);
              };

              fetchMethod().then(function (data) {
                if (data.length === 0) {
                  Materialize.toast('Response contains empty data!', 2000);
                } else {
                  Materialize.toast('Finished loading ' + data.length + ' location(s)', 1000);
                }
              }).catch(function (e) {
                if (settings.enableDemoMode) {
                  addDemoVehicle();
                  return;
                }

                $log.log('error, while getting data');
                $log.log(e);

                var isAmvException = e && e.response && e.response.data && e.response.data.message;
                var errorMessage = isAmvException ? e.response.data.message : e;
                Materialize.toast(errorMessage, 4000);
                Materialize.toast('Please check your settings.', 5000);
              });
            });
          });
      })();
    }]);

'use strict';

angular.module('amvSystemDemoUi')
  .controller('SettingsCtrl', [
    'Materialize',
    'SettingsResource',
    'amvSystemDemoUiSettingsTemplate',
    function (Materialize, SettingsResource, amvSystemDemoUiSettingsTemplate) {
      var self = this;

      var defaultSettings = amvSystemDemoUiSettingsTemplate;

      SettingsResource.findAll().then(function (settingsArray) {
        if (settingsArray.length !== 0) {
          self.config = angular.copy(settingsArray[0]);
        } else {
          SettingsResource.create(defaultSettings).then(function (resource) {
            self.config = angular.copy(resource);
          });
        }
      });

      this.saveSettings = function (settings) {
        SettingsResource.destroyAll().then(function () {
          SettingsResource.create(settings).then(function (resource) {
            self.config = angular.copy(resource);
            Materialize.toast('Settings saved!', 3000);
          });
        });
      };

      this.loadDefaultSettings = function () {
        self.config = angular.copy(defaultSettings);
      };

      this.addValueToVehicleIds = function (newVehicleId) {
        if (newVehicleId && newVehicleId > 0) {
          self.config.app.vehicleIds.push(newVehicleId);
        }
      };

      this.onKeyUpOnNewVehicleIdInput = function ($event, newVehicleId) {
        var keyEnterPressed = $event.keyCode === 13;
        if (keyEnterPressed) {
          self.addValueToVehicleIds(newVehicleId);
        }
      };

      this.removeVehicleIdWithValue = function (vehicleId) {
        var index = self.config.app.vehicleIds.indexOf(vehicleId);
        if (index >= 0) {
          self.config.app.vehicleIds.splice(index, 1);
        }
      };
    }]);

'use strict';

angular.module('amvSystemDemoUi')
  .controller('AboutCtrl', function () {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });

/* jshint loopfunc:true */
'use strict';

angular.module('amvSystemDemoUi')
  .controller('VehicleDetailCtrl', ['$scope', '$log', '$timeout',
    'Materialize', 'amvSystemDemoUiSettings', 'amvXfcdClient', 'amvDemoVehicle', 'amvVehicleId',
    function ($scope, $log, $timeout, Materialize, amvSystemDemoUiSettings, amvXfcdClient, amvDemoVehicle, amvVehicleId) {
      var self = this;

      if (!amvVehicleId) {
        Materialize.toast('`vehicleId` is invalid. Cannot show details.', 2000);
        self.error = {
          message: '`vehicleId` is invalid. Cannot show details.'
        };
        return;
      }

      function apiResponseToVehicle(data) {
        return {
          id: data.id,
          name: data.name || data.id,
          location: {
            lat: data.latitude,
            lng: data.longitude
          },
          provider: 'amv networks',
          requestTime: Date.now(),
          date: Date.now(),
          data: data
        };
      }

      (function init() {
        self.loading = true;
        self.vehicles = [];
        self.periodicUpdateTimeoutPromise = null;

        $scope.$on('$destroy', function () {
          $timeout.cancel(self.periodicUpdateTimeoutPromise);
        });

        var fetchData = function (vehicleIds) {
          self.loading = true;

          return amvXfcdClient.get().then(function (client) {
            return client.getLastData(vehicleIds);
          }).then(function (response) {
            $log.log('ok, got data');

            var hasData = !!response.data && response.data.length > 0;
            if (!hasData) {
              return [];
            }
            return response.data;
          }).finally(function () {
            self.loading = false;
          });
        };


        var fetchDataAndPopulateLocations = function (vehicleIds, onVehicleData) {
          return fetchData(vehicleIds).then(function (dataArray) {
            if (dataArray && dataArray.length > 0) {
              onVehicleData(dataArray);
            }
            return dataArray;
          });
        };

        var invokeRecursiveFetchDataAndPopulateLocations = function (vehicleIds, onVehicleData, timeoutIntervalInMilliseconds) {
          var actualTimeoutIntervalInMilliseconds = Math.max(timeoutIntervalInMilliseconds, 5000);

          return fetchDataAndPopulateLocations(vehicleIds, onVehicleData).then(function (dataArray) {
            self.periodicUpdateTimeoutPromise = $timeout(function () {
              invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, onVehicleData, actualTimeoutIntervalInMilliseconds);
            }, actualTimeoutIntervalInMilliseconds);

            return dataArray;
          });
        };

        self.demoMode = amvVehicleId === amvDemoVehicle.id; //amvDemoVehicle.id;

        amvSystemDemoUiSettings.get()
          .catch(function (e) {
            self.loading = false;

            if (self.demoMode) {
              self.vehicles = [amvDemoVehicle];
              return;
            }

            $log.log(e);
            Materialize.toast('Please check your settings.', 3000);
          })
          .then(function (settings) {
            var vehicleIds = [amvVehicleId];
            var timeoutIntervalInMilliseconds = (settings.periodicUpdateIntervalInSeconds || 60) * 1000;

            var onVehicleData = function (vehicleData) {
              self.vehicles = [];

              vehicleData.forEach(function (data) {
                var vehicle = apiResponseToVehicle(data);
                self.vehicles.push(vehicle);
              });
            };

            var runRecursive = settings.enablePeriodicUpdateInterval;

            var fetchMethod = runRecursive ? function () {
              return invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, onVehicleData, timeoutIntervalInMilliseconds);
            } : function () {
              return fetchDataAndPopulateLocations(vehicleIds, onVehicleData);
            };

            fetchMethod().then(function (data) {
              if (data.length === 0) {
                Materialize.toast('Response contains empty data!', 2000);
              } else {
                Materialize.toast('Finished loading ' + data.length + ' position(s)', 1000);
              }
            }).catch(function (e) {
              if (self.demoMode) {
                self.vehicles = [amvDemoVehicle];
                return;
              }

              $log.log('error, while getting data');
              $log.log(e);

              var isAmvException = e && e.response && e.response.data && e.response.data.message;
              var errorMessage = isAmvException ? e.response.data.message : 'Error while trying to receive data.';
              Materialize.toast(errorMessage, 4000);
              Materialize.toast('Please check your settings.', 5000);

              var url = e && e.config && e.config.url;

              self.error = {
                url: url,
                message: errorMessage
              };
            });
          });

      })();
    }]);

'use strict';

angular.module('amvSystemDemoUi')
  .controller('CanParamsCtrl', ['$log', '$timeout',
    'Materialize', 'amvCanParams',
    function ($log, $timeout, Materialize, amvCanParams) {
      var self = this;

      (function init() {
        self.loading = true;

        amvCanParams.get().then(function (response) {
          self.canParams = response;
        }).catch(function (e) {
          var errorMessage = e.message || '';
          self.error = 'Error while loading can params. ' + errorMessage;
        }).finally(function () {
          self.loading = false;
        });
      })();
    }]);

'use strict';

angular.module('amvSystemDemoUi')
  .controller('StateParamsCtrl', ['$log', '$timeout',
    'Materialize', 'amvStateParams',
    function ($log, $timeout, Materialize, amvStateParams) {
      var self = this;

      (function init() {
        self.loading = true;

        amvStateParams.get().then(function (response) {
          self.stateParams = response;
        }).catch(function (e) {
          var errorMessage = e.message || '';
          self.error = 'Error while loading state params. ' + errorMessage;
        }).finally(function () {
          self.loading = false;
        });
      })();
    }]);

'use strict';

angular.module('amvSystemDemoUi')
  .factory('amvCanParams', ['$q', '$log',
  'amvContractClient',
  'authContractId',
  function ($q, $log, amvContractClient, authContractId) {
    return {
      get: () => {
        return amvContractClient.get().then(client => authContractId.get()
          .then(contractId => client.fetchDataPackage(contractId)))
          .then(response => {
            $log.log('ok, got data');
            return response.data;
          }).then(datapackage => datapackage.params.xfcds);
      }
    };
  }]);

'use strict';

angular.module('amvSystemDemoUi')
  .factory('amvStateParams', ['$q',  '$log',
    'amvContractClient',
    'authContractId',
    function ($q, $log, amvContractClient, authContractId) {
    return {
      get: () => {
        return amvContractClient.get().then(client => authContractId.get()
          .then(contractId => client.fetchDataPackage(contractId)))
          .then(response => {
            $log.log('ok, got data');
            return response.data;
          }).then(datapackage => datapackage.params.states);
      }
    };
  }]);

angular.module('amvSystemDemoUi').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/directives/amv-vehicle-detail.html',
    "<div> <div class=\"col s12 m12 l6\"> <div class=\"row\"> <div class=\"col s12 m12 l12\"> <h3>{{ ctrl.model.vehicle.name }}</h3> <i class=\"material-icons tiny\">query_builder</i> request time: {{ ctrl.model.requestTimeFromNow }} <small>({{ ctrl.model.requestTime }})</small> <br> <i class=\"material-icons tiny\">router</i> data provider: {{ ctrl.model.vehicle.provider }} <br> <br> <i class=\"material-icons tiny\">room</i> lat/lng: {{ctrl.model.vehicle.location.lat}} / {{ ctrl.model.vehicle.location.lng }} <br> <i class=\"material-icons tiny\">query_builder</i> position time: {{ ctrl.model.positionTimeFromNow }} <small>({{ ctrl.model.positionTime }})</small> <br> <i class=\"material-icons tiny\">av_timer</i> speed: {{ (ctrl.model.vehicle.data.speed || 0) }} km/h </div> </div> </div> <div class=\"col s12 m12 l6\" style=\"padding: 9px\"> <leaflet id=\"mymap\" defaults=\"ctrl.map.defaults\" center=\"ctrl.map.center\" markers=\"ctrl.map.markers\" tiles=\"ctrl.map.tiles\" height=\"250px\"> </leaflet> </div> <div class=\"col s12 m12 l12\"> <h5>STATE params</h5> <table> <thead> <tr> <th>param</th> <th>value</th> </tr> </thead> <tbody> <tr data-ng-repeat=\"state in ctrl.model.vehicle.data.states | filter:filterStateParamInput\" data-ng-show-disabled=\"!!ctrl.stateParamsMap[state.param]\"> <!--td>{{ ctrl.canParamsMap[xfcd.param].code }}</td--> <td> <span data-materialize-tooltipped data-delay=\"50\" data-tooltip=\"{{ ctrl.stateParamsMap[state.code].description || 'No info.' }}\"> {{ state.param }} </span> </td> <td> <span>{{ state.value }}</span> <!--span>{{ ctrl.stateParamsMap[state.param].UNIT }}</span--> </td> </tr> </tbody> </table> </div> <div class=\"col s12 m12 l12\"> <h5>XFCD params</h5> <table> <thead> <tr> <th>param</th> <th>value</th> </tr> </thead> <tbody> <tr data-ng-repeat=\"xfcd in ctrl.model.vehicle.data.xfcds | filter:filterXfcdParamInput\" data-ng-show-disabled=\"!!ctrl.canParamsMap[xfcd.param]\"> <!--td>{{ ctrl.canParamsMap[xfcd.param].code }}</td--> <td> <span data-materialize-tooltipped data-delay=\"50\" data-tooltip=\"{{ ctrl.canParamsMap[xfcd.param].description || 'No info.' }}\"> {{ xfcd.param }} </span> </td> <td> <span>{{ xfcd.value }}</span> <!--span>{{ ctrl.canParamsMap[xfcd.param].UNIT }}</span--> </td> <!--td>{{ canParam.DESCEN }}</td>\n" +
    "        <td>{{ canParam.UNIT }}</td>\n" +
    "        <td>{{ canParam.DATATYPE }}</td--> </tr> </tbody> </table> </div> </div> "
  );


  $templateCache.put('views/directives/materialize-modal.html',
    "<div id=\"{{ id }}\" class=\"modal bottom-sheet\"> <div class=\"modal-content\"> <h4>{{ headerText }}</h4> <div data-ng-transclude></div> </div> <div class=\"modal-footer\"> <a href=\"#!\" class=\"modal-action modal-close waves-effect waves-green btn-flat\">Agree</a> </div> </div> "
  );


  $templateCache.put('views/page/about.html',
    "<div class=\"container\"> <div class=\"section\"> <div class=\"row\"> <div class=\"col s12 m12\"> <h3>About</h3> <p>The AMV System Demo is a work-in-progress proof-of-concept prototype application.</p> <h4>Primary Goals</h4> <ul class=\"browser-default\"> <li>Create a system that displays mobility data as it flows through in real-time</li> <li>Give insights for people keeping track of a fleet of moving objects</li> <li>Finding possible improvements and help in understanding the usage and impacts of mobility services within a certain domain </li> <li>Provide a small preview of the data available on the AMV Platform</li> </ul> <h4>Prototype Stage</h4> <p> This application is currently in a prototype stage. Be prepared to see some rough edges or under-construction features. During the ongoing development you may experience technical misbehaviour or small bugs here and there. You may also feel like some key features are missing - because they are. Feel free to suggest a feature you want to see in the near future - just open a <a href=\"https://github.com/amv-networks/amv-system-demo-app/issues\">feature request on GitHub</a>. </p> <h4>License</h4> The project is licensed under the <a href=\"https://raw.githubusercontent.com/amvnetworks/amv-trafficsoft-rest/master/LICENSE\">Apache License, Version 2.0</a>. <h5>Redistribution</h5> <p> You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the conditions of the license.</p> <p> You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.</p> <h5>Trademarks</h5> <p>This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.</p> <h5>Disclaimer of Warranty</h5> <p> Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an \"AS IS\" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.</p> </div> </div> </div> </div>"
  );


  $templateCache.put('views/page/can-params.html',
    "<div class=\"progress amber\" style=\"margin: 0\" data-ng-show=\"canParams.loading\"> <div class=\"indeterminate amber lighten-4\"></div> </div> <div class=\"row\" style=\"margin-bottom: 0\"> <div class=\"container\"> <div data-ng-if=\"canParams.error\"> <h2>There has been an error :(</h2> <p>{{ canParams.error.message }}</p> <p data-ng-if=\"canParams.error.exception\">{{ canParams.error.exception }}</p> <pre>{{ canParams.error | json}}</pre> </div> <h1>CAN Parameter</h1> <form class=\"\"> <div class=\"input-field col s12\"> <input placeholder=\"\" id=\"filterInput\" type=\"text\" data-ng-model=\"filterInput\"> <label for=\"filterInput\">Filter</label> </div> </form> <table> <thead> <tr> <th>code</th> <th>name</th> <th>description</th> </tr> </thead> <tbody> <tr data-ng-repeat=\"canParam in canParams.canParams | filter:filterInput\"> <td> <pre>{{ canParam.code }}</pre> </td> <td>{{ canParam.name }}</td> <td>{{ canParam.description }}</td> </tr> </tbody> </table> </div> </div> "
  );


  $templateCache.put('views/page/main.html',
    "<div class=\"progress amber\" style=\"margin: 0\" data-ng-show=\"main.loading\"> <div class=\"indeterminate amber lighten-4\"></div> </div> <div class=\"row\" style=\"margin-bottom: 0\"> <div class=\"col s6 m4 l3\" style=\"padding: 0\"> <div style=\"height: 600px; overflow-y: scroll; overflow-x: hidden\"> <form class=\"\"> <div class=\"input-field col s12\"> <input placeholder=\"\" id=\"filterInput\" type=\"text\" data-ng-model=\"filterInput\"> <label for=\"filterInput\">Filter</label> </div> </form> <div class=\"collection\"> <div class=\"collection-item\" data-ng-repeat=\"vehicle in main.vehicles | filter:filterInput\"> <span class=\"badge\">{{$index + 1}}</span> <header> <h5>{{ vehicle.name }}</h5> </header> <div class=\"left\"> <ul style=\"margin: 0\"> <li> <i class=\"material-icons tiny\">room</i> <small data-ng-show=\"vehicle.location.lat && vehicle.location.lng\"> lat/lng: {{ vehicle.location.lat }} / {{ vehicle.location.lng }} </small> <small data-ng-hide=\"vehicle.location.lat && vehicle.location.lng\"> lat/lng: No location data available. </small> </li> <li> <i class=\"material-icons tiny\">av_timer</i> <small> speed: {{ vehicle.data.speed || 0 }} km/h </small> </li> </ul> </div> <div class=\"right\"> <a class=\"btn-floating waves-effect waves-light amber\" data-ng-click=\"zoomToLocation(vehicle, 17)\" data-materialize-tooltipped data-delay=\"50\" data-tooltip=\"zoom to location\"> <i class=\"material-icons\">my_location</i> </a> <a class=\"btn-floating waves-effect waves-light amber\" data-ui-sref=\"vehicle({id: vehicle.id})\" data-materialize-tooltipped data-delay=\"50\" data-tooltip=\"view additional information\"> <i class=\"material-icons\">perm_device_information</i> </a> </div> <div style=\"float:none; clear:both\"></div> <div data-ng-if=\"main.settings.debug\"> {{ vehicle.data | json }} </div> </div> </div> </div> </div> <div class=\"col s6 m8 l9\" style=\"padding: 0\"> <leaflet id=\"mymap\" defaults=\"main.map.defaults\" center=\"main.map.center\" markers=\"main.map.markers\" tiles=\"main.map.tiles\" height=\"600px\"> </leaflet> </div> </div> "
  );


  $templateCache.put('views/page/settings.html',
    "<div class=\"container\"> <div class=\"section\"> <div class=\"row\"> <div class=\"col s12 m12\"> <h2 class=\"header light\"> Settings <a class=\"waves-effect waves-light btn-large amber right\" data-ng-click=\"settings.saveSettings(settings.config)\"> <i class=\"material-icons left\">done</i> Save </a> </h2> <div class=\"col s12\"> <h3 class=\"header light\">API Settings</h3> <ul class=\"collection\"> <li class=\"collection-item\"> <div class=\"input-field\"> <input id=\"baseUrl\" type=\"text\" class=\"validate\" data-ng-model=\"settings.config.api.baseUrl\"> <label class=\"active\" for=\"baseUrl\">Base URL</label> </div> <div class=\"row\" style=\"margin-bottom: 0\"> <div class=\"input-field col s6\"> <input id=\"username\" type=\"text\" class=\"validate\" data-ng-model=\"settings.config.api.options.auth.username\"> <label class=\"active\" for=\"username\">Username</label> </div> <div class=\"input-field col s6\"> <input id=\"password\" type=\"password\" class=\"validate\" data-ng-model=\"settings.config.api.options.auth.password\"> <label class=\"active\" for=\"password\">Password</label> </div> </div> <div class=\"input-field\"> <input id=\"contractId\" type=\"number\" class=\"validate\" data-ng-model=\"settings.config.api.options.contractId\"> <label class=\"active\" for=\"contractId\">ContractId</label> </div> </li> </ul> <h3 class=\"header light\">Application Settings</h3> <ul class=\"collection\"> <li class=\"collection-item\"> <h6>Vehicle Ids</h6> <p data-ng-if=\"settings.config.app.vehicleIds.length != 0\"> Filtering is <strong class=\"green-text\">enabled</strong>: Incoming data is filtered by given vehicle ids. </p> <p data-ng-if=\"settings.config.app.vehicleIds.length == 0\"> Filtering is <strong class=\"grey-text\">disabled</strong>: All vehicles with valid subscriptions are shown! </p> <div> <div class=\"chip\" data-ng-repeat=\"vehicleId in settings.config.app.vehicleIds track by $index\"> {{ vehicleId }} <i class=\"material-icons\" data-ng-click=\"settings.removeVehicleIdWithValue(vehicleId)\" style=\"cursor: pointer\">close</i> </div> </div> <div class=\"file-field input-field\"> <div class=\"waves-effect waves-light btn right\" data-ng-click=\"settings.addValueToVehicleIds(__newVehicleId); __newVehicleId = null;\"> Add </div> <div class=\"file-path-wrapper\"> <input id=\"newVehicleId\" type=\"number\" class=\"validate\" data-ng-model=\"__newVehicleId\" data-ng-keyup=\"settings.onKeyUpOnNewVehicleIdInput($event, __newVehicleId)\"> <!--label class=\"active\" for=\"newVehicleId\">Add VehicleId</label--> </div> </div> </li> <li class=\"collection-item\" style=\"cursor: pointer\" data-ng-class=\"{ 'grey lighten-3' : settings.optOut }\" data-ng-click=\"settings.config.enableDemoMode = !settings.config.enableDemoMode\"> <span class=\"title\">Enable demonstration mode</span> <div class=\"switch right\"> <label> Off <input type=\"checkbox\" data-ng-model=\"settings.config.enableDemoMode\" data-ng-true-value=\"true\" data-ng-false-value=\"false\" data-ng-change-disabled=\"settings.doOnStateChange()\"> <span class=\"lever\"></span> On </label> </div> <p data-ng-if=\"settings.config.enableDemoMode\"> Demonstration mode is <strong class=\"green-text\">enabled</strong>! A few demonstrative elements will be displayed to show the key features of the application. </p> <p data-ng-if=\"!settings.config.enableDemoMode\"> Demonstration mode is <strong class=\"grey-text\">disabled</strong>! </p> </li> <li class=\"collection-item\" style=\"cursor: pointer\" data-ng-class=\"{ 'grey lighten-3' : settings.optOut }\" data-ng-click=\"settings.config.enableStreamingUpdates = !settings.config.enableStreamingUpdates\"> <span class=\"title\">Realtime position updates</span> <div class=\"switch right\"> <label> Off <input type=\"checkbox\" data-ng-model=\"settings.config.enableStreamingUpdates\" data-ng-true-value=\"true\" data-ng-false-value=\"false\" data-ng-change-disabled=\"settings.doOnStateChange()\"> <span class=\"lever\"></span> On </label> </div> <p data-ng-if=\"settings.config.enableStreamingUpdates\"> Realtime geolocation information updates are <strong class=\"green-text\">enabled</strong>! Data will stream into the application in near real-time. Use wisely as this may generate a lot of data traffic. This feature is currently not implemented. </p> <p data-ng-if=\"!settings.config.enableStreamingUpdates\"> Realtime geolocation information updates are <strong class=\"grey-text\">disabled</strong>! Data will be updated on the specified update interval. </p> </li> <li class=\"collection-item\" style=\"cursor: pointer\" data-ng-class=\"{ 'grey lighten-3' : settings.optOut }\" data-ng-click=\"settings.config.enablePeriodicUpdateInterval = !settings.config.enablePeriodicUpdateInterval\"> <span class=\"title\">Enable periodic update interval</span> <div class=\"switch right\"> <label> Off <input type=\"checkbox\" data-ng-model=\"settings.config.enablePeriodicUpdateInterval\" data-ng-true-value=\"true\" data-ng-false-value=\"false\" data-ng-change-disabled=\"settings.doOnStateChange()\"> <span class=\"lever\"></span> On </label> </div> <p data-ng-if=\"settings.config.enablePeriodicUpdateInterval\"> Periodic update interval is <strong class=\"green-text\">enabled</strong>! Information will be updated every {{ settings.config.periodicUpdateIntervalInSeconds }} seconds. </p> <p data-ng-if=\"!settings.config.enablePeriodicUpdateInterval\"> Periodic update interval is <strong class=\"grey-text\">disabled</strong>! Information will be gathered once and will NOT be updated. </p> </li> <li class=\"collection-item\"> <div class=\"input-field\"> <input id=\"periodicUpdateIntervalInSeconds\" type=\"number\" class=\"validate\" min=\"5\" data-ng-model=\"settings.config.periodicUpdateIntervalInSeconds\" data-ng-disabled=\"!settings.config.enablePeriodicUpdateInterval\"> <label class=\"active\" for=\"periodicUpdateIntervalInSeconds\">Periodic Update Interval In Seconds</label> </div> </li> <li class=\"collection-item\" style=\"cursor: pointer\" data-ng-class=\"{ 'grey lighten-3' : settings.optOut }\" data-ng-click=\"settings.toggleOptOut()\"> <span class=\"title\">Debug Mode</span> <div class=\"switch right\"> <label> Off <input type=\"checkbox\" data-ng-model=\"settings.config.debug\" data-ng-true-value=\"true\" data-ng-false-value=\"false\" data-ng-change-disabled=\"settings.doOnStateChange()\"> <span class=\"lever\"></span> On </label> </div> <p data-ng-if=\"settings.config.debug\"> Debug Mode is <strong class=\"green-text\">enabled</strong>! The application will output and display more fine grained messages. </p> <p data-ng-if=\"!settings.config.debug\"> Debug Mode is <strong class=\"grey-text\">disabled</strong>! The application will NOT output or display detailed messages. </p> </li> </ul> </div> </div> <div class=\"col s12 m12\"> <a class=\"waves-effect waves-light btn right\" data-ng-click=\"settings.loadDefaultSettings()\"> <i class=\"material-icons left\">settings_backup_restore</i> Load default values </a> </div> <div class=\"col s12 m12\"> <p data-ng-if=\"settings.config.debug\"> <code> {{ settings.config | json }} </code> </p> </div> </div> </div> </div> "
  );


  $templateCache.put('views/page/state-params.html',
    "<div class=\"progress amber\" style=\"margin: 0\" data-ng-show=\"stateParams.loading\"> <div class=\"indeterminate amber lighten-4\"></div> </div> <div class=\"row\" style=\"margin-bottom: 0\"> <div class=\"container\"> <div data-ng-if=\"stateParams.error\"> <h2>There has been an error :(</h2> <p>{{ stateParams.error.message }}</p> <p data-ng-if=\"stateParams.error.exception\">{{ stateParams.error.exception }}</p> <pre>{{ stateParams.error | json}}</pre> </div> <h1>State Parameter</h1> <form class=\"\"> <div class=\"input-field col s12\"> <input placeholder=\"\" id=\"filterInput\" type=\"text\" data-ng-model=\"filterInput\"> <label for=\"filterInput\">Filter</label> </div> </form> <table> <thead> <tr> <th>code</th> <th>name</th> <th>description</th> </tr> </thead> <tbody> <tr data-ng-repeat=\"stateParam in stateParams.stateParams | filter:filterInput\"> <td> <pre>{{ stateParam.code }}</pre> </td> <td>{{ stateParam.name }}</td> <td>{{ stateParam.description }}</td> </tr> </tbody> </table> </div> </div> "
  );


  $templateCache.put('views/page/vehicle-detail.html',
    "<div class=\"progress amber\" style=\"margin: 0\" data-ng-show=\"vehicleDetail.loading\"> <div class=\"indeterminate amber lighten-4\"></div> </div> <div class=\"row\" style=\"margin-bottom: 0\"> <div class=\"container\"> <div data-ng-if=\"vehicleDetail.error\"> <h2>There has been an error :(</h2> <p>{{ vehicleDetail.error.message }}</p> <p data-ng-if=\"vehicleDetail.error.exception\">{{ vehicleDetail.error.exception }}</p> <pre>{{ vehicleDetail.error | json}}</pre> </div> <div data-ng-repeat=\"vehicle in vehicleDetail.vehicles\"> <div data-amv-vehicle-detail data-vehicle=\"vehicle\"></div> </div> </div> </div> "
  );


  $templateCache.put('views/partials/footer.html',
    "<footer class=\"page-footer bgcolor-brand\"> <div class=\"container\"> <div class=\"row\"> <div class=\"col l6 s12\"> <h5 class=\"white-text\">amv System Demo</h5> <p class=\"grey-text text-lighten-4\"> </p> <ul> <li><a class=\"white-text\" data-ui-sref=\"canparams\">CAN Params</a></li> <li><a class=\"white-text\" data-ui-sref=\"stateparams\">STATE Params</a></li> </ul> </div> <div class=\"col l6 s12\"> <ul> <li><a class=\"white-text\" data-ui-sref=\"about\">About</a></li> <li><a class=\"white-text\" href=\"https://www.amv-networks.com/en/data-protection/\">Privacy</a></li> <li><a class=\"white-text\" href=\"https://www.amv-networks.com/en/imprint/\">Impress</a></li> <li><a class=\"white-text\" href=\"https://www.amv-networks.com/en/gtc/\">Terms and Conditions</a></li> </ul> </div> </div> </div> <div class=\"footer-copyright\"> <div class=\"container\"> <p class=\"left\"> made with <i class=\"material-icons tiny\">favorite</i> by <a class=\"brown-text\" href=\"https://www.amv-networks.com\">amv</a> </p> </div> </div> </footer> "
  );


  $templateCache.put('views/partials/top-navigation.html',
    "<nav class=\"nav-extended white\" role=\"navigation\" data-ng-controller=\"TopNavigationController as topnavigation\"> <div class=\"nav-wrapper container\" data-init-sidenav-toggle-button=\"button-collapse\"> <a id=\"logo-container\" href=\"#/\" class=\"brand-logo\"> <span class=\"amv\">amv</span> System Demo <small class=\"hide-on-med-and-down\" style=\"font-size: 50%\"> {{topnavigation.gitinfo.local.branch.name}}-{{topnavigation.gitinfo.local.branch.shortSHA}} </small> </a> <ul class=\"right hide-on-med-and-down\"> <li ui-sref-active=\"active\"><a data-ui-sref=\"home\">Home</a></li> <li ui-sref-active=\"active\"><a data-ui-sref=\"settings\">Settings</a></li> <li ui-sref-active=\"active\"><a data-ui-sref=\"about\">About</a></li> </ul> <ul id=\"nav-mobile\" class=\"side-nav\"> <li ui-sref-active=\"active\"><a data-ui-sref=\"home\">Home</a></li> <li ui-sref-active=\"active\"><a data-ui-sref=\"settings\">Settings</a></li> <li ui-sref-active=\"active\"><a data-ui-sref=\"about\">About</a></li> </ul> <a href=\"#\" data-activates=\"nav-mobile\" class=\"button-collapse\"><i class=\"material-icons\">menu</i></a> </div> <!--div class=\"nav-content container\">\r" +
    "\n" +
    "    <ul class=\"tabs\">\r" +
    "\n" +
    "      <li class=\"tab\"><a href=\"#test1\">Test 1</a></li>\r" +
    "\n" +
    "      <li class=\"tab\"><a class=\"active\" href=\"#test2\">Test 2</a></li>\r" +
    "\n" +
    "      <li class=\"tab disabled\"><a href=\"#test3\">Disabled Tab</a></li>\r" +
    "\n" +
    "      <li class=\"tab\"><a href=\"#test4\">Test 4</a></li>\r" +
    "\n" +
    "    </ul>\r" +
    "\n" +
    "  </div--> </nav> "
  );

}]);
