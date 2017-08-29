/* jshint loopfunc:true */
'use strict';

angular.module('amvSystemDemoUi')
  .controller('MainCtrl', ['$scope', '$log', '$timeout',
    'Materialize', 'amvClientSettings', 'amvXfcdClient', 'amvDemoVehicle',
    function ($scope, $log, $timeout, Materialize, amvClientSettings, amvXfcdClient, amvDemoVehicle) {
      var self = this;

      this.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
      ];

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

        var fetchDataAndPopulateLocations = function (vehicleIds) {
          return fetchData(vehicleIds).then(function (dataArray) {

            removeMarkersFromMap();
            self.vehicles = [];

            dataArray.forEach(function (data) {
              var vehicle = apiResponseToVehicle(data);
              addVehicle(vehicle);
            });

            return dataArray;
          });
        };

        var invokeRecursiveFetchDataAndPopulateLocations = function (vehicleIds, timeoutIntervalInMilliseconds) {
          var actualTimeoutIntervalInMilliseconds = 1000 + Math.max(timeoutIntervalInMilliseconds, 5000);

          return fetchDataAndPopulateLocations(vehicleIds).then(function (dataArray) {
            $timeout(function () {
              invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, actualTimeoutIntervalInMilliseconds);
            }, actualTimeoutIntervalInMilliseconds);

            return dataArray;
          });
        };

        amvClientSettings.get().then(function (settings) {
          self.settings = settings;
          return settings;
        }).then(function (settings) {
          self.settings = settings;
          var apiSettings = settings.api || {};
          var vehicleIds = apiSettings.options.vehicleIds || [];
          var timeoutIntervalInMilliseconds = (settings.periodicUpdateIntervalInSeconds || 10) * 1000;

          var runRecursive = settings.enablePeriodicUpdateInterval;

          var fetchMethod = runRecursive ? function () {
            return invokeRecursiveFetchDataAndPopulateLocations(vehicleIds, timeoutIntervalInMilliseconds);
          } : function () {
            return fetchDataAndPopulateLocations(vehicleIds);
          };

          fetchMethod().then(function (data) {
            if (data.length === 0) {
              Materialize.toast('Response contains empty data!', 2000);
            } else {
              Materialize.toast('Finished loading ' + data.length + ' location(s)', 1000);
            }
          }).catch(function (e) {
            if (settings.enableDemoData) {
              addVehicle(amvDemoVehicle);
              return;
            }

            $log.log('error, while getting data');
            $log.log(e);

            var isAmvException = e && e.response && e.response.data && e.response.data.message;
            var errorMessage = isAmvException ? e.response.data.message : e;
            Materialize.toast(errorMessage, 4000);
            Materialize.toast('Please check your settings.', 5000);
          });
        }).catch(function (e) {
          self.loading = false;

          addVehicle(amvDemoVehicle);

          $log.log(e);
          Materialize.toast('Please check your settings.', 3000);
        });

      })();
    }]);
