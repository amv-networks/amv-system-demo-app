'use strict';

/**
 * @ngdoc function
 * @name amvGeolocationUi.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the amvGeolocationUi
 */
angular.module('amvGeolocationUi')
.directive('amvVehicleDetail', [function () {
    return {
      transclude: true,
      scope: {
        vehicle: '&vehicle'
      },
      controllerAs: 'ctrl',
      controller: ['$scope', function($scope) {
        var self = this;

        var vehicle = $scope.vehicle();
        $scope.model = {};
        $scope.model.vehicle = vehicle;
        $scope.model.requestTime = moment(vehicle.requestTime);
        $scope.model.requestTimeFromNow = moment(vehicle.requestTime).fromNow();
        $scope.model.positionTime = moment(vehicle.data.timestamp);
        $scope.model.positionTimeFromNow = moment(vehicle.data.timestamp).fromNow();

        this.map = {
          center: {
            lat:  $scope.model.vehicle.location.lat,
            lng:  $scope.model.vehicle.location.lng,
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
        addMarkerForGeolocationToMap($scope.model.vehicle);
        zoomToLocation($scope.model.vehicle, 17);
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

  .directive('materializeTooltipped', ['$compile', '$timeout', function ($compile, $timeout) {
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
