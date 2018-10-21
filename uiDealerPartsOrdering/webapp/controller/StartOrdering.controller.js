sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/model/json/JSONModel"
], function(BaseController, models, JSONModel) {
	"use strict";
	
	var CONT_OTLISTMODEL = "orderTypeListModel";	
	var CONT_HEADERMODEL = "headerMenuModel";	
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.StartOrdering", {


			onInit : function () {
				// default mode
				var appStateModel = this.getStateModel();
				this.setModel(appStateModel);

				//message
				var oMessageManager = sap.ui.getCore().getMessageManager();
            	this.setModel(oMessageManager.getMessageModel(), "message");
	            // or just do it for the whole view
    	        oMessageManager.registerObject(this.getView(), true);
				
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("StartOrdering").attachPatternMatched(this._onObjectMatched, this);

				this.checkDealerInfo();

				var currentOrderTypeList = { displayUi : true, typeList : []	};
				var orderTypeListModel =  new sap.ui.model.json.JSONModel();
				orderTypeListModel.setData(currentOrderTypeList);
				this.setModel(orderTypeListModel, CONT_OTLISTMODEL);
				
				var lv_headerMeneMode = this.getHeaderMenuModel(); 
				this.setModel(orderTypeListModel, CONT_HEADERMODEL);
			},

			_onObjectMatched: function (oEvent) {
				this.checkDealerInfo();
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');
				
				// find the proper user type related info
				var appStateModel = this.getModel();
				var userType = appStateModel.getProperty('/userInfo/userType');
				
				var viewDataModel =	this.getUserTypeSelectionModel();
				var viewData = viewDataModel.getData();
				var currentOrderTypeList = [];
				for (var i=0; i< viewData.userTypes.length; i++){
					if(userType === viewData.userTypes[i].type){
						currentOrderTypeList = viewData.userTypes[i].orderTypeList;
					}
				}
				
				var orderListModel = this.getModel(CONT_OTLISTMODEL);
				orderListModel.setProperty('/typeList', currentOrderTypeList);
				//var oItem = this.byId('iconTabHeader');
			},


			onCreateOrder : function(event){
				var that = this;
				// check the information entered here
				
//				that.getRouter().navTo("CreateOrder", draftData, false);
				that.getRouter().navTo("CreateOrder", null, false);

				// var vModel = this.getView().getModel();
				// this.createOrderDraft(vModel.getData(), function(draftData){
				// 	that.getRouter().navTo("CreateOrder", draftData, false);
				// });
			}
		});
	}
);