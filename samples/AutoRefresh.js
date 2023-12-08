'use strict';

(function () {
  const defaultIntervalInMin = '15';
  let interval2 = '15';
  let refreshInterval;
  let activeDatasourceIdList = [];

  function initializeExtension() {
    tableau.extensions.initializeAsync({'configure': configure}).then(function() {
      getSettings();
      tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        updateExtensionBasedOnSettings(settingsEvent.newSettings);
      });

      // Inicia a extensão apenas quando o painel é aberto
      startExtension();
    });
  }

  function getSettings() {
    let currentSettings = tableau.extensions.settings.getAll();
    if (currentSettings.selectedDatasources) {
      activeDatasourceIdList = JSON.parse(currentSettings.selectedDatasources);
    }  
    if (currentSettings.intervalkey){
      interval2 = currentSettings.intervalkey;
    }
    if (currentSettings.selectedDatasources){
      $('#inactive').hide();
      $('#active').show();
      $('#interval').text(currentSettings.intervalkey);
      $('#datasourceCount').text(activeDatasourceIdList.length);
    }
  }

  function configure() {
    const popupUrl = `${window.location.origin}/extensoes/samples/AutoRefreshDialog.html`;
    tableau.extensions.ui.displayDialogAsync(popupUrl, defaultIntervalInMin, { height: 500, width: 500 }).then((closePayload) => {
      $('#inactive').hide();
      $('#active').show();
      $('#interval').text(closePayload);
      startExtension();
    }).catch((error) => {
      switch(error.errorCode) {
        case tableau.ErrorCodes.DialogClosedByUser:
          console.log("Dialog was closed by user");
          break;
        default:
          console.error(error.message);
      }
    });
  }

  function startExtension() {
    setupRefreshInterval(interval2);
  }

  function stopExtension() {
    clearInterval(refreshInterval);
  }

  function setupRefreshInterval(interval) {
    refreshInterval = setInterval(function() { 
      let dashboard = tableau.extensions.dashboardContent.dashboard;
      dashboard.worksheets.forEach(function (worksheet) {
        worksheet.getDataSourcesAsync().then(function (datasources) {
          datasources.forEach(function (datasource) {
            if (activeDatasourceIdList.indexOf(datasource.id) >= 0) {
              datasource.refreshAsync();
            }
          });
        });
      });
    }, interval * 1000);
  }

  function updateExtensionBasedOnSettings(settings) {
    if (settings.selectedDatasources) {
      activeDatasourceIdList = JSON.parse(settings.selectedDatasources);
      $('#datasourceCount').text(activeDatasourceIdList.length);
    }
  }

  // Chama a função de inicialização quando o documento está pronto
  $(document).ready(initializeExtension);

})();
