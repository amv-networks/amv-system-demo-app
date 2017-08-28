/* jshint loopfunc:true */
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
        }).catch(function () {
          self.error = 'Error while loading can params.';
        }).finally(function () {
          self.loading = false;
        });
      })();
    }]);
