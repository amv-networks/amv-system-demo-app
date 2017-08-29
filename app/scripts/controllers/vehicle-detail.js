/* jshint loopfunc:true */
'use strict';

angular.module('amvSystemDemoUi')
  .controller('VehicleDetailCtrl', ['$log', '$timeout',
    'Materialize', 'amvClientSettings', 'amvXfcdClient', 'amvDemoVehicle', 'amvVehicleId',
    function ($log, $timeout, Materialize, amvClientSettings, amvXfcdClient, amvDemoVehicle, amvVehicleId) {
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
            self.vehicles = [];

            dataArray.forEach(function (data) {
              var vehicle = apiResponseToVehicle(data);

              self.vehicles.push(vehicle);
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
          }).catch(function (e) {
            var demoMode = vehicleIds && vehicleIds[0] === '-1';
            if (demoMode) {
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
        }).catch(function (e) {
          $log.log(e);
          self.loading = false;
          Materialize.toast('Please check your settings.', 3000);
        });

      })();
    }]);
