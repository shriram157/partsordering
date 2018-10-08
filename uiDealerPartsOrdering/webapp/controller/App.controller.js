sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/model/json/JSONModel"
], function(BaseController, models, JSONModel) {
	"use strict";
	
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.App", {

			onInit : function () {
				this.initMessageHover();
			}
		});
	}
);