sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createOrderTypeModel : function() {
			var orderTypeData = {
				"lala" :  "{i18n>x1}"
			};
			return null;
		},

		createBusinessPartnerModel : function() {
			var odataModel = sap.ui.getCore().getModel("BusinessPartnerModel");
			if (odataModel  === null || odataModel === undefined){
//				odataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/API_BUSINESS_PARTNER/", true, "PA_FUT_060", "Testing@123");
				odataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/API_BUSINESS_PARTNER/", 
				{	json : true,
					useBatch : true,
					loadMetadataAsync : true
				});
				sap.ui.getCore().setModel(odataModel, "BusinessPartnerModel");
			}
			return odataModel;
		},
		
		createPurchaseOrderModel : function() {
			
		},
		
		getAppStateModel: function(){
			var odataModel = sap.ui.getCore().getModel("APP_STATE_MODEL");
			if (odataModel  === null || odataModel === undefined){
				var oAppState = { 
					messageListLength : 0,
					tabKey : 'CO',
					userInfo : {
						userType : "",
						code : "",
						userTypeName : "",
					},
					selectedBP : {
						dealerCode : "",
						bpNumber :"",
						bpName : ""	
					},
					selectedOrderMeta : {
						order_type : "",
						order_name : "",
						order_id :""
					}
				};
				odataModel = new sap.ui.model.json.JSONModel();
				odataModel.setData(oAppState);
				sap.ui.getCore().setModel(odataModel, "APP_STATE_MODEL");

			}
			return 	odataModel;
		}
					
	};
});