'use strict';

angular.module('amvSystemDemoUi')
  .factory('amvStateParams', ['$q', function ($q) {
    // TODO: fetch state param from rest endpoint
    var data = [
      {
        'ID' : 1,
        'CODE' : 'vbat',
        'NAME' : 'Batteriespannung',
        'DESC' : 'Spannung in Volt',
        'NAMEEN' : 'battery voltage',
        'DESCEN' : 'voltage in V',
        'DATATYPE' : 'FLOAT',
        'SCALE' : 2,
        'UNIT' : 'V',
        'OFFRESET' : 0
      },
      {
        'ID' : 2,
        'CODE' : 'gsmt',
        'NAME' : 'Temperatur des GSM Moduls',
        'DESC' : 'Temperatur in °C',
        'NAMEEN' : 'GSM module temperature',
        'DESCEN' : 'Temperature in °C',
        'DATATYPE' : 'FLOAT',
        'SCALE' : 1,
        'UNIT' : '°C',
        'OFFRESET' : 1
      },
      {
        'ID' : 3,
        'CODE' : 'cbaud',
        'NAME' : 'CAN bus Geschwindigkeit',
        'DESC' : 'baud-Rate',
        'NAMEEN' : 'CAN bus speed',
        'DESCEN' : 'baud rate',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'bps',
        'OFFRESET' : 0
      },
      {
        'ID' : 4,
        'CODE' : 'cdiag',
        'NAME' : 'CAN Bus Diagnose',
        'DESC' : '(0=OK, 1=allgemeiner Fehler)',
        'NAMEEN' : 'CAN bus diagnostic',
        'DESCEN' : '(0=OK, 1=common error)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 5,
        'CODE' : 'trsf',
        'NAME' : 'Trip Start Flag',
        'DESC' : '(0=aus, 1=Fahrtbeginn)',
        'NAMEEN' : 'trip start flag',
        'DESCEN' : '(0=off, 1=trip started)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 6,
        'CODE' : 'move',
        'NAME' : 'Bewegungsflag',
        'DESC' : '0=Fahrzeug steht (Geschw.<15km/h), 1=Fahrzeug in Bewegung (Geschw.>=15km/h)',
        'NAMEEN' : 'movement flag',
        'DESCEN' : '0=vehicle doesn\'t move (speed<15km/h), 1=vehicle moves (speed >=15km/h)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 7,
        'CODE' : 'dtid',
        'NAME' : 'Id der Karte + akzeptiert',
        'DESC' : 'Format: <dtid>,<akzeptiert>; akzeptiert: 0=nein, 1=ja',
        'NAMEEN' : 'driver tag id + accepted',
        'DESCEN' : 'format: <dtid>,<accepted>; accepted: 0=no, 1=yes',
        'DATATYPE' : 'STRING',
        'SCALE' : null,
        'UNIT' : null,
        'OFFRESET' : 0
      },
      {
        'ID' : 8,
        'CODE' : 'fcrd',
        'NAME' : 'Status der Tankkarte',
        'DESC' : '(0=entnommen, 1=eingelegt)',
        'NAMEEN' : 'state of fuel card',
        'DESCEN' : '(0=removed, 1=inserted)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 9,
        'CODE' : 'keys',
        'NAME' : 'Status des Schlüsseltresors',
        'DESC' : '(0=verriegelt, 1=entriegelt)',
        'NAMEEN' : 'state of key save',
        'DESCEN' : '(0=locked, 1=unlocked)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 10,
        'CODE' : 'keye',
        'NAME' : 'Schlüsselereignis',
        'DESC' : '(0=verriegeln, 1=entriegeln)',
        'NAMEEN' : 'key event',
        'DESCEN' : '(0=locking, 1=unlocking)',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 11,
        'CODE' : 'cskm',
        'NAME' : 'Meldungen den CarSharingKits',
        'DESC' : 'Fehlermeldungen oder Debugmeldungen',
        'NAMEEN' : 'notifications of car sharing kit',
        'DESCEN' : 'error messages or debug messages',
        'DATATYPE' : 'STRING',
        'SCALE' : null,
        'UNIT' : null,
        'OFFRESET' : 0
      },
      {
        'ID' : 12,
        'CODE' : 'pol',
        'NAME' : 'Liste der bevorzugten Mobilfunknetzbetreiber',
        'DESC' : 'Format: <MCC><MNC>[,<MCC><MNC>]{0,49}',
        'NAMEEN' : 'preferred operator list',
        'DESCEN' : 'format: <MCC><MNC>[,<MCC><MNC>]{0,49}',
        'DATATYPE' : 'STRING',
        'SCALE' : null,
        'UNIT' : null,
        'OFFRESET' : 0
      },
      {
        'ID' : 13,
        'CODE' : 'cidl',
        'NAME' : 'Liste der empfangenen CAN-Nachrichten IDs',
        'DESC' : 'Format: <cid>[,<cid>]{1,n}',
        'NAMEEN' : 'list of receive CAN message ids',
        'DESCEN' : 'format: <cid>[,<cid>]{1,n}',
        'DATATYPE' : 'STRING',
        'SCALE' : null,
        'UNIT' : null,
        'OFFRESET' : 0
      },
      {
        'ID' : 14,
        'CODE' : 'nsm',
        'NAME' : 'Netzwahl Methode',
        'DESC' : '0*=Benutzergesteuerte PLMN-Auswahl mit Zugangstechnologie EFPLMNwAcT, wenn nicht auf der SIM zu finden kommt PLMN-Liste bevorzugter EFPLMNsel zur Anwendung; 1=Betreibergesteuerte PLMN-Auswahl mit Zugangstechnologie EFOPLMNwAcT; 2=HPLMN-Auswahl mit Zugangstechnologie EFHPLMNwAcT',
        'NAMEEN' : 'network selection method',
        'DESCEN' : '0*=User controlled PLMN selector with Access Technology EFPLMNwAcT, if not found in the SIM/UICC then PLMN preferred list EFPLMNsel; 1=Operator controlled PLMN selector with Access Technology EFOPLMNwAcT; 2=HPLMN selector with Access Technology EFHPLMNwAcT',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'ENUM',
        'OFFRESET' : 0
      },
      {
        'ID' : 15,
        'CODE' : 'neft',
        'NAME' : 'Gesamt-Verbindungsdauer',
        'DESC' : 'gesamte Zeitspanne ab GSM Einwahl bis eine IP-Verbindung erreicht wurde',
        'NAMEEN' : 'Network Fixing Time',
        'DESCEN' : 'required total time to establish an ip connection beginning with mobile network dial in',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'Sekunden',
        'OFFRESET' : 0
      },
      {
        'ID' : 16,
        'CODE' : 'nsft',
        'NAME' : 'IP Verbindungsdauer',
        'DESC' : 'Zeitspanne die zum Öffnen des TCP-Sockets benötigt wurde, nach Aufbau der GSM-Verbindung',
        'NAMEEN' : 'Socket Fixing Time',
        'DESCEN' : 'required time to open the IP socket after establishing mobile network connection',
        'DATATYPE' : 'INT',
        'SCALE' : 0,
        'UNIT' : 'Sekunden',
        'OFFRESET' : 0
      }
    ];

    return {
      get: function () {
        var deferred = $q.defer();

        setTimeout(function () {
          deferred.resolve(data);
        }, 10);

        return deferred.promise;
      }
    };
  }]);
