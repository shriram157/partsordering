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
				
				this.orderTypeField = this.byId("orderTypeInput");
				this.orderNumberField = this.byId("orderNumberInput");
				var lv_headerMeneMode = this.getHeaderMenuModel(); 
				this.setModel(orderTypeListModel, CONT_HEADERMODEL);
			},

			_onObjectMatched: function (oEvent) {
				var that = this;
				if (!this.checkDealerInfo()){
					return false;
				}
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
				
				// default
				var bpCode = appStateModel.getProperty('/selectedBP/bpNumber');
				var orderListModel = this.getModel(CONT_OTLISTMODEL);
				orderListModel.setProperty('/typeList', currentOrderTypeList);


				this.getBusinessPartnersByID(bpCode, function(sData){
					if(!!sData && !!sData.to_Customer ){
						var zGroup = sData.BusinessPartnerType;
						var dealerType = sData.to_Customer.Attribute1;
						appStateModel.setProperty('/selectedBP/bpType', dealerType );
						appStateModel.setProperty('/selectedBP/bpGroup', zGroup );
						if ('Z001' === zGroup ){

							// redefine the order list 
							that.getSalesDocTypeByBPCode(bpCode, dealerType, function(lData){
								if(!!lData){
									currentOrderTypeList = lData;
				 				} else {
				 					currentOrderTypeList = [];
				 				}
				 				orderListModel.setProperty('/typeList', currentOrderTypeList);
							});
							
						}
					}
				});
				

				//var oItem = this.byId('iconTabHeader');
			},
			
			onOrderTypeChange : function(event){
				var vModel = this.getView().getModel();
				var orderType = vModel.getProperty('/selectedOrderMeta/order_type');
				if (!!orderType){
					this.orderTypeField.setValueState(null);
					this.orderTypeField.setValueStateText(null);
				}
			},
			onBack : function(event){
				var that = this;
				that.getRouter().navTo("FindOrder", null, false);
			},			

			onCreateOrder : function(event){
				var resourceBundle = this.getResourceBundle();
				var vModel = this.getView().getModel();

				var orderNumber = vModel.getProperty('/selectedOrderMeta/order_id');
				var orderType = vModel.getProperty('/selectedOrderMeta/order_type');

				var hasError = false;
//				if (!!!orderNumber || orderNumber.length < 5 || orderNumber.length >40){
				if (!!!orderNumber ){
					this.orderNumberField.setValue(" ");
					hasError = true;
				}

				if (!!!orderType){
					this.orderTypeField.setValueState(sap.ui.core.ValueState.Error);
					this.orderTypeField.setValueStateText(resourceBundle.getText('Error.noOrderType'));
					hasError = true;
				}
				if (hasError){
					return false;
				} else {
					sap.ui.getCore().getMessageManager().removeAllMessages();
					this.getRouter().navTo("CreateOrder", {orderNum : orderNumber, orderType : orderType});
				}
			}
		});
	}
);