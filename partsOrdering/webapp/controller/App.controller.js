sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/model/json/JSONModel"
], function (BaseController, models, JSONModel) {
	"use strict";

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.App", {

		onInit: function () {
			
			var appStateModel = this.getAppStateModel();

			// load the security based profile 
			sap.ui.core.BusyIndicator.show(0);

			if (appStateModel.getProperty('/userProfile').userType !== "National") {
				sap.ui.core.BusyIndicator.hide();
				this.getRouter().navTo("CheckOrderStatus", null, true);

			} else {
				sap.ui.core.BusyIndicator.hide();
				this.getRouter().navTo("StartOrdering", null, true);

			}


		}
			
		
	});
});