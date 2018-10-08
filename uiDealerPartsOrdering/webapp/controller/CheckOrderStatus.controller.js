sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel'
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel) {
	"use strict";
	var CONT_HEADERMODEL = "headerMenuModel";	
	
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CheckOrderStatus", {

			onInit : function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("CheckOrderStatus").attachPatternMatched(this._onObjectMatched, this);
				
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);
				
				var lv_headerMeneMode = this.getHeaderMenuModel(); 
				this.setModel(lv_headerMeneMode, CONT_HEADERMODEL);
				
			},
			
		
			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CS');
				//var oItem = this.byId('iconTabHeader');
			}
		});
	}
);