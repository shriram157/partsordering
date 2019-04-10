sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	"tci/wave2/ui/parts/ordering/model/models",
	"tci/wave2/ui/parts/ordering/utils/UIHelper",
	"sap/ui/model/json/JSONModel",
	"tci/wave2/ui/parts/ordering/utils/DataManager",
], function (BaseController, models, UIHelper, JSONModel, DataManager) {
	"use strict";

	var CONT_OTLISTMODEL = "orderTypeListModel";
	var CONT_HEADERMODEL = "headerMenuModel";

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.StartOrdering", {

		UIHelper: UIHelper,
		DataManager: DataManager,

		onInit: function () {
			// default mode
			var _oComponentOwner = this.getOwnerComponent();
			DataManager.init(BaseController, _oComponentOwner, this.getResourceBundle(), this.getSapLangugaeFromLocal());

			var appStateModel = this.getStateModel();
			this.setModel(appStateModel);

			//message
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(oMessageManager.getMessageModel(), "message");
			// or just do it for the whole view
			oMessageManager.registerObject(this.getView(), true);

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("StartOrdering").attachPatternMatched(this._onObjectMatched, this);
			//commented for debugging
			this.checkDealerInfo();

			var currentOrderTypeList = {
				displayUi: true,
				typeList: []
			};
			var orderTypeListModel = new sap.ui.model.json.JSONModel();
			orderTypeListModel.setData(currentOrderTypeList);
			this.setModel(orderTypeListModel, CONT_OTLISTMODEL);

			this.orderTypeField = this.byId("orderTypeInput");
			this.orderNumberField = this.byId("orderNumberInput");
			var lv_headerMenuMode = this.getHeaderMenuModel();
			this.setModel(orderTypeListModel, CONT_HEADERMODEL);

			this.init();
		},

		init: function () {
			var that = this;
			var appStateModel = this.getStateModel();
			appStateModel.setProperty('/tabKey', 'CO');

			// find the proper user type related info
			var appStateModel = this.getModel();

			var userProfile = appStateModel.getProperty('/userProfile');
			var viewDataModel = this.getUserTypesSelectionModel();
			var viewData = viewDataModel.getData();
			/* UI Helper */
			var bpCode = null;
			var userType = null;
			var dealerType = null;
			var zGroup = null;
			var customer = null;
			/* UI Helper */

			var currentOrderTypeList = [];
			var orderListModel = this.getModel(CONT_OTLISTMODEL);
			if (!!userProfile && !!userProfile.loaded) {
				//debugging
				//	this.getBusinessPartnersByDealerCode("46055", function(sData){
				//userProfile.dealerCode = "42120"; // debugging - comment it 
				//this.getBusinessPartnersByDealerCode("42120", function (sData) {
					
				this.getBusinessPartnersByDealerCode(userProfile.dealerCode, function (sData) {
					bpCode = sData.BusinessPartner;
					appStateModel.setProperty('/selectedBP/bpNumber', bpCode);
					UIHelper.setBpCode(bpCode);
					//appStateModel.setProperty('/selectedBP/bpName', sData.BusinessPartnerName);
					appStateModel.setProperty('/selectedBP/bpName', sData.OrganizationBPName1);
					appStateModel.setProperty('/selectedBP/dealerCode', userProfile.dealerCode);
					UIHelper.setDealerCode(userProfile.dealerCode);
					appStateModel.setProperty('/selectedBP/customer', sData.Customer);
					UIHelper.setCustomer(sData.Customer);
					UIHelper.setDealerType(sData.to_Customer.Attribute1);
					UIHelper.setBpGroup(sData.BusinessPartnerType);
					zGroup = sData.BusinessPartnerType;
					dealerType = sData.to_Customer.Attribute1;
					appStateModel.setProperty('/selectedBP/bpType', dealerType);
					appStateModel.setProperty('/selectedBP/bpGroup', zGroup);

					// get the user type
					//Debugging
					//userProfile.userType = "Dealer";
					userType = that.getInternalUserType(userProfile.userType, zGroup);
					appStateModel.setProperty('/userInfo/userType', userType);
					UIHelper.setUserType(userType);
					if ('Z001' === zGroup) {
						// redefine the order list 
						that.getSalesDocTypeByBPCode(bpCode, dealerType, function (lData) {
							if (!!lData) {
								currentOrderTypeList = lData;
							} else {
								currentOrderTypeList = [];
							}
							orderListModel.setProperty('/typeList', currentOrderTypeList);
							that.setCurrentOrderTypeList(orderListModel);
						});
					} else {
						for (var i = 0; i < viewData.userTypes.length; i++) {
							if (userType === viewData.userTypes[i].type) {
								currentOrderTypeList = viewData.userTypes[i].orderTypeList;
							}
						}
						orderListModel.setProperty('/typeList', currentOrderTypeList);
						that.setCurrentOrderTypeList(orderListModel);
					}
				});

			} else {
				//var userType = appStateModel.getProperty('/userInfo/userType');

				var userType = UIHelper.getUserType();

				for (var i = 0; i < viewData.userTypes.length; i++) {
					if (userType === viewData.userTypes[i].type) {
						currentOrderTypeList = viewData.userTypes[i].orderTypeList;
					}
				}

				// default
				//bpCode = appStateModel.getProperty('/selectedBP/bpNumber');
				bpCode = UIHelper.getBpCode();
				orderListModel.setProperty('/typeList', currentOrderTypeList);
				that.setCurrentOrderTypeList(orderListModel);

				this.getBusinessPartnersByID(bpCode, function (sData) {
					if (!!sData && !!sData.to_Customer) {
						zGroup = sData.BusinessPartnerType;
						dealerType = sData.to_Customer.Attribute1;
						UIHelper.setBpGroup(sData.BusinessPartnerType);
						UIHelper.setDealerType(sData.to_Customer.Attribute1);
						appStateModel.setProperty('/selectedBP/bpType', dealerType);
						appStateModel.setProperty('/selectedBP/bpGroup', zGroup);
						if ('Z001' === zGroup) {

							// redefine the order list 
							that.getSalesDocTypeByBPCode(bpCode, dealerType, function (lData) {
								if (!!lData) {
									currentOrderTypeList = lData;
								} else {
									currentOrderTypeList = [];
								}
								orderListModel.setProperty('/typeList', currentOrderTypeList);
								that.setCurrentOrderTypeList(orderListModel);
							});

						}
					}
				});

			}

		},

		_onObjectMatched: function (oEvent) {
			var that = this;
			if (!this.checkDealerInfo()) {
				//commented for debugging
				return false;
			} else {
			 var vModel = this.getView().getModel();
			 vModel.setProperty('/selectedOrderMeta/order_id', "");
			}

			this.init();
		},

		onOrderTypeChange: function (event) {
			var vModel = this.getView().getModel();
			var orderType = vModel.getProperty('/selectedOrderMeta/order_type');
			if (!!orderType) {
				this.orderTypeField.setValueState(null);
				this.orderTypeField.setValueStateText(null);
			}
		},
		onBack: function (event) {
			var that = this;
			// var sPreviousHash = History.getInstance().getPreviousHash();
			// if (sPreviousHash !== undefined) {
			// 	history.go(-1);
			// } else {
			that.getRouter().navTo("FindOrder", null, false);
			// }
		},

		onCreateOrder: function (event) {
			var resourceBundle = this.getResourceBundle();
			var vModel = this.getView().getModel();

			var orderNumber = vModel.getProperty('/selectedOrderMeta/order_id');
			var orderType = vModel.getProperty('/selectedOrderMeta/order_type');

			var hasError = false;
			//				if (!!!orderNumber || orderNumber.length < 5 || orderNumber.length >40){
			if (!!!orderNumber) {
				this.orderNumberField.setValue(" ");
				hasError = true;
			}

			if (!!!orderType) {
				this.orderTypeField.setValueState(sap.ui.core.ValueState.Error);
				this.orderTypeField.setValueStateText(resourceBundle.getText('Error.noOrderType'));
				hasError = true;
			}
			if (hasError) {
				return false;
			} else {
				sap.ui.getCore().getMessageManager().removeAllMessages();
				this.getRouter().navTo("CreateOrder", {
					orderNum: orderNumber,
					orderType: orderType
				});
			}
		}
	});
});