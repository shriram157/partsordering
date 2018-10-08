sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel'
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel) {
	"use strict";

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.FindOrder", {

			onInit : function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("FindOrder").attachPatternMatched(this._onObjectMatched, this);
				
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);

			},
			
			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'FO');
				//var oItem = this.byId('iconTabHeader');
			}			
		});
		
	}
);