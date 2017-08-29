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
        }).catch(function () {
          self.error = 'Error while loading state params.';
        }).finally(function () {
          self.loading = false;
        });
      })();
    }]);
