/* jshint loopfunc:true */
'use strict';

angular.module('amvSystemDemoUi')
  .controller('VehicleReservationCtrl', ['$scope', '$log', '$timeout', '$q',
    'Materialize', 'jQuery', 'amvSystemDemoUiSettings',
    'amvXfcdClient', 'carSharingReservationClient', 'amvVehicleId',
    function ($scope, $log, $timeout, $q, Materialize, jQuery, amvSystemDemoUiSettings,
      amvXfcdClient, carSharingReservationClient, amvVehicleId) {
      var self = this;
      this.model = {
        vehicleId: amvVehicleId
      };

      (function initModals() {
        var cancelReservationModal = jQuery('#modal-cancel-reservation');
        self.cancelReservationModal = Materialize.Modal.init(cancelReservationModal)[0];
      })();

      if (!amvVehicleId) {
        Materialize.toast('`vehicleId` is invalid. Cannot show details.', 2000);
        self.error = {
          message: '`vehicleId` is invalid. Cannot show details.'
        };
        return;
      }

      var fetchData = function (vehicleId) {
        self.loading = true;

        var reservationsPromise = carSharingReservationClient.get().then(function (client) {
          return client.fetchReservations(vehicleId);
        }).then(function (response) {
          var hasData = !!response.data && response.data.length > 0;
          if (!hasData) {
            return [];
          }
          return response.data;
        });

        return $q.all([reservationsPromise])
          .then(dataArray => {
            var reservations = dataArray[0] || [];

            return {
              reservations: reservations
            };
          }).finally(function () {
            self.loading = false;
          });
      };

      var onVehicleReservations = function (vehicleData) {
        self.reservations = vehicleData.reservations;
      };

      var fetchMethod = function () {
        return fetchData(self.model.vehicleId).then(function (data) {
          if (data) {
            onVehicleReservations(data);
          }
          return data;
        });
      };

      this.onClickCancelReservation = function (reservation) {
        self.currentReservation = reservation;

        self.cancelReservationModal.open();
      };

      this.onClickCancelReservationConfirmed = function () {
        self.loading = true;

        var reservation = self.currentReservation;

        self.cancelReservationModal.close();

        carSharingReservationClient.get().then(function (client) {
          return client.cancelReservation(reservation.vehicleId, reservation.reservationId);
        }).then(function () {
          self.currentReservation = null;
          return fetchMethod();
        }).then(function () {
          Materialize.toast('Reservation ' + reservation.reservationId + ' has been deleted.', 2000);
        }).catch(function () {
          Materialize.toast('There has been an error. Reservation could not be deleted', 2000);
        }).finally(function () {
          self.loading = false;
        });
      };

      (function init() {
        self.reservations = [];

        fetchMethod().then(function () {
          Materialize.toast('Finished loading reservations!', 2000);
        }).catch(function (e) {
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

      })();
    }]);
