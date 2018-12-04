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
						bpName : ""	,
						customer : ''
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