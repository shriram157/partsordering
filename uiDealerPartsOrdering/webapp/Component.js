sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"tci/wave2/ui/parts/ordering/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("tci.wave2.ui.parts.ordering.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			models.createBusinessPartnerModel();
			
			//
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			
			// Parse the current url and display the targets of the route that matches the hash
			this.getRouter().initialize();
		}
	});
});