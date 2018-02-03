'use strict';

angular.module('amvSystemDemoUi')
  .factory('amvStateParams', ['$q',  '$log',
    'amvContractClient',
    'authContractId',
    function ($q, $log, amvContractClient, authContractId) {
    return {
      get: function() {
        return amvContractClient.get().then(function (client) {
          return authContractId.get().then(function(contractId) {
              return client.fetchDataPackage(contractId);
          });
        }).then(function (response) {
          $log.log('ok, got data');
          return response.data;
        }).then(function(datapackage) {
            return datapackage.params.states;
        });
      }
    };
  }]);
