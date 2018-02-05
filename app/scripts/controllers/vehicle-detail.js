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

        self.demoMode = amvVehicleId === amvDemoVehicle.id;

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
