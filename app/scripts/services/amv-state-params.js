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
