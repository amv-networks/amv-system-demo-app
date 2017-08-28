/* jshint loopfunc:true */
'use strict';

angular.module('amvGeolocationUi')
  .controller('VehicleDetailCtrl', ['$scope', '$log', '$timeout',
    'Materialize', 'amvClientSettings', 'amvXfcdClient', 'amvVehicleId',
    function ($scope, $log, $timeout, Materialize, amvClientSettings, amvXfcdClient, amvVehicleId) {

      if(!amvVehicleId) {
          Materialize.toast('`vehicleId` is invalid. Cannot show details.', 2000);
          $scope.error = '`vehicleId` is invalid. Cannot show details.';
          return;
      }

      var self = this;

      function apiResponseToGeolocation(data) {
        return {
          id: data.id,
          name: data.id,
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

        $scope.loading = true;
        $scope.locations = [];

        var fetchData = function (vehicleIds) {
          $scope.loading = true;

          return amvXfcdClient.get().then(function (client) {
            return client.getLastData(vehicleIds);
          }).then(function (response) {
            $log.log('ok, got data');

            var hasData = !!response.data && response.data.length > 0;
            if (!hasData) {
              return [];
            }
            return response.data;
          }).catch(function (e) {
            $log.log('error, while getting data');
            $log.log(e);

            var isAmvException = e && e.response && e.response.data && e.response.data.message;
            var errorMessage = isAmvException ? e.response.data.message : e;
            Materialize.toast(errorMessage, 4000);
            Materialize.toast('Please check your settings.', 5000);
          }).finally(function () {
            $timeout(function () {
              $scope.loading = false;
            }, 333);
          });
        };

        var fetchDataAndPopulateLocations = function (vehicleIds) {
          return fetchData(vehicleIds).then(function (dataArray) {

            $scope.locations = [];

            dataArray.forEach(function (data) {
              var position = apiResponseToGeolocation(data);

              $scope.locations.push(position);
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
          var vehicleIds = [amvVehicleId];
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
          });
        }).catch(function (e) {
          $log.log(e);
          $scope.loading = false;
          Materialize.toast('Please check your settings.', 3000);
        });

      })();
    }]);
