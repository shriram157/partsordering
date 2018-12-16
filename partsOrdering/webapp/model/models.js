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
						bpGroup : "",
						dealerType : "",
						customer : ''
					},
					userProfile : {
						loaded : false,
						firstName :'',
						lastName  :'',
						dealerCode : '',
						language : '',
						userType  : '',
						division : '',
						email : ''						
					},
					selectedOrderMeta : {
						order_type : "",
						order_name : "",
						order_id :""
					},
					appLinkes : {
						loaded : false,
						PARTS_AVAILIBILITY : ''
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