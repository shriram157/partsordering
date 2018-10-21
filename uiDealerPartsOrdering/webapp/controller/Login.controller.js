sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "sap/ui/model/json/JSONModel"
], function(BaseController, models, Message, MessageType, JSONModel) {
	"use strict";

	var CONT_VIEWMODEL = "viewModel";
	var CONT_BPLISTMODEL = "bpListModel";	

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.Login", {

			onInit : function () {
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);
				
				//message
				var oMessageManager = sap.ui.getCore().getMessageManager();
            	this.setModel(oMessageManager.getMessageModel(), "message");
	            // or just do it for the whole view
    	        oMessageManager.registerObject(this.getView(), true);
            
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("StartOrdering").attachPatternMatched(this._onObjectMatched, this);
				
				var viewDataModel =	this.getUserTypeSelectionModel();
				this.setModel(viewDataModel, CONT_VIEWMODEL);

				var currentBpList = { displayUi : true, bpList : []	}; 	
				
				var bpListModel = new sap.ui.model.json.JSONModel();
				bpListModel.setData(currentBpList);
				this.setModel(bpListModel, CONT_BPLISTMODEL);


				this.userTypeField = this.byId("__user_type");
				this.dealerCodeField = this.byId("__bp_info");
			},

			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', '');
			},

			getBusinessPartnerByType : function(type, callback){
				// the model should be there. .....
				var that = this;
				var model = this.getModel(CONT_VIEWMODEL);
				var modelData = model.getData();
				var userTypes = modelData.userTypes;
				var iUserType = null;
				var isModelChanged = false;
				var currentUserType = null;
				for (var i = 0; i < userTypes.length; i++){
					iUserType = userTypes[i];
					if (iUserType.type === type ){
						//var iUserType = modelData.userTypes[type];
						var vModel = this.getView().getModel();
						vModel.setProperty('/userInfo/userType', iUserType.type );
						vModel.setProperty('/userInfo/userTypeName', iUserType.name );
						vModel.setProperty('/userInfo/code', iUserType.code );
						
						if (!!iUserType.init){
							callback(iUserType.bpsNode, iUserType.orderTypeList);
						} else {
							currentUserType = iUserType;
							this.getBusinessPartnersByType(iUserType.code, (bpList)=>{

								// cache the data
								currentUserType.bpsNode = bpList;
								currentUserType.init = true;
								isModelChanged = true;
								model.setData(modelData);
								that.setModel(model, CONT_VIEWMODEL);
						
								callback(bpList, currentUserType.orderTypeList);
							});
						}
						break;
					}
					
				}
			},

			onBPChange : function(event){
				var newValue = event.getParameter('newValue');
				var listModel = this.getModel(CONT_BPLISTMODEL);
				var list = listModel.getProperty('/bpList');
				var resourceBundle = this.getResourceBundle();
				
				var vModel = this.getView().getModel();
				var key = vModel.getProperty('/selectedBP/dealerCode');
				
				var item = null;
				if (!!!key){
					key = newValue;
				}
				for (var i = 0; i< list.length; i++){
					if (list[i].Dealer === key){
						item = list[i];	
					}
				}
				
				if (!!item){
					vModel.setProperty('/selectedBP/bpNumber', item.BusinessPartner);
					vModel.setProperty('/selectedBP/bpName', item.Name);
					vModel.setProperty('/selectedBP/customer', item.Customer);
					this.dealerCodeField.setValueState(null);
					this.dealerCodeField.setValueStateText(null);							
				} else {
					// not a valid code
					this.dealerCodeField.setValueState(sap.ui.core.ValueState.Error);
					this.dealerCodeField.setValueStateText(resourceBundle.getText('Error.Login.noValidDealerCode'));
					return false;
				}
			},
			
			onUserTypeChange : function(event){
				var that = this;

				var selectedKey = event.getParameter('selectedItem').mProperties['key'];
	
				this.userTypeField.setValueState(null);
				this.userTypeField.setValueStateText(null);				
	
				sap.ui.core.BusyIndicator.show(0);
				this.getBusinessPartnerByType(selectedKey, (bpData, oderTypeList)=>{
					// switch the bpList display and provide the data 
					var model = this.getModel(CONT_BPLISTMODEL);
					var modelData = model.getData();
					modelData.displayUi = true; 
					modelData.bpList = bpData;
					model.setData(modelData);
					that.setModel(model, CONT_BPLISTMODEL);
					sap.ui.core.BusyIndicator.hide();					
				});
				
			},
			
			onNext : function(){
				
				var resourceBundle = this.getResourceBundle();
				var vModel = this.getView().getModel();

				var dealerCode = vModel.getProperty('/selectedBP/dealerCode');
				var userType = vModel.getProperty('/userInfo/userType');

				var hasError = false;
				if (!!!userType){
					this.userTypeField.setValueState(sap.ui.core.ValueState.Error);
					this.userTypeField.setValueStateText(resourceBundle.getText('Error.Login.noUserType'));
					hasError = true;
				}

				if (!!!dealerCode){
					this.dealerCodeField.setValueState(sap.ui.core.ValueState.Error);
					this.dealerCodeField.setValueStateText(resourceBundle.getText('Error.Login.noDealerCode'));
					hasError = true;
				}
				if (hasError){
					return false;
				} else {
					sap.ui.getCore().getMessageManager().removeAllMessages();
					this.getRouter().navTo("FindOrder", null, false);
				}
			}
		});
	}
);