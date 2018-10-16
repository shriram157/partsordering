sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/model/json/JSONModel"
], function(BaseController, models, JSONModel) {
	"use strict";
	
	var CONT_VIEWMODEL = "viewModel";
	var CONT_BPLISTMODEL = "bpListModel";	
	var CONT_OTLISTMODEL = "orderTypeListModel";	
	var CONT_HEADERMODEL = "headerMenuModel";	
	
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.StartOrdering", {


			onInit : function () {
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);
				
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("StartOrdering").attachPatternMatched(this._onObjectMatched, this);

				var resourceBundle = this.getResourceBundle();
				
				var viewDatas = { userTypes : [
						{ type : "001", code : "Z004", name : resourceBundle.getText('userType.VPC'), init : false,	
						  orderTypeList : [ {code : 1, name  : resourceBundle.getText('order.type.standard') } ]
						   
						},
						{ type : "002", code : "Z005", name : resourceBundle.getText('userType.PORT'), init : false,
						  orderTypeList : [ {code : 1, name  : resourceBundle.getText('order.type.standard')} ]
	
						},
						{ type : "003", code : "Z001", name : resourceBundle.getText('userType.DEALER'), init :false,
						  orderTypeList : [ {code : 1, name  : resourceBundle.getText('order.type.standard')},
											{code : 2, name  : resourceBundle.getText('order.type.rush')},
											{code : 3, name  : resourceBundle.getText('order.type.campaign')}
										  ]
						},				
						{ type : "004", code : "Z001", name : resourceBundle.getText('userType.LDEALER'), init :false,
						  orderTypeList : [ {code : 1, name  : resourceBundle.getText('order.type.standard')},
											{code : 2, name  : resourceBundle.getText('order.type.rush')}
										  ]
						}
					]
				}; 
					
				var viewDataModel = new sap.ui.model.json.JSONModel();
				viewDataModel.setData(viewDatas);
				this.setModel(viewDataModel, CONT_VIEWMODEL);

				var currentBpList = { displayUi : false, bpList : []	}; 	
				var bpListModel = new sap.ui.model.json.JSONModel();
				bpListModel.setData(currentBpList);
				this.setModel(bpListModel, CONT_BPLISTMODEL);
				
				var currentOrderTypeList = { displayUi : false, typeList : []	};
				var orderTypeListModel =  new sap.ui.model.json.JSONModel();
				orderTypeListModel.setData(currentOrderTypeList);
				this.setModel(orderTypeListModel, CONT_OTLISTMODEL);
				
				var lv_headerMeneMode = this.getHeaderMenuModel(); 
				this.setModel(orderTypeListModel, CONT_HEADERMODEL);
				
				
			},

			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');
				//var oItem = this.byId('iconTabHeader');
			},

			getBusinessPartnerByType : function(type, callback){
				// do the cache -- can be moved to base controller 
				
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
			
			
			updatedBPDropDown : function(){
				
			},
			
			onBPChange : function(event){
				var listModel = this.getModel(CONT_BPLISTMODEL);
				var list = listModel.getProperty('/bpList');
				
				var vModel = this.getView().getModel();
				var key = vModel.getProperty('/selectedBP/dealerCode');
				
				var item = null;
				for (var i = 0; i< list.length; i++){
					if (list[i].Dealer === key){
						item = list[i];	
					}
				}
				
				if (!!item){
					vModel.setProperty('/selectedBP/bpNumber', item.BusinessPartner);
					vModel.setProperty('/selectedBP/bpName', item.Name);
					vModel.setProperty('/selectedBP/customer', item.Customer);
				}
			},
			
			onUserTypeChange : function(event){
				var that = this;

				var selectedKey = event.getParameter('selectedItem').mProperties['key'];
				
				this.getBusinessPartnerByType(selectedKey, (bpData, oderTypeList)=>{
					// switch the bpList display and provide the data 
					var model = this.getModel(CONT_BPLISTMODEL);
					var modelData = model.getData();
					modelData.displayUi = true; 
					modelData.bpList = bpData;
					model.setData(modelData);
					that.setModel(model, CONT_BPLISTMODEL);
					
					// type list 
					model = this.getModel(CONT_OTLISTMODEL);
					modelData = model.getData();
					modelData.displayUi = true; 
					modelData.typeList = oderTypeList;
					model.setData(modelData);
					that.setModel(model, CONT_OTLISTMODEL);
				});
				
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