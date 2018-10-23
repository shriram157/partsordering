sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"tci/wave2/ui/parts/ordering/model/formatter"		
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel, formatter) {
	"use strict";
	var CONST_VIEW_MODEL = 'viewModel';
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.FindOrder", {
			
			formatter: formatter,
			
			onInit : function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("FindOrder").attachPatternMatched(this._onObjectMatched, this);
				
				// default mode
				var appStateModel = this.getStateModel();
				this.setModel(appStateModel);

				//message
				var oMessageManager = sap.ui.getCore().getMessageManager();
            	this.setModel(oMessageManager.getMessageModel(), "message");
	            // or just do it for the whole view
    	        oMessageManager.registerObject(this.getView(), true);

				//view model 
				var viewState = { filterPanelEnable : false, contHigh : "85%", orders: []};
				var viewModel = new JSONModel();
				viewModel.setData(viewState);
				this.setModel(viewModel, CONST_VIEW_MODEL);

				this.checkDealerInfo();

			},
			
			_onObjectMatched: function (oEvent) {
				// default mode
				sap.ui.getCore().getMessageManager().removeAllMessages();
				if(!this.checkDealerInfo()){
					return;
				}
				
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'FO');
				this.setModel(appStateModel);	
				this.refresh();

			},
			
			onAdd : function(oEvent){
				sap.ui.getCore().getMessageManager().removeAllMessages();
				this.getRouter().navTo("StartOrdering", null, false);				
			}, 
			
			onEdit : function(oEvent){
    			var model = this.getModel(CONST_VIEW_MODEL);
        		var path = oEvent.getSource().getBindingContext(CONST_VIEW_MODEL).getPath();
    			var obj = model.getProperty(path);				
    			
				sap.ui.getCore().getMessageManager().removeAllMessages();
				this.getRouter().navTo("CreateOrder", {orderNum : obj.orderNumber, orderType : obj.scOrderType});				
			},
			
			onSearch : function(oEvent){
				this.refresh();
			},
			
			refresh : function(){
				//take the existing conditions get the data
				var appStateModel = this.getStateModel();
				//var oItem = this.byId('iconTabHeader');
				var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
				var viewModel = this.getModel(CONST_VIEW_MODEL);
				
				sap.ui.core.BusyIndicator.show(0);
				this.getDraftsWithDealerCode(dealerCode, null, function(results){
				 	viewModel.setProperty('/orders', results);
				 	sap.ui.core.BusyIndicator.hide();
				});
			},
			
			onExpandFilter: function(oEvevt){
				var viewModel = this.getModel(CONST_VIEW_MODEL);
				var togglePanel = viewModel.getProperty('/filterPanelEnable');
				var togglePanel = !togglePanel;
				var filterButton = this.byId('filterButton');
				if (togglePanel) {
					filterButton.setIcon('sap-icon://collapse');
					viewModel.setProperty('/contHigh', "70%");
				} else {
					filterButton.setIcon('sap-icon://add-filter');					
					viewModel.setProperty('/contHigh', "80%");
				}
				viewModel.setProperty('/filterPanelEnable', togglePanel);
				
			}
		});
		
	}
);