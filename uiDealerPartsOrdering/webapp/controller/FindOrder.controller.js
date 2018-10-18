sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel'
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel) {
	"use strict";
	var CONST_VIEW_MODEL = 'viewModel';
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.FindOrder", {

			onInit : function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("FindOrder").attachPatternMatched(this._onObjectMatched, this);
				
	
				var viewState = { filterPanelEnable : false, orders: []};
				var viewModel = new JSONModel();
				viewModel.setData(viewState);
				this.setModel(viewModel, CONST_VIEW_MODEL);

			},
			
			_onObjectMatched: function (oEvent) {
				// default mode
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'FO');
				this.setModel(appStateModel);

				//var oItem = this.byId('iconTabHeader');
				var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');


				var viewModel = this.getModel(CONST_VIEW_MODEL);
		
				this.getOrdersWithDealerCode(dealerCode, null, function(results){
					
					viewModel.setProperty('/orders', results);
				});
			},
			
			
			
			onExpandFilter: function(oEvevt){
				var viewModel = this.getModel(CONST_VIEW_MODEL);
				var togglePanel = viewModel.getProperty('/filterPanelEnable');
				viewModel.setProperty('/filterPanelEnable', !togglePanel);
				
			}
		});
		
	}
);