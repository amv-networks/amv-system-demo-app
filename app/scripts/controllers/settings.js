'use strict';

angular.module('amvSystemDemoUi')
  .controller('SettingsCtrl', [
    'Materialize',
    'SettingsResource',
    'amvSystemDemoUiSettingsTemplate',
    function (Materialize, SettingsResource, amvSystemDemoUiSettingsTemplate) {
      var self = this;

      var defaultSettings = amvSystemDemoUiSettingsTemplate;

      SettingsResource.findAll().then(function (settingsArray) {
        if (settingsArray.length !== 0) {
          self.config = angular.copy(settingsArray[0]);
        } else {
          SettingsResource.create(defaultSettings).then(function (resource) {
            self.config = angular.copy(resource);
          });
        }
      });

      this.saveSettings = function (settings) {
        SettingsResource.destroyAll().then(function () {
          SettingsResource.create(settings).then(function (resource) {
            self.config = angular.copy(resource);
            Materialize.toast('Settings saved!', 3000);
          });
        });
      };

      this.loadDefaultSettings = function () {
        self.config = angular.copy(defaultSettings);
      };

      this.addValueToVehicleIds = function (newVehicleId) {
        if (newVehicleId && newVehicleId > 0) {
          self.config.app.vehicleIds.push(newVehicleId);
        }
      };

      this.onKeyUpOnNewVehicleIdInput = function ($event, newVehicleId) {
        var keyEnterPressed = $event.keyCode === 13;
        if (keyEnterPressed) {
          self.addValueToVehicleIds(newVehicleId);
        }
      };

      this.removeVehicleIdWithValue = function (vehicleId) {
        var index = self.config.app.vehicleIds.indexOf(vehicleId);
        if (index >= 0) {
          self.config.app.vehicleIds.splice(index, 1);
        }
      };
    }]);
