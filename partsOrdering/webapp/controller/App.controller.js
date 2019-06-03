sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/model/json/JSONModel"
], function (BaseController, models, JSONModel) {
	"use strict";

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.App", {

		onInit: function () {
			var that = this;

			var resourceBundle = this.getResourceBundle();
			var appStateModel = this.getAppStateModel();

			// load the security based profile 
			sap.ui.core.BusyIndicator.show(0);
			this.getAppProfile(function (profileModel) {
				sap.ui.core.BusyIndicator.hide();

				if (!!profileModel) {
					var profileModelData = profileModel.getData();
					if (!!profileModelData.scopes.DealerBooking) {
						appStateModel.setProperty('/visiblePA', false);
						
						that.getRouter().navTo("DealerBooking", {
							encodedKey: "NEW"
						}, true);
						

					} else {
						appStateModel.setProperty('/visiblePA', true);
						that.getRouter().navTo("SearchProgram", null, true);
						
					}

			
			
		}
	});
});