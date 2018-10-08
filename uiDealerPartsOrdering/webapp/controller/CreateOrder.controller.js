sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel'
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel) {
	"use strict";


	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CreateOrder", {

				

			onInit : function () {

				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);
				
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("CreateOrder").attachPatternMatched(this._onObjectMatched, this);

				var myData = {
					
					items : 
						[	
							{	line : 10,
								pnumber : "adad1234",
								pdesc : "desc1 1",		
								SPQ :10,
								orderqty :10,
								fillBo : 10,
								comment :"comment 1" 
							},
							{	line : 30,
								pnumber : "adad1234",
								pdesc : "desc1 1",		
								SPQ :10,
								orderqty :10,
								fillBo : 10,
								comment :"comment 1" 
							},
							{	line : 40,
								pnumber : "adad1234",
								pdesc : "desc1 1",		
								SPQ :10,
								orderqty :10,
								fillBo : 10,
								comment :"comment 1" 
							},
							{	line : 50,
								pnumber : "adad1234",
								pdesc : "desc1 1",		
								SPQ :10,
								orderqty :10,
								fillBo : 10,
								comment :"comment 1" 
							},
							{	line : 20,
								pnumber : "adad1234",
								pdesc : "desc1 1",		
								SPQ :10,
								orderqty :10,
								fillBo : 10,
								comment :"comment 1" 
							}
						]
	
					};
				
				var xModel = new JSONModel();
				xModel.setData(myData);
				this.getView().setModel(xModel);
				
//				this.getView().setModel(xModel, "xModel");
//				oMessagePopover.setModel(oModel);
			},
			
			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');
				//var oItem = this.byId('iconTabHeader');
			}			
		});
		
	}
);