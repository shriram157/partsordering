/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"tci/wave2/ui/parts/ordering/model/models",
	"sap/ui/Device",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/ui/model/json/JSONModel",
	"tci/wave2/ui/parts/ordering/utils/DataManager"
], function (Controller, History, models, Device, MessagePopover, MessageItem, Link, Message, MessageType, JSONModel, DataManager) {
	"use strict";

	var CONST_APP_STATE = "APP_STATE";
	var CONST_APP_ERROR = "APP_ERROR";
	var CONST_PARTS_CACHE = "PARTS_CACHE";

	return Controller.extend("tci.wave2.ui.parts.ordering.controller.BaseController", {
		DataManager: DataManager,

		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				//				this.getRouter().navTo("Login", null, true);
			}
		},

		/**
		 * Start of local models
		 */
		getInternalUserType: function (exteranlUT, dealerType) {
			var internalUT = null;
			if (!!exteranlUT) {
				if (exteranlUT.trim().toLowerCase() === 'dealer') {
					switch (dealerType) {
					case "Z004":
						internalUT = "001";
						break;
					case "Z005":
						internalUT = "002";
						break;
					case "Z001":
						internalUT = "003";
						break;
					}
				} else { // should be internal 
					internalUT = '000';
				}
			}
			return internalUT;
		},

		createUserTypesModel: function () {
			var resourceBundle = this.getResourceBundle();
			var _stdOrder = resourceBundle.getText('order.type.standard');
			var _rushOrder = resourceBundle.getText('order.type.rush');
			var _campOrder = resourceBundle.getText('order.type.campaign');
			var viewDatas = {
				userTypes: [{
					type: "001",
					code: "Z004",
					name: resourceBundle.getText('userType.VPC'),
					init: false,
					orderTypeList: [{
						code: 1,
						name: _stdOrder
					}]
				}, {
					type: "002",
					code: "Z005",
					name: resourceBundle.getText('userType.PORT'),
					init: false,
					orderTypeList: [{
						code: 1,
						name: _stdOrder
					}]
				}, {
					type: "003",
					code: "Z001",
					name: resourceBundle.getText('userType.DEALER'),
					init: false,
					orderTypeList: [{
						code: 1,
						name: _stdOrder
					}, {
						code: 2,
						name: _rushOrder
					}, {
						code: 3,
						name: _campOrder
					}]
				}, {
					type: "004",
					code: "Z001",
					name: resourceBundle.getText('userType.LDEALER'),
					init: false,
					orderTypeList: [{
						code: 1,
						name: _stdOrder
					}, {
						code: 2,
						name: _rushOrder
					}]
				}]
			};
			var viewDataModel = new sap.ui.model.json.JSONModel();
			viewDataModel.setData(viewDatas);
			return viewDataModel;
		},

		getOrderTypeByCode: function (code, dealerType) {
			var resourceBundle = this.getResourceBundle();
			switch (code) {
			case 'ZOR':
				return {
					code: 1,
					name: resourceBundle.getText('order.type.standard'),
					zcode: code
				};
			case 'ZRO':
				return {
					code: 2,
					name: resourceBundle.getText('order.type.rush'),
					zcode: code
				};
			case 'ZCO':
				if ('04' === dealerType) {
					return null; //dis-allowed for Land Rover dealer
				} else {
					return {
						code: 3,
						name: resourceBundle.getText('order.type.campaign'),
						zcode: code
					};
				}
			default:
				return null;
			}
		},

		getFilterSelectionModel: function () {
			var iDataMode = sap.ui.getCore().getModel("FilterSelectionModel");
			if (!!!iDataMode) {
				var resourceBundle = this.getResourceBundle();
				var iData = {
					orderTypeList: [{
						code: 'ALL',
						name: resourceBundle.getText('order.type.all')
					}, {
						code: 'ZOR',
						name: resourceBundle.getText('order.type.standard')
					}, {
						code: 'ZRO',
						name: resourceBundle.getText('order.type.rush')
					}, {
						code: 'ZCO',
						name: resourceBundle.getText('order.type.campaign')
					}],
					orderStatusList: [{
						code: 'DF',
						name: resourceBundle.getText('Order.Status.Draft')
					}, {
						code: 'ST',
						name: resourceBundle.getText('Order.Status.Submitted')
					}],
					partsStateList: [{
						code: 'ALL',
						name: resourceBundle.getText('Parts.Status.All')
					}, {
						code: 'IP',
						name: resourceBundle.getText('Parts.Status.InProcess')
					}, {
						code: 'PR',
						name: resourceBundle.getText('Parts.Status.Processed')
					}, {
						code: 'CL',
						name: resourceBundle.getText('Parts.Status.Cancelled')
					}, {
						code: 'BK',
						name: resourceBundle.getText('Parts.Status.BackOrdered')
					},{
						code: 'QtOp',
					name: resourceBundle.getText('Parts.Status.Quantity.Open')
					}]
					// {
					// 	code: 'OpOR',
					// 	name: resourceBundle.getText('Parts.Status.OpenOrdered')
					// }]
					
				};
				var iDataModel = new sap.ui.model.json.JSONModel();
				iDataModel.setData(iData);
				sap.ui.getCore().setModel(iDataModel, "FilterSelectionModel");
			}
			return iDataModel;
		},

		getCurrentOrderTypeList: function () {
			return sap.ui.getCore().getModel("CurrentOrderTypeList");
		},

		setCurrentOrderTypeList: function (model) {
			return sap.ui.getCore().setModel(model, "CurrentOrderTypeList");
		},

		getUserTypesSelectionModel: function () {
			var dataModel = sap.ui.getCore().getModel("UserTypesSelectionModel");
			if (dataModel === null || dataModel === undefined) {
				dataModel = this.createUserTypesModel();
				sap.ui.getCore().setModel(dataModel, "UserTypesSelectionModel");
			}
			return dataModel;
		},

		getHeaderMenuModel: function () {
			var dataModel = sap.ui.getCore().getModel("HeaderMenuModel");
			if (dataModel === null || dataModel === undefined) {
				var resourceBundle = this.getResourceBundle();
				var jsonData = {
					headeremuList: [{
						key: "001",
						name: resourceBundle.getText('headerMenu.CreateOrder')
					}, {
						key: "002",
						name: resourceBundle.getText('headerMenu.FindOrder')
					}, {
						key: "003",
						name: resourceBundle.getText('headerMenu.CheckOrderStatus')
					}]
				};
				dataModel = new sap.ui.model.json.JSONModel();
				dataModel.setData(jsonData);
				sap.ui.getCore().setModel(dataModel, "HeaderMenuModel");
			}
			return dataModel;
		},

		getStateModel: function () {
			var appState = models.getAppStateModel();
			return appState;
		},

		setUserTypesSelectionModel: function (model) {
			sap.ui.getCore().setModel(model, "UserTypesSelectionModel");
		},

		// parts section 
		getPartCacheData: function () {
			var model = this.getOwnerComponent().getModel(CONST_PARTS_CACHE);
			if (!!model) {
				return model.getData();
			} else {
				return null;
			}
		},

		setPartCacheData: function (data) {
			if (!!data) {
				var model = new sap.ui.model.json.JSONModel();
				model.setData(data);
				this.getOwnerComponent().setModel(model, CONST_PARTS_CACHE);
			}
		},

		//error 
		_getMessagePopover: function () {
			// create popover lazily (singleton)
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "tci.wave2.ui.parts.ordering.view.fragments.MessagePopover",
					this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},

		handleMessagePopoverPress: function (oEvent) {
			//this._getMessagePopover().openBy(oEvent.getSource());
			this._getMessagePopover().toggle(oEvent.getSource());
		},

		getSapLangugaeFromLocal: function () {
			return sap.ui.getCore().getConfiguration().getLanguage().toUpperCase().substring(0, 2);
		},

		onSelectTab: function (event) {
			var key = event.getParameter('item').getKey();
			var appState = models.getAppStateModel();

			switch (key) {
			case "CO":
				this.getRouter().navTo("StartOrdering", null, true);
				break;
			case "FO":
				this.getRouter().navTo("FindOrder", null, true);
				break;
			case "CS":
				this.getRouter().navTo("CheckOrderStatus", null, true);
				break;
			default:
				this.getRouter().navTo("StartOrdering", null, true);
				break;
			}
			//				appState.setProperty('/tabKey', key);
			return;
		},

		removeAllMessages: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		isSalesOrderAssociated: function (bpType) {
			if (!!bpType && 'Z001' === bpType) {
				return true;
			} else if (!!bpType && "Z005" == bpType) {
				return true;
			}
			return false;
		},

		_hasError: function (messageList) {
			var hasError = false;
			if (!!messageList && messageList.length > 0) {
				for (var i = 0; i < messageList.length; i++) {
					if (messageList[i].severity === 'error') {
						hasError = true;
						return hasError;
					}
				}
			}
			return hasError;
		},

		getOrderTypeName: function (id) {
			var resourceBundle = this.getResourceBundle();
			switch (id) {
			case '1':
				return resourceBundle.getText('order.type.standard');
			case '2':
				return resourceBundle.getText('order.type.rush');
			case '3':
				return resourceBundle.getText('order.type.campaign');
			default:
				return "";
			}
		},

		getMessageColor: function (messages) {
			var messageLevel = 0; // non
			var meesageItem = null;
			if (!!messages && !!messages.length) {
				for (var i = 1; i < messages.length; i++) {
					if (!!meesageItem) {
						meesageItem = messages[i];
						switch (meesageItem.severity) {
						case 'error':
							messageLevel = 3;
							break;
						case 'warning':
							if (messageLevel < 2) {
								messageLevel = 2;
							}
							break;
						default:
							if (messageLevel < 1) {
								messageLevel = 1;
							}
							break;
						}
					}
				}
			}

			switch (messageLevel) {
			case 3:
				return "#FC0519";
			case 2:
				return "#FFDAB9";
			default:
				return "#2DFA06";
			}
		},

		getMessageLevel: function (messages) {
			var messageLevel = 1; // non
			var meesageItem = null;
			if (!!messages && !!messages.length) {
				for (var i = 0; i < messages.length; i++) {
					meesageItem = messages[i];
					if (!!meesageItem) {
						switch (meesageItem.severity) {
						case 'error':
							messageLevel = 3;
							break;
						case 'warning':
							if (messageLevel < 2) {
								messageLevel = 2;
							}
							break;
						default:
							if (messageLevel < 1) {
								messageLevel = 1;
							}
							break;
						}
					}
				}
			}
			return messageLevel;
		},

		_extractSapErrorMessage: function (error) {
			// sap-message
			var sapMessage = null;
			var mItem = null;
			var messageItem = null;
			var messageList = [];
			if (!!error && !!error.responseText) {
				sapMessage = JSON.parse(error.responseText);
				if (!!sapMessage.error && !!sapMessage.error.innererror && !!sapMessage.error.innererror.errordetails) {
					for (var x = 0; x < sapMessage.error.innererror.errordetails.length; x++) {
						mItem = sapMessage.error.innererror.errordetails[x];
						if (!!mItem) {
							messageItem = {
								severity: mItem.severity,
								code: mItem.code,
								message: mItem.message
							};
							messageList.push(messageItem);
						}
					}
				}
			}
			return messageList;
		},

		_extractSapItemMessages: function (oResponse) {
			var that = this;

			var sapMessage = null;
			var mItem = null;
			var messageItem = null;
			var messageList = [];
			if (!!oResponse && !!oResponse.headers['sap-message']) {
				sapMessage = JSON.parse(oResponse.headers['sap-message']);
				//					if (!!sapMessage.target && sapMessage.target ==='PurchaseOrderItem'){					
				if (!!sapMessage.target) {
					messageItem = {
						type: that._convertSeverty2Type(sapMessage.severity),
						severity: sapMessage.severity,
						code: sapMessage.code,
						message: sapMessage.message
					};
					messageList.push(messageItem);
					for (var x = 0; x < sapMessage.details.length; x++) {
						mItem = sapMessage.details[x];
						//							 if (!!mItem && !!mItem.target && mItem.target ==='PurchaseOrderItem'){
						if (!!mItem && !!mItem.target) {
							messageItem = {
								type: that._convertSeverty2Type(mItem.severity),
								severity: mItem.severity,
								code: mItem.code,
								message: mItem.message
							};
							messageList.push(messageItem);
						}
					}
				}
			}
			return messageList;
		},

		checkDealerInfo: function () {
			var resourceBundle = this.getResourceBundle();
			var vModel = this.getModel(); // get the view model

			var dealerCode = vModel.getProperty('/selectedBP/dealerCode');
			var userType = vModel.getProperty('/userInfo/userType');

			var oMessage = null;
			var hasError = false;
			if (!!!userType) {
				oMessage = new Message({
					message: resourceBundle.getText('Error.Login.noUserType'),
					type: MessageType.Error
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
				hasError = true;
			}

			if (!!!dealerCode) {
				oMessage = new Message({
					message: resourceBundle.getText('Error.Login.noDealerCode'),
					type: MessageType.Error
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			}
			if (hasError) {
				sap.ui.getCore().getMessageManager().removeAllMessages();
				//Commented for debugging
				this.getRouter().navTo("CheckOrderStatus", null, false);
				return false;
			} else {
				return true;
			}
		},

		s2date: function (ds) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYYMMDD"
			});
			var dateF = dateFormat.parse(ds);
			if (!!dateF) {
				return dateF;
			} else {
				return null;
			}

		},

		getInnerOrderTypeByZOrderType: function (orderType) {
			switch (orderType) {
			case 'ZOR':
				return '1';
			case 'ZRO':
				return '2';
			case 'ZCO':
				return '3';
			default:
				return '1'; // as the default? 
			}
		},

		getInnerPurchaseOrderTypeByZOrderType: function (orderType) {
			switch (orderType) {
			case 'UB':
				return '1';
			case 'ZLOC':
				return '1';
			}
		},

		getRealOrderTypeByItemCategoryGroup: function (itemCG, isSalesOrder, orderType) {
			if (!!isSalesOrder) {
				switch (orderType) {
				case '1':
					return 'ZOR';
				case '2':
					return 'ZRO';
				case '3':
					return 'ZCO';
				default:
					return 'ZOR'; // as the default? 
				}
			} else {
				if ('BANS' === itemCG) {
					return 'ZLOC';
				} else if ('NORM' === itemCG) {
					return 'UB';
				} else {
					return 'ZLOC'; // default
				}
			}
		},
		/* Moved to DataManager */
		_convertSeverty2Type: function (severty) {
			switch (severty) {
			case 'error':
				return 'Error';
			case 'warning':
				return 'Warning';
			case 'info':
				return 'Information';
			default:
				return 'None';

			}
		},

		/* Moved to DataManager */
		_extractSapMessage: function (oResponse) {
			var that = this;
			var sapMessage = null;
			var messageList = [];
			var messageItem = null;
			var uuid = null;
			var index = 0;
			var mItem = null;

			// get the list of message order by UUID
			if (!!oResponse && !!oResponse.headers['sap-message']) {
				sapMessage = JSON.parse(oResponse.headers['sap-message']);
				if (!!sapMessage.target) {
					index = sapMessage.target.search('guid');
					if (index > 0) {
						uuid = sapMessage.target.substr(index + 5, 36);
						messageItem = {
							uuid: uuid,
							type: that._convertSeverty2Type(sapMessage.severity),
							severity: sapMessage.severity,
							code: sapMessage.code,
							message: sapMessage.message
						};
						if (!!!messageList[uuid]) {
							messageList[uuid] = [];
						}
						messageList[uuid].push(messageItem);
					}
				}
				for (var x = 0; x < sapMessage.details.length; x++) {
					mItem = sapMessage.details[x];
					if (!!mItem && !!mItem.target) {
						index = mItem.target.search('guid');
						if (index > 0) {
							uuid = mItem.target.substr(index + 5, 36);
							messageItem = {
								uuid: uuid,
								type: that._convertSeverty2Type(mItem.severity),
								severity: mItem.severity,
								code: mItem.code,
								message: mItem.message
							};
							if (!!!messageList[uuid]) {
								messageList[uuid] = [];
							}
							messageList[uuid].push(messageItem);
						}
					}
				}
			}
			return messageList;
		},
		/**
		 * End of local models
		 */

		/**
		 * Start of Odata models
		 */
		// Material related  
		getProductModel: function () {
			return this.getOwnerComponent().getModel("MD_PRODUCT_FS_SRV");
		},

		getZProductModel: function () {
			return this.getOwnerComponent().getModel("ZMD_PRODUCT_FS_V2_SRV");
		},

		getApiProductModel: function () {
			return this.getOwnerComponent().getModel("API_PRODUCT_SRV");
		},

		getInfoRecordModel: function () {
			return this.getOwnerComponent().getModel("MM_PUR_INFO_RECORDS_MANAGE_SRV");
		},

		getZCStorLocationModel: function () {
			return this.getOwnerComponent().getModel("ZC_STOR_LOCN_CDS");
		},

		//BP Model 	
		getApiBPModel: function () {
			return this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");
		},

		// Sale Order model 
		getSalesOrderModel: function () {
			return this.getOwnerComponent().getModel("ZC_CREATE_SO_SRV");
		},

		// PO related	
		getPurV2Model: function () {
			return this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");
		},

		// new PO Model
		getPurchaseOrderModel: function () {
			return this.getOwnerComponent().getModel("API_PURCHASEORDER_PROCESS_SRV");
		},

		getZCMATERIALModel: function () {
			return this.getOwnerComponent().getModel("Z_SEARCH_HELPS_SRV");
		},

		// Start -- MD_PRODUCT_FS_SRV model related
		getMaterialDesc: function (material, index, callback) {
			var bModel = this.getProductModel();
			var lan = this.getSapLangugaeFromLocal();
			var key = bModel.createKey('/I_MaterialText', {
				'Material': material,
				"Language": lan
			});
			bModel.read(key, {
				urlParameters: {},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(index, oData.MaterialName);
					} else {
						callback(index, null);
					}
				},
				error: function (err) {
					callback(index, null);
				}
			});
		},

		getMaterialById: function (id, callback) {
			var bModel = this.getProductModel();
			var key = bModel.createKey('/C_Product_Fs', {
				'Material': id
			});
			bModel.read(key, {
				urlParameters: {
					"$expand": "to_Plant,to_PurchasingInfoRecord,to_Supplier"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					// error handling here
					callback(null);
				}
			});
		},
		// End -- MD_PRODUCT_FS_SRV model related

		// Start -- ZMD_PRODUCT_FS_SRV model related
		getRoundingprofileOFVendor: function (id, saleOrg, disChannel, callback) {
			var bModel = this.getZProductModel();
			var key = bModel.createKey('/zc_PriceSet', {
				'Customer': '',
				'DisChannel': disChannel,
				'Division': '',
				'Matnr': id,
				'SalesDocType': '',
				'SalesOrg': saleOrg,
				'AddlData': true,
				'LanguageKey': 'EN',
				'Plant': ''
			});
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("DisChannel", sap.ui.model.FilterOperator.EQ, disChannel);
			oFilter[1] = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, id);
			oFilter[2] = new sap.ui.model.Filter("SalesOrg", sap.ui.model.FilterOperator.EQ, saleOrg);
			oFilter[3] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, 'EN');
			oFilter[4] = new sap.ui.model.Filter("AddlData", sap.ui.model.FilterOperator.EQ, true);

			bModel.read("/zc_PriceSet(Customer='',DisChannel='" + disChannel + "',Division='',Matnr='" + id + "',SalesDocType='',SalesOrg='" +
				saleOrg + "',AddlData=true,LanguageKey='EN',Plant='')",
				//				bModel.read(key,
				//				bModel.read("/zc_PriceSet",
				{
					// urlParameters: {
					//   				"$select": "Item/Roundingprofile",
					// },
					//					filters:  oFilter,
					success: function (oData, oResponse) {
						if (!!oData) {
							callback(oData);
						} else {
							callback(null);
						}
					},
					error: function (err) {
						callback(null);
					}
				});
		},

		getZMaterialById: function (id, callback) {
			var bModel = this.getZProductModel();
			var oFilter = new Array();
			var key = bModel.createKey('/C_Product_Fs', {
				'Material': id
			});
			bModel.read(key, {
				urlParameters: {
					//	"$select": "Material,MaterialName,Division,to_PurchasingInfoRecord/PurchasingInfoRecord,to_PurchasingInfoRecord/Supplier,to_PurchasingInfoRecord/IsDeleted",
					"$expand": "to_PurchasingInfoRecord"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					callback(null);
				}
			});
		},
		// End -- ZMD_PRODUCT_FS_SRV model related			

		// Start -- API_PRODUCT_SRV model related			
		getPartsInfoById: function (id, callback) {
			var bModel = this.getApiProductModel();
			var key = bModel.createKey('/A_Product', {
				'Product': id
			});
			//				bModel.read("/A_Product('"+id+"')", {
			bModel.read(key, {
				urlParameters: {
					//	"$select": "ItemCategoryGroup,to_SalesDelivery/ProductSalesOrg,to_SalesDelivery/ProductDistributionChnl",
					"$expand": "to_SalesDelivery"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					callback(null);
				}
			});
		},
		// End -- API_PRODUCT_SRV model related		

		// Start of ZC_STOR_LOCN_CDS //Vendor here is BpCode.
		getStorageInfo: function (vendor, callback) {
			var oFilter = new Array();
			//var aFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, vendor);

			//oFilter[0] = new sap.ui.model.Filter("DealerCode", sap.ui.model.FilterOperator.EQ, dealerCode);
			var bModel = this.getZCStorLocationModel();
			bModel.read("/ZC_STOR_LOCN", {
				filters: oFilter,
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						callback(oData.results[0]);
					} else {
						// error
						callback(null);
					}

				},

				error: function (err) {
					// handle error?
					callback(null);
				}
			});
		},
		// End of ZC_STOR_LOCN_CDS			

		// Start -- MM_PUR_INFO_RECORDS_MANAGE_SRV model related		
		getPriceInfoFromInfoRecord: function (infoRecord, purOrg, callback) {
			var bModel = this.getInfoRecordModel();
			var key = bModel.createKey('/I_PurgInfoRecdOrgPlantData', {
				'PurchasingInfoRecord': infoRecord,
				'PurchasingOrganization': purOrg,
				'PurchasingInfoRecordCategory': '0',
				'Plant': ''
			});
			//				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='"+plant+"')",
			//				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='')",
			bModel.read(key, {
				urlParameters: {
					//	"$select": "NetPriceAmount,Currency,TaxCode"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					// handle error?
					callback(null);
				}
			});
		},

		getzPriceInfoFromInfoRecord: function (infoRecord, callback) {
			var bModel = this.getInfoRecordModel();
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("PurchasingInfoRecord", sap.ui.model.FilterOperator.EQ, infoRecord);
			bModel.read("/I_PurgInfoRecdOrgPlantData", {
				filters: oFilter,
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					// handle error?
					callback(null);
				}
			});
		},

		getCompanyCodeByVendor: function (vendor, callback) {
			var bModel = this.getInfoRecordModel();
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, vendor);
			bModel.read("/C_MM_SupplierValueHelp", {
				filters: oFilter,
				urlParameters: {
					//		"$select": "CompanyCode,Country,SupplierAccountGroup"
				},
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						callback(oData.results[0]);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					// handle error?
					callback(null);
				}
			});
		},

		getCompanyCodeByPurcahseOrg: function (purchaseOrg, callBack) {
			var bModel = this.getInfoRecordModel();
			var key = bModel.createKey('/C_PurchasingOrgValueHelp', {
				'PurchasingOrganization': purchaseOrg
			});
			//				bModel.read("/C_PurchasingOrgValueHelp('"+purchaseOrg+"')",
			bModel.read(key, {
				urlParameters: {},
				success: function (oData, oResponse) {
					if (!!oData && !!oData.CompanyCode) {
						callBack(oData.CompanyCode);
					} else {
						callBack(null);
					}
				},
				error: function (err) {
					callBack(null);
				}
			});
		},
		// End -- MM_PUR_INFO_RECORDS_MANAGE_SRV model related				

		// Start -- API_BUSINESS_PARTNER_SRV model related				
		getSalesDocTypeByBPCode: function (id, dealerType, callback) {
			var that = this;
			var bModel = this.getApiBPModel();
			var key = bModel.createKey('/Sales_DocTypeSet', {
				'Customer': id
			});
			bModel.read(key, {
				urlParameters: {
					// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
					//"$expand" : "to_Customer"
				},
				success: function (oData, oResponse) {
					//DMND0003534 changes done by Minakshi
					that.getOwnerComponent().getModel("LocalDataModel").setProperty("/salesdocData", oData);
					
					var dlrFlag = that.getOwnerComponent().getModel("LocalDataModel").getProperty("/salesdocData/dealercheckflag");
					if(dlrFlag === "X"){
						that.getView().getModel().setProperty("/selectedOrderMeta/typeB", false);
					}

					if (!!oData) {
						
						var typeList = [];
						var index = 0;
						var typeItem = that.getOrderTypeByCode(oData.Zauart1, dealerType);
						if (!!typeItem) {
							typeList[index++] = typeItem;
						}
						typeItem = that.getOrderTypeByCode(oData.Zauart2, dealerType);
						if (!!typeItem) {
							typeList[index++] = typeItem;
						}
						typeItem = that.getOrderTypeByCode(oData.Zauart3, dealerType);
						if (!!typeItem) {
							typeList[index++] = typeItem;
						}
						callback(typeList);
					} else {
						// error handleing 
						callback(null);
					}
				},
				error: function (err) {
					// error handling here
					callback(null);
				}
			});
		},

		getSupplierForPart: function (oItem, stoSupplyingPlant, callback) {
			var that = this;
			//var oItemIndex = oltem[i];
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("MaterialNumber", sap.ui.model.FilterOperator.EQ, oItem.partNumber);
			//oFilter[1] = new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, sSalesOrganization);
			//oFilter[2] = new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, sDistributionChannel);
			oFilter[1] = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, stoSupplyingPlant);
			//oFilter[2] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, that.slang);
			if (!this.oModel_SupplierForPart) {
				this.oModel_SupplierForPart = this.getZCMATERIALModel();
			}

			this.oModel_SupplierForPart.read("/ZC_Purchasing_info", {
				filters: new Array(new sap.ui.model.Filter({
					filters: oFilter,
					and: true
				})),
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						callback(oData.results);
					} else {
						// error
						callback(null);
					}

				},

				error: function (err) {
					// handle error?
					callback(null);
				}
			});

		},

		getBusinessPartnersByDealerCode: function (dealerCode, callback) {
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("SearchTerm2", sap.ui.model.FilterOperator.EQ, dealerCode);
			oFilter[1] = new sap.ui.model.Filter(
				[
					new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, 'Z001'),
					new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, 'Z004'),
					new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, 'Z005')
				], false);

			var bModel = this.getApiBPModel();
			bModel.read('/A_BusinessPartner', {
				filters: oFilter,
				urlParameters: {
					// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
					"$expand": "to_Customer"
				},
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						var bpRecord = null;
						for (var x1 = 0; x1 < oData.results.length; x1++) {
							bpRecord = oData.results[x1];
							if (!!bpRecord && bpRecord.zstatus !== 'X') {
								break;
							} else {
								bpRecord = null;
							}
						}
						callback(bpRecord);
					} else {
						// error handleing 
						callback(null);
					}
				},
				error: function (err) {
					// error handling here
					callback(null);
				}
			});
		},

		getBusinessPartnersByID: function (id, callback) {
			var bModel = this.getApiBPModel();
			var key = bModel.createKey('/A_BusinessPartner', {
				'BusinessPartner': id
			});
			//				bModel.read("/A_BusinessPartner('"+id+"')",
			bModel.read(key, {
				urlParameters: {
					// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
					"$expand": "to_Customer"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						// error handleing 
						callback(null);
					}
				},
				error: function (err) {
					// error handling here
					callback(null);
				}
			});
		},

		getBusinessPartnersByType: function (type, callBackFunction) {
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, type);

			var bModel = this.getApiBPModel();
			var bpList = [];
			bModel.read("/A_BusinessPartner", {
				filters: oFilter,
				urlParameters: {
					//		"$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
				},
				success: function (oData, oResponse) {

					var iBP = null;
					if (!!oData && !!oData.results) {
						for (var i = 0; i < oData.results.length; i++) {
							iBP = {};
							iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
							iBP.BusinessPartner = oData.results[i].BusinessPartner;
							iBP.Name = oData.results[i].OrganizationBPName1;
							iBP.Dealer = iBP.BusinessPartner.slice(-5);
							bpList.push(iBP);
						}
					}
					callBackFunction(bpList);
				},
				error: function (err) {
					callBackFunction(bpList);
				}
			});
		},

		getSupplierInfo: function (id, callBack) {
			var bModel = this.getApiBPModel();
			var key = bModel.createKey('/A_Supplier', {
				'Supplier': id
			});
			bModel.read(key, {
				urlParameters: {
					//	"$select": "to_CustomerCompany/CompanyCode",
					"$expand": "to_SupplierCompany"
				},
				success: function (oData, oResponse) {
					callBack(oData);
				},
				error: function (err) {
					// error handling here
					callBack(null);
				}
			});
		},

		getSupplierCompanyCode: function (id, callBack) {
			var bModel = this.getApiBPModel();
			var key = bModel.createKey('/A_Customer', {
				'Customer': id
			});
			//				bModel.read("/A_Customer('"+id+"')",
			bModel.read(key, {
				urlParameters: {
					//	"$select": "to_CustomerCompany/CompanyCode",
					"$expand": "to_CustomerCompany"
				},
				success: function (oData, oResponse) {
					callBack(oData);
				},
				error: function (err) {
					// error handling here
					callBack(null);
				}
			});
		},

		getCustomerById: function (id, callBackFunction) {
			var bModel = this.getApiBPModel();
			var key = bModel.createKey('/A_Customer', {
				'Customer': id
			});
			// bModel.read("/A_Customer('"+id+"')",
			bModel.read(key, {
				urlParameters: {
					"$expand": "to_CustomerCompany,to_CustomerSalesArea"
				},
				success: function (oData, oResponse) {
					callBackFunction(oData);
				},

				error: function (err) {
					callBackFunction(null);
					// error handling here
				}
			});
		},
		// END -- API_BUSINESS_PARTNER_SRV model related				

		// START -- ZC_CREATE_SO_SRV model related
		// not support the split operation, keep it simple 	
		searchSalesOrdDraftByDealerCode: function (bpNumber, conditions, callback) {
			var that = this;
			var bModel = this.getSalesOrderModel();
			var oFilter = new Array();
			var aFilter = null;
// *****************************revalidation of SOLD-TO-PARTY*********************************
				var dealerCode = that.getStateModel().getProperty('/userProfile').dealerCode;

				that.getBusinessPartnersByDealerCode(dealerCode, function (sData) {
			
			
			//oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
			oFilter[0] = new sap.ui.model.Filter("SoldtoParty", sap.ui.model.FilterOperator.EQ, sData.BusinessPartner);
// *****************************revalidation of SOLD-TO-PARTY*********************************
			if (!!conditions) {
				if (!!conditions.orderNumber) {
					oFilter[1] = new sap.ui.model.Filter("PurchNoC", sap.ui.model.FilterOperator.EQ, conditions.orderNumber);
				}
			}

			if (!!conditions.orderStates && conditions.orderStates.length > 0) {
				var ordersSts = [];
				for (var x2 = 0; x2 < conditions.orderStates.length; x2++) {
					switch (conditions.orderStates[x2]) {
					case '1':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZOR'));
						break;
					case '2':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZRO'));
						break;
					case '3':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZCO'));
						break;
					case 'ZOR':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZOR'));
						break;
					case 'ZRO':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZRO'));
						break;
					case 'ZCO':
						ordersSts.push(new sap.ui.model.Filter("DocType", sap.ui.model.FilterOperator.EQ, 'ZCO'));
						break;
					}
				}
				if (ordersSts.length > 0) {
					aFilter = new sap.ui.model.Filter(ordersSts, false);
					oFilter.push(aFilter);
				}
			}

			bModel.read('/draft_soHeaderSet', {
				urlParameters: {
					//	"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime",
					//	"$orderby": "ZZ1_DealerOrderNum_PDH,DraftEntityCreationDateTime"
					$expand: "headerToItemDraft"
				},
				filters: oFilter,
				success: function (oData, oResponse) {
					var sapMessage = null;
					var messageList = [];
					var messageItem = null;
					var uuid = null;
					var target = null;
					var index = 0;
					var mItem = null;
					if (!!oResponse && !!oResponse.headers['sap-message']) {
						sapMessage = JSON.parse(oResponse.headers['sap-message']);
						if (!!sapMessage.target) {
							index = sapMessage.target.search('guid');
							if (index > 0) {
								uuid = sapMessage.target.substr(index + 5, 36);
								messageItem = {
									uuid: uuid,
									severity: sapMessage.severity,
									code: sapMessage.code,
									message: sapMessage.message
								};
								messageList[uuid] = messageItem;
							}
						}
						for (var x = 0; x < sapMessage.details.length; x++) {
							mItem = sapMessage.details[x];
							if (!!mItem && !!mItem.target) {
								index = mItem.target.search('guid');
								if (index > 0) {
									uuid = mItem.target.substr(index + 5, 36);
									messageItem = {
										uuid: uuid,
										severity: mItem.severity,
										code: mItem.code,
										message: mItem.message
									};
									messageList[uuid] = messageItem;
								}
							}
						}
					}
					if (!!oData && !!oData.results) {
						var drafts = [];
						var lv_draft = null;
						var lv_aResult = null;
						var aDraftItem = null;
						var currentOrderNumber = null;
						for (var i = 0; i < oData.results.length; i++) {
							lv_aResult = oData.results[i];
							// if (currentOrderNumber === null || currentOrderNumber !== lv_aResult.PurchNoC){
							// 	//push eixting to order list 
							// 	if (lv_draft !== null){
							// 		drafts.push(lv_draft);
							// 	}

							// 	lv_draft = {associatedDrafts:[]};
							// 	currentOrderNumber = lv_aResult.PurchNoC;
							// 	lv_draft.orderNumber= currentOrderNumber;

							// 	//lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
							// 	lv_draft.bpCode = lv_aResult.SoldtoParty;

							// 	lv_draft.createdOn = lv_aResult.CreationTimestamp;
							// 	lv_draft.modifiedOn = lv_aResult.CreationTimestamp;
							// 	lv_draft.zOrderType = lv_aResult.DocType;
							// 	lv_draft.scOrderType = that.getInnerOrderTypeByZOrderType(lv_draft.zOrderType);
							// 	lv_draft.scOrderStatus = 'DF'; // always standard as in front view

							// 	// new
							// 	aDraftItem ={};

							// 	aDraftItem.Division = lv_aResult.Division;
							// 	aDraftItem.SalesOrganization = lv_aResult.SalesOrg;
							// 	aDraftItem.DistributionChannel = lv_aResult.DistrChan;
							// 	aDraftItem.orderType =	lv_aResult.DocType;
							// 	aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;

							// 	lv_draft.associatedDrafts.push(aDraftItem);

							// } else {
							// 	// addmore - just add
							// 	if (lv_draft !== null){
							// 		lv_draft.modifiedOn = lv_aResult.CreationTimestamp;
							// 		aDraftItem ={};
							// 		aDraftItem.Division = lv_aResult.Division;
							// 		aDraftItem.SalesOrganization = lv_aResult.SalesOrg;
							// 		aDraftItem.DistributionChannel = lv_aResult.DistrChan;
							// 		aDraftItem.orderType =	lv_aResult.DocType;
							// 		aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;
							// 		lv_draft.associatedDrafts.push(aDraftItem);

							// 	}
							// }

							// SIMPLE WAY.	
							lv_draft = {
								associatedDrafts: []
							};
							currentOrderNumber = lv_aResult.PurchNoC;
							lv_draft.orderNumber = currentOrderNumber;

							//lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
							lv_draft.bpCode = lv_aResult.SoldtoParty;
							lv_draft.uuid = lv_aResult.HeaderDraftUUID;
							lv_draft.createdOn = lv_aResult.CreationTimestamp;
							lv_draft.modifiedOn = lv_aResult.CreationTimestamp;
							lv_draft.zOrderType = lv_aResult.DocType;
							lv_draft.isSalesOrder = true;
							lv_draft.scOrderType = that.getInnerOrderTypeByZOrderType(lv_draft.zOrderType);
							lv_draft.scOrderStatus = 'DF'; // always standard as in front view
							lv_draft.Status = lv_aResult.Status;
							lv_draft.Message = lv_aResult.Message;
							// new
							aDraftItem = {};

							aDraftItem.Division = lv_aResult.Division;
							aDraftItem.SalesOrganization = lv_aResult.SalesOrg;
							aDraftItem.DistributionChannel = lv_aResult.DistrChan;
							aDraftItem.orderType = lv_aResult.DocType;
							aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;

							lv_draft.associatedDrafts.push(aDraftItem);

							if (!!lv_draft && !!lv_draft.messages) {
								lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
							} else {
								lv_draft.messages = [];
								lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
							}

							//push eixting to order list 
							if (lv_draft !== null) {
								drafts.push(lv_draft);
							}
						}
						// OLD WAY 	
						// if (!!lv_draft ){
						// 	drafts.push(lv_draft);
						// 	lv_draft = null;
						// }
					}
					callback(drafts);
				},
				error: function (err) {
					callback(null);
				}
			});
				});
		},

		_searchPartsSalesOrder: function (exactMode, conditions, callback) {
			var that = this;
			var bModel = this.getSalesOrderModel();
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oFilter = new Array();
			//var dealerCode = conditions.dealerCode;
			var dealerCode = conditions.bpCode;

			oFilter[0] = new sap.ui.model.Filter("dealer_code", sap.ui.model.FilterOperator.EQ, dealerCode);

			var aFilter = null;

			if (!!exactMode) {
				if (!!conditions.tciOrderNumber) {
					aFilter = new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.EQ, conditions.tciOrderNumber.padStart(10, '0'));
					oFilter.push(aFilter);
				}
				if (!!conditions.deleveryNumber) {
					oFilter.push(new sap.ui.model.Filter("deliv_no", sap.ui.model.FilterOperator.EQ, conditions.deleveryNumber.padStart(10, '0')));
				}
				if (!!conditions.fiNumber) {
					oFilter.push(new sap.ui.model.Filter("bill_no", sap.ui.model.FilterOperator.EQ, conditions.fiNumber.padStart(10, '0')));
				}
				if (!!conditions.partNumber) {
					aFilter = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.EQ, conditions.partNumber);
					oFilter.push(aFilter);
				}
				oFilter.push(new sap.ui.model.Filter("erdat", sap.ui.model.FilterOperator.BT, conditions.fromOrderDate, conditions.toOrderDate));

			} else {
				oFilter[1] = new sap.ui.model.Filter("erdat", sap.ui.model.FilterOperator.BT, conditions.fromOrderDate, conditions.toOrderDate);

				if (!!conditions.partNumber) {
					aFilter = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.EQ, conditions.partNumber);
					oFilter.push(aFilter);
				}
				if (!!conditions.orderNumber) {
					aFilter = new sap.ui.model.Filter("dealer_orderNo", sap.ui.model.FilterOperator.EQ, conditions.orderNumber);
					oFilter.push(aFilter);
				}

				// order type has only one - standard order
				if (!!conditions.partsStates && conditions.partsStates.length > 0) {
					var partsSts = [];
					for (var x1 = 0; x1 < conditions.partsStates.length; x1++) {
						switch (conditions.partsStates[x1]) {
						case 'IP':
							partsSts.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'PR':
							partsSts.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'CL':
							partsSts.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'BK':
							partsSts.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'QtOp':
							partsSts.push(new sap.ui.model.Filter("open_qty", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'OpOR':
							partsSts.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.EQ, '0'));
							// partsSts.push(new sap.ui.model.Filter("quant_ordered", sap.ui.model.FilterOperator.NE, '0'));
							//New Field added for Quantity open
							partsSts.push(new sap.ui.model.Filter("open_qty", sap.ui.model.FilterOperator.EQ, '0'));
							break;
						}
					}
					aFilter = new sap.ui.model.Filter(partsSts, false);
					oFilter.push(aFilter);
				}

				if (!!conditions.orderStates && conditions.orderStates.length > 0) {
					var ordersSts = [];
					for (var x2 = 0; x2 < conditions.orderStates.length; x2++) {
						switch (conditions.orderStates[x2]) {
						case '1':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZOR'));
							break;
						case '2':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZRO'));
							break;
						case '3':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZCO'));
							break;
						case 'ZOR':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZOR'));
							break;
						case 'ZRO':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZRO'));
							break;
						case 'ZCO':
							ordersSts.push(new sap.ui.model.Filter("doc_type", sap.ui.model.FilterOperator.EQ, 'ZCO'));
							break;
						}
					}
					if (!!ordersSts && ordersSts.length > 0) {
						if (ordersSts.length === 1) {
							oFilter.push(ordersSts[0]);
						} else {
							aFilter = new sap.ui.model.Filter(ordersSts, false);
							oFilter.push(aFilter);
						}
					}
				}

			}

			bModel.read('/find_soSet', {
				urlParameters: {
					//     		 			"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime,to_PurchaseOrderItemTP",
					"$expand": "SOtoDeliv",
					"$orderby": "TCI_order_no,TCI_itemNo"
				},
				filters: oFilter,
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results) {
						callback(oData.results);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					callback(null);
					
					sap.m.MessageBox.show(oBundle.getText("correctDateRange"), sap.m.MessageBox.Icon.ERROR, "Error", sap.m.MessageBox.Action.OK, null, null);
				}
			});
		},

		loadSalesDraftByOrderNumber: function (dealer, orderData, callback) {
			var that = this;
			var lv_orderData = orderData;
			var bModel = this.getSalesOrderModel();
			//var key = bModel.createKey('/draft_soHeaderSet'	'HeaderDraftUUID': uuid,
			//	'IsActiveEntity': 'false'
			//});
				var bpCode= this.getStateModel().getProperty('/selectedBP/bpNumber');

			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("PurchNoC", sap.ui.model.FilterOperator.EQ, orderData.tciOrderNumber);

			oFilter[1] = new sap.ui.model.Filter("SoldtoParty", sap.ui.model.FilterOperator.EQ, bpCode);

			oFilter[2] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false);
            oFilter[3] = new sap.ui.model.Filter("Message", sap.ui.model.FilterOperator.EQ, 'EQ');

			bModel.read('/draft_soHeaderSet', {
				filters: new Array(new sap.ui.model.Filter({
					filters: oFilter,
					and: true
				})),
				urlParameters: {
					// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
					"$expand": "headerToItemDraft"
				},
				success: function (oData, oResponse) {
					var messageList = that._extractSapMessage(oResponse);

					var lv_aResultItem = null;
					var aDraftHeader = null;
					var aDraftItem = null;

					if (!!oData && (oData.results.length > 0)) {

						lv_orderData.createDate = oData.results[0].CreationTimestamp; //oData.CreatedOn;
						lv_orderData.modifiedOn = oData.results[0].CreationTimestamp;

						lv_orderData.zOrderType = oData.results[0].DocType;
						lv_orderData.isSalesOrder = true;
						lv_orderData.orderTypeId = that.getInnerOrderTypeByZOrderType(lv_orderData.zOrderType);
						lv_orderData.orderTypeName = that.getOrderTypeName(orderData.orderTypeId);
						lv_orderData.tciOrderNumber = oData.results[0].PurchNoC;

						//lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
						lv_orderData.bpCode = oData.results[0].SoldtoParty;

						aDraftHeader = {};
						aDraftHeader.DistributionChannel = oData.results[0].DistrChan;
						aDraftHeader.SalesOrganization = oData.results[0].SalesOrg;
						aDraftHeader.Division = oData.results[0].Division;
						aDraftHeader.OrderType = oData.results[0].DocType;
						aDraftHeader.DraftUUID = oData.results[0].HeaderDraftUUID;
						aDraftHeader.Lines = 0;

						lv_orderData.items = [];

						if (!!oData.results[0].headerToItemDraft && !!oData.results[0].headerToItemDraft.results) {
							for (var i = 0; i < oData.results[0].headerToItemDraft.results.length; i++) {
								lv_aResultItem = oData.results[0].headerToItemDraft.results[i];
								aDraftItem = {};
								//aDraftItem.line = lv_aResultItem.ItmNumber;
								aDraftItem.line = i + 1;
								aDraftItem.partNumber = lv_aResultItem.Material;
								aDraftItem.partDesc = ''; //lv_aResultItem.PurchaseOrderItemText;
								aDraftItem.qty = lv_aResultItem.TargetQty;
								aDraftItem.comment = lv_aResultItem.Comments;
								aDraftItem.uuid = lv_aResultItem.ItemDraftUUID;
								aDraftItem.parentUuid = lv_aResultItem.HeaderDraftUUID;
								aDraftItem.campaignNum = lv_aResultItem.Zzcampaign;
								aDraftItem.opCode = lv_aResultItem.Zzopcode;
								aDraftItem.vin = lv_aResultItem.VIN_no;
								aDraftItem.contractNum = lv_aResultItem.RefDoc;
								aDraftItem.contractLine = lv_aResultItem.RefDocItemNo;
								aDraftItem.partDesc = lv_aResultItem.MatDesc;
								aDraftItem.ItemStatus = "Draft";
								aDraftItem.Status = lv_aResultItem.Status;
							aDraftItem.Message = lv_aResultItem.Message;

								//aDraftItem.spq = lv_aResultItem:'',
								that.getSPQForDraftItem(aDraftItem, orderData);
								// messages - item level messages
								if (!!aDraftItem && !!aDraftItem.messages) {
									aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
								} else {
									aDraftItem.messages = [];
									aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
								}
								aDraftItem.messageLevel = that.getMessageLevel(aDraftItem.messages);
								lv_orderData.items.push(aDraftItem);
							}
						}
						aDraftHeader.Lines = lv_orderData.items.length;
						lv_orderData.associatedDrafts = [];
						lv_orderData.associatedDrafts.push(aDraftHeader);
						callback(lv_orderData);
					} else {
						// error handleing 
						callback(lv_orderData);
					}
				},
				error: function (err) {
					// error handling here
					callback(lv_orderData);
				}
			});
		},

		loadSalesDraft: function (uuid, orderData, callback) {
			var that = this;
			var lv_orderData = orderData;
			var bModel = this.getSalesOrderModel();
			var key = bModel.createKey('/draft_soHeaderSet', {
				'HeaderDraftUUID': uuid,
				'IsActiveEntity': 'false'
			});
			bModel.read(key, {
				urlParameters: {
					// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
					$expand: "headerToItemDraft"
				},
				success: function (oData, oResponse) {
					var messageList = that._extractSapMessage(oResponse);

					var lv_aResultItem = null;
					var aDraftHeader = null;
					var aDraftItem = null;

					if (!!oData) {
						lv_orderData.createDate = oData.CreationTimestamp; //oData.CreatedOn;
						lv_orderData.modifiedOn = oData.CreationTimestamp;

						lv_orderData.zOrderType = oData.DocType;
						lv_orderData.isSalesOrder = true;
						lv_orderData.orderTypeId = that.getInnerOrderTypeByZOrderType(lv_orderData.zOrderType);
						lv_orderData.orderTypeName = that.getOrderTypeName(orderData.orderTypeId);
						lv_orderData.tciOrderNumber = oData.PurchNoC;

						//lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
						lv_orderData.bpCode = oData.SoldtoParty;

						aDraftHeader = {};
						aDraftHeader.DistributionChannel = oData.DistrChan;
						aDraftHeader.SalesOrganization = oData.SalesOrg;
						aDraftHeader.Division = oData.Division;
						aDraftHeader.OrderType = oData.DocType;
						aDraftHeader.DraftUUID = oData.HeaderDraftUUID;
						aDraftHeader.Lines = 0;

						lv_orderData.items = [];

						if (!!oData.headerToItemDraft && !!oData.headerToItemDraft.results) {
							for (var i = 0; i < oData.headerToItemDraft.results.length; i++) {
								lv_aResultItem = oData.headerToItemDraft.results[i];
								aDraftItem = {};
								aDraftItem.line = i + 1;
								//aDraftItem.line = lv_aResultItem.ItmNumber;
								aDraftItem.partNumber = lv_aResultItem.Material;
								aDraftItem.partDesc = ''; //lv_aResultItem.PurchaseOrderItemText;
								aDraftItem.qty = lv_aResultItem.TargetQty;
								aDraftItem.comment = lv_aResultItem.Comments;
								aDraftItem.uuid = lv_aResultItem.ItemDraftUUID;
								aDraftItem.parentUuid = lv_aResultItem.HeaderDraftUUID;
								aDraftItem.campaignNum = lv_aResultItem.Zzcampaign;
								aDraftItem.opCode = lv_aResultItem.Zzopcode;
								aDraftItem.vin = lv_aResultItem.VIN_no;
								aDraftItem.contractNum = lv_aResultItem.RefDoc;
								aDraftItem.contractLine = lv_aResultItem.RefDocItemNo;
								aDraftItem.partDesc = lv_aResultItem.MatDesc;
								aDraftItem.ItemStatus = "Draft";
								that.getSPQForDraftItem(aDraftItem, orderData);
								//aDraftItem.spq = lv_aResultItem:'',

								// messages - item level messages
								if (!!aDraftItem && !!aDraftItem.messages) {
									aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
								} else {
									aDraftItem.messages = [];
									aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
								}
								aDraftItem.messageLevel = that.getMessageLevel(aDraftItem.messages);
								lv_orderData.items.push(aDraftItem);
							}
							
							sap.ui.getCore().getModel("APP_STATE_MODEL").setProperty("/selectedOrderMeta/contract_num", oData.headerToItemDraft.results[0].RefDoc);
						}
						
						aDraftHeader.Lines = lv_orderData.items.length;
						lv_orderData.associatedDrafts = [];
						lv_orderData.associatedDrafts.push(aDraftHeader);
						callback(lv_orderData);
					} else {
						// error handleing 
						callback(lv_orderData);
					}
				},
				error: function (err) {
					// error handling here
					callback(lv_orderData);
				}
			});
		},

		// [uuid, puuid] as key 
		updateSalesDraftItem: function (keys, valueObj, callback) {
			var that = this;
			var bModel = this.getSalesOrderModel();

			var key = bModel.createKey('/draft_soItemSet', {
				'HeaderDraftUUID': keys[1],
				'ItemDraftUUID': keys[0],
				'IsActiveEntity': false
			});

			bModel.update(key, valueObj, {
				success: function (oData, oResponse) {
					var messageList = that._extractSapItemMessages(oResponse);
					callback(oData, messageList);
				},
				error: function (oError) {
					callback(null);
				}
			});
		},

		validateDataSet: function (campCode, opCode, vinNo, partNum, callbackFn) {
			var that = this;
			var bModel = this.getProductModel();

			var key = bModel.createKey('/validate_dataSet', {
				'camp_code': campCode,
				'op_code': opCode,
				'VIN_no': vinNo,
				'part_no': partNum
			});
			bModel.read(key, {
				success: function (oData, oResponse) {
					var messageList = that._extractSapItemMessages(oResponse);
					callbackFn(oData, true, messageList);
				},
				error: function (oError) {
					var errorResponse = JSON.parse(oError.responseText);
					var errMessage = errorResponse.error.message.value;
					callbackFn(errMessage, false);
					//callback(null, false, []);
				}
			});
		},

		/*	// only for sale order 		// Moved To DataManager	
			validateContractNumber: function (bpCode, contract, part, callback) {
				var that = this;
				var bModel = this.getSalesOrderModel();

				var key = bModel.createKey('/contractNo_validationSet', {
					'camp_no': contract,
					'dealer_code': bpCode,
					'matnr': part
				});
				bModel.read(key, {
					success: function (oData, oResponse) {
						var messageList = that._extractSapItemMessages(oResponse);
						callback(oData, true, messageList);
					},
					error: function (oError) {
						var err = oError;
						callback(null, false, []);
					}
				});
			},*/

		_addSalesDraftItem: function (pUuid, data, orderType, callback) {
			var that = this;
			var bModel = this.getSalesOrderModel();
			var entry = bModel.createEntry('/draft_soItemSet', {});

			// item level data
			var obj = entry.getObject();
			obj.HeaderDraftUUID = pUuid;
			var len = 0;
			//obj.TargetQty = items[0].qty.toString();                //*
			obj.TargetQty = data.items[len].qty.toString() || "0"; //*
			obj.Material = data.items[len].partNumber; //*  
			obj.Comments = data.items[len].comment;
			obj.MatDesc = data.items[len].partDesc;
			if (!!data.typeD) { // Campiagn
				obj.Zzcampaign = data.items[len].campaignNum;
				obj.Zzopcode = data.items[len].opCode;
				obj.VIN_no = data.items[len].vin;
			} else if (!!data.typeB) {
				obj.RefDoc = data.items[len].contractNum;
				obj.RefDocItemNo = data.items[len].contractLine;
			}

			bModel.create('/draft_soItemSet', obj, {
				success: function (oData, oResponse) {
				
					var messageList = that._extractSapItemMessages(oResponse);
					data.items[len].uuid = oData.ItemDraftUUID;
					data.items[len].parentUuid = oData.HeaderDraftUUID;
					data.items[len].line = oData.ItmNumber;
					data.items[len].messageLevel = that.getMessageLevel(messageList);
					data.items[len].messages = messageList;
					callback(data.items[0]);
				},
				error: function (oError) {
					var err = oError;
					callback(null);
				}
			});
		},

		_createSalesOrderDraft: function (data, callback) {
			var that = this;
			//var lv_orderType = this.getRealOrderTypeByItemCategoryGroup( items[0].itemCategoryGroup , data.isSalesOrder, data.orderTypeId );
			var lv_orderType = this.getRealOrderTypeByItemCategoryGroup(data.items[0].itemCategoryGroup, data.isSalesOrder, data.orderTypeId);
			var aDraft = null;
			//first of all, let us find the existing order header, 
			for (var x1 = 0; x1 < data.associatedDrafts.length; x1++) {
				aDraft = data.associatedDrafts[x1];
				if (data.Division === aDraft.Division &&
					data.DistributionChannel === aDraft.DistributionChannel &&
					data.SalesOrganization === aDraft.SalesOrganization &&
					lv_orderType === aDraft.OrderType
				) {
					break;
				} else {
					aDraft = null;
				}
			}

			if (!!aDraft) {
				that._addSalesDraftItem(aDraft.DraftUUID, data, lv_orderType, function (rItem) {
					if (!!rItem) {
						//data.items.push(rItem);
						aDraft.Lines = aDraft.Lines + 1;
						callback(data, true);
					} else {
						callback(data, false);
					}
				});
			} else {
				var bModel = this.getSalesOrderModel();;
				var entry = bModel.createEntry('/draft_soHeaderSet', {});
				var obj = entry.getObject();

				// populate the values
				obj.Division = data.Division;
				obj.SalesOrg = data.SalesOrganization;
				obj.DistrChan = data.DistributionChannel;

				obj.SoldtoParty = data.purBpCode;
				obj.PurchNoC = data.tciOrderNumber;
				obj.DocType = lv_orderType;

				// if (!!items[0].contractNum){
				// 	obj.ContractNumber = items[0].contractNum;
				// 	obj.ContractNumber ="1";
				// } else {
				// 	obj.ContractNumber ="1";
				// }

				bModel.create('/draft_soHeaderSet', obj, {
					success: function (oData, response) {
						// prepare aDraft
						aDraft = {};
						aDraft.SalesOrganization = oData.SalesOrg;
						aDraft.DistributionChannel = oData.DistrChan;
						aDraft.Division = oData.Division;
						aDraft.OrderType = oData.DocType;
						aDraft.DraftUUID = oData.HeaderDraftUUID;
						aDraft.Lines = 0;

						that._addSalesDraftItem(aDraft.DraftUUID, data, lv_orderType, function (rItem) {
							if (!!rItem) {
								//data.items.push(rItem);
								aDraft.Lines = aDraft.Lines + 1;
								data.associatedDrafts.push(aDraft);
								callback(data, true);
							} else {
								data.associatedDrafts.push(aDraft);
								callback(data, false);
							}
						});
					},
					error: function (oError) {
						var err = oError;
						callback(data, false);
					}
				});
			}
		},
		// END -- ZC_CREATE_SO_SRV model related			

		// START -- SALES/PO related
		searchPartsOrders: function (exactMode, conditions, isSalesOrder, callback) {
			var that = this;
			if (!!isSalesOrder) {
				that._searchPartsSalesOrder(exactMode, conditions, function (oList) {
					if (!!oList && oList.length > 0) {

						var finalList = [];
						var currentItem = null;
						var oldItem = null;
						var currentKey = {};
						currentKey.TCI_order_no = null;
						currentKey.TCI_itemNo = null;
						var aSLine = null;
						var deliveryLine = null;
						var fiLine = null;

						for (var i = 0; i < oList.length; i++) {
							oList[i].quant_ordered = parseFloat(oList[i].quant_ordered);
							oList[i].quant_in_process = parseFloat(oList[i].quant_in_process);
							oList[i].quant_processed = parseFloat(oList[i].quant_processed);
							oList[i].quant_cancelled = parseFloat(oList[i].quant_cancelled);
							oList[i].quant_back_ordered = parseFloat(oList[i].quant_back_ordered);
							oList[i].open_qty = parseFloat(oList[i].open_qty); //MA21Feb20++ Open Qty added
							currentItem = oList[i];

							if (currentKey.TCI_order_no === currentItem.TCI_order_no && currentKey.TCI_itemNo === currentItem.TCI_itemNo) {
								//TODO									
							} else {
								if (!!oldItem) {
									oldItem.deliv_no_str = oldItem.deliv_no_list.join('.');
									oldItem.bill_no_str = oldItem.bill_no_list.join('.');
									finalList.push(oldItem);
								}

								oldItem = currentItem;
								oldItem.subs = oldItem.sub_flag === 'YES' ? true : false;
								oldItem.scheduleLines = [];
								oldItem.deliv_no_list = [];
								oldItem.bill_no_list = [];
								// last 
								currentKey.TCI_order_no = currentItem.TCI_order_no;
								currentKey.TCI_itemNo = currentItem.TCI_itemNo;

							}
							// prepare for the line items
							if (!!currentItem.SOtoDeliv && !!currentItem.SOtoDeliv.results && currentItem.SOtoDeliv.results.length > 0) {
								for (var x = 0; x < currentItem.SOtoDeliv.results.length; x++) {
									deliveryLine = currentItem.SOtoDeliv.results[x];
									if (!!deliveryLine) {
										aSLine = {};
										aSLine.deliv_itemNo = deliveryLine.deliv_itemNo;
										aSLine.deliv_no = deliveryLine.deliv_no;
										oldItem.deliv_no_list.push(aSLine.deliv_no);

										aSLine.bill_itemNo = deliveryLine.bill_itemNo;
										aSLine.bill_no = deliveryLine.bill_no;
										oldItem.bill_no_list.push(aSLine.bill_no);

										aSLine.estm_deliv_date = that.s2date(deliveryLine.estm_deliv_dt);
										aSLine.deliv_qty = deliveryLine.deliv_qty;
										aSLine.cnf_qty = deliveryLine.cnf_qty;

										oldItem.scheduleLines.push(aSLine);
									}

								}

							}
							currentItem = null;
						}
						if (!!oldItem) {
							finalList.push(oldItem);
						}

						callback(finalList);

					} else {
						callback([]);
					}
				});
			} else {
				this._searchPurchaseOrder(exactMode, conditions, function (oList) {
					if (!!oList && oList.length > 0) {
						var finalList = [];
						var currentItem = null;
						var oldItem = null;
						var currentKey = {};
						currentKey.TCI_order_no = null;
						currentKey.TCI_itemNo = null;
						var aSLine = null;
						var deliveryLine = null;
						var fiLine = null;

						for (var i = 0; i < oList.length; i++) {
							oList[i].quant_ordered = parseFloat(oList[i].quant_ordered);
							oList[i].quant_in_process = parseFloat(oList[i].quant_in_process);
							oList[i].quant_processed = parseFloat(oList[i].quant_processed);
							oList[i].quant_cancelled = parseFloat(oList[i].quant_cancelled);
							oList[i].quant_back_ordered = parseFloat(oList[i].quant_back_ordered);
							oList[i].open_qty = parseFloat(oList[i].open_qty); //MA21Feb20++ Open Qty added
							currentItem = oList[i];
							if (currentKey.TCI_order_no === currentItem.TCI_order_no && currentKey.TCI_itemNo === currentItem.TCI_itemNo) {
								//TODO										
							} else {
								if (!!oldItem) {
									oldItem.deliv_no_str = oldItem.deliv_no_list.join('.');
									oldItem.bill_no_str = oldItem.bill_no_list.join('.');
									finalList.push(oldItem);
								}

								oldItem = currentItem;
								oldItem.subs = oldItem.sub_flag === 'YES' ? true : false;
								oldItem.scheduleLines = [];
								oldItem.deliv_no_list = [];
								oldItem.bill_no_list = [];
								// last 
								currentKey.TCI_order_no = currentItem.TCI_order_no;
								currentKey.TCI_itemNo = currentItem.TCI_itemNo;

							}
							// prepare for the line items
							if (!!currentItem.POtoDeliv && !!currentItem.POtoDeliv.results && currentItem.POtoDeliv.results.length > 0) {
								for (var x = 0; x < currentItem.POtoDeliv.results.length; x++) {
									deliveryLine = currentItem.POtoDeliv.results[x];
									if (!!deliveryLine) {
										aSLine = {};
										aSLine.deliv_itemNo = deliveryLine.deliv_itemNo;
										aSLine.deliv_no = deliveryLine.deliv_no;
										oldItem.deliv_no_list.push(aSLine.deliv_no);

										aSLine.bill_itemNo = deliveryLine.bill_itemNo;
										aSLine.bill_no = deliveryLine.bill_no;
										oldItem.bill_no_list.push(aSLine.bill_no);

										aSLine.estm_deliv_date = that.s2date(deliveryLine.estm_deliv_dt);
										aSLine.deliv_qty = deliveryLine.deliv_qty;
										aSLine.cnf_qty = deliveryLine.cnf_qty;

										oldItem.scheduleLines.push(aSLine);
									}

								}

							}
							currentItem = null;
						}
						if (!!oldItem) {
							finalList.push(oldItem);
						}
						callback(finalList);

					} else {
						callback([]);
					}

				});
			}

		},

		deleteDraft: function (uuid, isSalesOrder, callback) {
			var that = this;
			var bModel = null;
			var key = null;
			if (!!isSalesOrder) {
				bModel = this.getSalesOrderModel();
				key = bModel.createKey('/draft_soHeaderSet', {
					'HeaderDraftUUID': uuid,
					'IsActiveEntity': false
				});
				bModel.remove(key, {
					success: function (oData, oResponse) {
						// process sap-message?
						callback(uuid, true);
					},
					error: function (err) {
						callback(uuid, false);
					},
					refreshAfterChange: false
				});
			} else {
				bModel = this.getPurchaseOrderModel();
				key = bModel.createKey('/Draft_POHeaderSet', {
					'HeaderDraftUUID': uuid,
					'IsActiveEntity': false
				});
				bModel.remove(key, {
					success: function (oData, oResponse) {
						// process sap-message?
						callback(uuid, true);
					},
					error: function (err) {
						callback(uuid, false);
					},
					refreshAfterChange: false
				});
			}
		},

		/// only for Z004/Z005 
		getInfoFromPart_Old: function (partNum, bpVendor, callback) {
			var that = this;
			var cacheData = this.getPartCacheData();
			var cacheDataItem = null;
			var lv_supplier = bpVendor;
			var hasError = false;
			// step control in the async mode 				
			var stepsContorl = [false, false, false, false, false, false];

			// var isFinished = false;
			function isFinished() {
				if (stepsContorl[0] && stepsContorl[1] && stepsContorl[2] && stepsContorl[3] && stepsContorl[4] && stepsContorl[5]) {
					return true;
				}
				return false;
			}

			if (!!cacheData && !!cacheData[partNum]) {
				// if already has, return cache version
				callback(cacheData[partNum]);
				return;
			} else {
				if (!!partNum) {
					if (!!!cacheData) {
						cacheData = [];
					}

					if (!!!cacheDataItem) {
						cacheDataItem = {};
					}

					// get the item group and so 
					that.getPartsInfoById(partNum, function (item1Data) {
						stepsContorl[0] = true;
						if (!!item1Data) {
							if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length > 0) {
								var finishedCount = 0;
								for (var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++) {
									// rounding profile  -- get the first one then			            	
									that.getRoundingprofileOFVendor(partNum,
										item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
										item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl,
										function (item2Data) {

											finishedCount = finishedCount + 1;
											if (!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile) {
												stepsContorl[1] = true;
												cacheDataItem.spq = item2Data.Item.Roundingprofile;
											} else if (finishedCount >= item1Data.to_SalesDelivery.results.length) {
												stepsContorl[1] = true;
												// can not find anything
											}
											// return is all finished 
											if (isFinished()) {
												if (hasError) {
													callback(null);
												} else {
													cacheData.push(cacheDataItem);
													callback(cacheDataItem);
												}
											}
										});
								}
							} else {
								stepsContorl[1] = true;
								hasError = true;
								if (isFinished()) {
									callback(null);
								}
							}

							cacheDataItem.itemCategoryGroup = item1Data.ItemCategoryGroup;
							var lv_orderType = that.getRealOrderTypeByItemCategoryGroup(item1Data.ItemCategoryGroup, false, null);

							that.getMaterialById(partNum, function (data) {
								// step one if finished 
								stepsContorl[2] = true;
								if (!!data) {
									cacheDataItem.partDesc = data.MaterialName;

									if ('ZLOC' === lv_orderType) {
										var infoRecord = null;
										if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
											for (var i = 0; i < data.to_PurchasingInfoRecord.results.length; i++) {
												infoRecord = data.to_PurchasingInfoRecord.results[i];
												if (infoRecord.IsDeleted) {
													infoRecord = null;
												} else {
													// only the none deleted infoRecord will survive
													break;
												}
											}
										}

										if (!!infoRecord && !infoRecord.IsDeleted) {
											// get the first record only. 
											lv_supplier = infoRecord.Supplier;
											var lvPurchasingInfoRecord = infoRecord.PurchasingInfoRecord;
											cacheDataItem.supplier = lv_supplier;
											cacheDataItem.purInfoRecord = lvPurchasingInfoRecord;

											// the following is almost in para, don't know which one will be return first 
											// get the company code 
											that.getCompanyCodeByVendor(lv_supplier, function (o1Data) {
												stepsContorl[3] = true;
												if (!!o1Data && !!o1Data.CompanyCode && !!lv_supplier) {
													cacheDataItem.companyCode = o1Data.CompanyCode;
												}
												// return is all finished 
												if (isFinished()) {
													if (hasError) {
														callback(null);
													} else {
														cacheData.push(cacheDataItem);
														callback(cacheDataItem);
													}
												}
											});

											that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord,
												"7019",
												function (cData) {
													stepsContorl[4] = true;
													if (!!cData && !!lvPurchasingInfoRecord) {
														cacheDataItem.currency = cData.Currency;
														if (hasError) {
															callback(null);
															cacheDataItem.netPriceAmount = cData.NetPriceAmount;
															cacheDataItem.taxCode = cData.TaxCode;
														}
														// return is all finished 
														if (isFinished()) {} else {
															cacheData.push(cacheDataItem);
															callback(cacheDataItem);
														}
													}
												});

											// find the infoReord
											that.getStorageInfo(lv_supplier, function (data) {
												stepsContorl[5] = true;
												// populate the rest of field
												if (!!data && !!lv_supplier) {
													cacheDataItem.sloc = data.SLoc;
													cacheDataItem.revPlant = data.Plant;
												}
											});
										} else {
											stepsContorl[3] = true;
											stepsContorl[4] = true;
											stepsContorl[5] = true;
											hasError = true;
											if (isFinished()) {
												callback(null);
											}
										}
									} else if ('UB' === lv_orderType) {

										// bypass all those steps
										stepsContorl[3] = true;
										stepsContorl[4] = true;
										stepsContorl[5] = true;
										if (isFinished()) {
											cacheData.push(cacheDataItem);
											callback(cacheDataItem);
										}

										// that.getCompanyCodeByVendor(lv_supplier, function(o1Data){
										// 	stepsContorl[3] = true;
										// 	if (!!o1Data && !!o1Data.CompanyCode &&!!lv_supplier){
										// 		cacheDataItem.companyCode =o1Data.CompanyCode;
										// } 
										// // return is all finished 
										// if(isFinished()){
										// 	if(hasError){
										// 		callback(null);
										// 	} else {
										// 		cacheData.push(cacheDataItem);
										// 		callback(cacheDataItem);
										// 	}
										// }
										// });

										// stepsContorl[4] = true;

										// that.getSupplierInfo(lv_supplier, function(data){
										//       			stepsContorl[4] = true;
										// 	if (!!data && !!lv_supplier){
										// 		cacheDataItem.companyCode = 'xx';
										// 	}											
										// });

										// that.getStorageInfo(lv_supplier, function(data){
										//      				stepsContorl[5] = true;
										// 	// populate the rest of field
										// 	if (!!data && !!lv_supplier){
										// 		cacheDataItem.sloc = data.SLoc;
										// 		cacheDataItem.revPlant = data.Plant;
										// 	}
										// 								// return is all finished 
										// 								if(isFinished()){
										// 									if(hasError){
										//   									callback(null);
										// 									} else {
										//   									cacheData.push(cacheDataItem);
										//   									callback(cacheDataItem);
										// 									}
										// 								}
										// });     											

									} else {
										stepsContorl[3] = true;
										stepsContorl[4] = true;
										stepsContorl[5] = true;
										hasError = true;
										if (isFinished()) {
											callback(null);
										}
									}

								} else {
									// call bacl null, as serious error
									stepsContorl[3] = true;
									stepsContorl[4] = true;
									stepsContorl[5] = true;
									hasError = true;
									if (isFinished()) {
										callback(null);
									}
								}
							});
						} else {
							callback(null);
						}
					});

				} else {
					// noting to return
					callback(null);
					return;
				}
			}
		},

		getInfoFromPartx: function (partNum, revPlant, callback) {
			var that = this;
			var cacheData = this.getPartCacheData();
			var cacheDataItem = null;

			var hasError = false;
			// step control in the async mode 				
			var stepsContorl = [false, false, false, false, false];

			// var isFinished = false;
			function isFinished() {
				if (stepsContorl[0] && stepsContorl[1] && stepsContorl[2] && stepsContorl[3] && stepsContorl[4]) {
					return true;
				}
				return false;
			}

			if (!!cacheData && !!cacheData[partNum]) {
				// if already has, return cache version
				callback(cacheData[partNum]);
				return;
			} else {
				if (!!partNum) {
					if (!!!cacheData) {
						cacheData = [];
					}

					if (!!!cacheDataItem) {
						cacheDataItem = {};
					}

					// first step, get the infoRecord
					that.getMaterialById(partNum, function (data) {
						// step one if finished 
						stepsContorl[0] = true;
						if (!!data) {
							cacheDataItem.division = data.Division;
							cacheDataItem.partDesc = data.MaterialName;

							// find the infoReord
							var infoRecord = null;
							if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
								for (var i = 0; i < data.to_PurchasingInfoRecord.results.length; i++) {
									infoRecord = data.to_PurchasingInfoRecord.results[i];
									if (infoRecord.IsDeleted) {
										infoRecord = null;
									} else {
										// only the none deleted infoRecord will survive
										break;
									}
								}
							}

							if (!!infoRecord && !infoRecord.IsDeleted) {
								// get the first record only. 
								var lv_supplier = infoRecord.Supplier;
								var lvPurchasingInfoRecord = infoRecord.PurchasingInfoRecord;
								cacheDataItem.supplier = lv_supplier;
								cacheDataItem.purInfoRecord = lvPurchasingInfoRecord;

								// the following is almost in para, don't know which one will be return first 
								// get the company code 
								that.getCompanyCodeByVendor(lv_supplier, function (o1Data) {
									stepsContorl[1] = true;
									if (!!o1Data && !!o1Data.CompanyCode && !!lv_supplier) {
										cacheDataItem.companyCode = o1Data.CompanyCode;
									}
									// return is all finished 
									if (isFinished()) {
										if (hasError) {
											callback(null);
										} else {
											cacheData.push(cacheDataItem);
											callback(cacheDataItem);
										}
									}
								});

								that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord,
									"7019",
									function (cData) {
										stepsContorl[2] = true;
										if (!!cData && !!lvPurchasingInfoRecord) {
											cacheDataItem.currency = cData.Currency;
											cacheDataItem.netPriceAmount = cData.NetPriceAmount;
											cacheDataItem.taxCode = cData.TaxCode;
										}
										// return is all finished 
										if (isFinished()) {
											if (hasError) {
												callback(null);
											} else {
												cacheData.push(cacheDataItem);
												callback(cacheDataItem);
											}
										}
									});
							} else {
								// can not find infoRecord not saving, really bad
								// callback(null);
								stepsContorl[1] = true;
								stepsContorl[2] = true;
								hasError = true;
								if (isFinished()) {
									callback(null);
								}
							}

						} else {
							// call bacl null, as serious error
							stepsContorl[1] = true;
							stepsContorl[2] = true;
							hasError = true;
							if (isFinished()) {
								callback(null);
							}
						}
					});

					// get the item group and so 
					that.getPartsInfoById(partNum, function (item1Data) {
						stepsContorl[3] = true;
						if (!!item1Data) {
							cacheDataItem.itemCategoryGroup = item1Data.ItemCategoryGroup;
							if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length > 0) {
								var finishedCount = 0;
								for (var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++) {
									// rounding profile  -- get the first one then			            	
									that.getRoundingprofileOFVendor(partNum,
										item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
										item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl,
										function (item2Data) {

											finishedCount = finishedCount + 1;
											if (!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile) {
												stepsContorl[4] = true;
												cacheDataItem.spq = item2Data.Item.Roundingprofile;
											} else if (finishedCount >= item1Data.to_SalesDelivery.results.length) {
												stepsContorl[4] = true;
												// can not find anything
											}
											// return is all finished 
											if (isFinished()) {
												if (hasError) {
													callback(null);
												} else {
													cacheData.push(cacheDataItem);
													callback(cacheDataItem);
												}
											}
										});
								}
							} else {
								stepsContorl[4] = true;
								hasError = true;
								if (isFinished()) {
									callback(null);
								}
							}
						} else {
							stepsContorl[4] = true;
							hasError = true;
							if (isFinished()) {
								callback(null);
							}
						}
					});

				} else {
					// noting to return
					callback(null);
					return;
				}
			}
		},

		//// only failed record will be returning message. message of good one will be ignored
		deleteOrderDraftItem: function (keys, isSalesOrder, callback) {
			var that = this;
			var rStructure = {
				keys: keys
			};

			var bModel = null;
			var key = null;
			if (!!isSalesOrder) {
				bModel = this.getSalesOrderModel();
				key = bModel.createKey('/draft_soItemSet', {
					'ItemDraftUUID': keys[0],
					'HeaderDraftUUID': keys[2],
					'IsActiveEntity': false
				});
				bModel.remove(key, {
					success: function (oData, oResponse) {
						var messageList = that._extractSapItemMessages(oResponse);
						callback(keys, true, messageList);
					},
					error: function (oError) {
						var err = oError;
						callback(keys, true, []);
					}
				});

			} else {
				bModel = this.getPurchaseOrderModel();
				key = bModel.createKey('/Draft_POItemSet', {
					'HeaderDraftUUID': keys[2],
					'ItemDraftUUID': keys[0],
					'IsActiveEntity': false
				});

				bModel.remove(key, {
					success: function (oData, oResponse) {
						var messageList = that._extractSapItemMessages(oResponse);
						callback(keys, true, messageList);
					},
					error: function (oError) {
						callback(keys, false, []);
					}
				});
			}

		},

		activateDraft: function (uuid, index, isSalesOrder, callBack) {
			var that = this;
			var bModel = null;
			if (!!uuid) {
				if (!!isSalesOrder) {

					bModel = this.getSalesOrderModel(); //TODORY
					bModel.callFunction('/DraftToSO', {
						method: "GET",
						urlParameters: {
							TestRun: false,
							HeaderDraftUUID: uuid,
							IsActiveEntity: true
						},
						success: function (oData, oResponse) {
							var messageList = that._extractSapItemMessages(oResponse);
							//var hasError = that._hasError(messageList);
							//orderDraft.draftUuid = oData.DraftUUID;                         
							var orderNumber = null;

							orderNumber = oData.vbeln;
							var addiMesssage = oData.message;

							callBack(orderNumber, index, messageList);
						},
						error: function (oError) {
							var messageList = that._extractSapErrorMessage(oError);
							callBack(null, index, messageList);
						}
					});

				} else {
					bModel = this.getPurchaseOrderModel();

					bModel.callFunction('/DraftToPO', {
						method: "GET",
						urlParameters: {
							TestRun: false,
							HeaderDraftUUID: uuid,
							IsActiveEntity: true
						},
						success: function (oData, oResponse) {
							var messageList = that._extractSapItemMessages(oResponse);
							//var hasError = that._hasError(messageList);
							//orderDraft.draftUuid = oData.DraftUUID;         
							var orderNumber = null;
							orderNumber = oData.ebeln;
							var addiMesssage = oData.message;
							callBack(orderNumber, index, messageList);
						},
						error: function (oError) {
							var messageList = that._extractSapErrorMessage(oError);
							callBack(null, index, messageList);
						}
					});
				}
			}
		},

		createOrderDraft: function (data, callback) {
			if (!!data && !!data.isSalesOrder) {
				return this._createSalesOrderDraft(data, callback);
			} else {
				return this._createPurchaseOrderDraft(data, callback);
			}
		},

		searchDraftByDealerCode: function (dealer, bpNumber, bpType, conditions, callback) {
			if (this.isSalesOrderAssociated(bpType)) {
				return this.searchSalesOrdDraftByDealerCode(bpNumber, conditions, callback);
			} else {
				return this.searchPurOrdDraftByDealerCode(dealer, conditions, callback);
			}
		},

		loadDealerDraft: function (dealer, orderData, callback) {
			var that = this;
			if (!!orderData.isSalesOrder) {
				if (!!orderData.DraftUUID) {
					return that.loadSalesDraft(orderData.DraftUUID, orderData, callback);
				} else {
					return that.loadSalesDraftByOrderNumber(dealer, orderData, callback);
					//callback(orderData);
				}
			} else {
				return this.loadPurDealerDraft(dealer, orderData, callback);
			}
		},
		// END -- SALES/PO related

		// Start of new Purchase Order
		_createPurchaseOrderDraft: function (data, callback) {
			var that = this;
			var aDraft = null;
			var lv_orderType = this.getRealOrderTypeByItemCategoryGroup(data.items[0].itemCategoryGroup, data.isSalesOrder, data.orderTypeId);

			//first of all, let us find the existing order header, 

			for (var x1 = 0; x1 < data.associatedDrafts.length; x1++) {
				aDraft = data.associatedDrafts[x1];
				if (lv_orderType === "UB" && lv_orderType === aDraft.OrderType) {
					break;
				} else if (lv_orderType === "ZLOC" && data.purchaseOrg === aDraft.PurchasingOrganization &&
					data.purchasingGroup === aDraft.PurchasingGroup &&
					data.supplier === aDraft.Supplier &&
					lv_orderType === aDraft.OrderType
				) {
					break;
				} else {
					aDraft = null;
				}
			}

			var lv_supplier = null;
			if ('UB' === lv_orderType) {
				lv_supplier = data.purBpCode;
			} else if ('ZLOC' === lv_orderType) {
				lv_supplier = data.supplier;
			}

			//var aDraft = null;
			//first of all, let us find the existing order header, 
			/*for (var x1 = 0; x1 < data.associatedDrafts.length; x1++) {
				aDraft = data.associatedDrafts[x1];
				if (data.purchaseOrg === aDraft.PurchasingOrganization &&
					data.purchasingGroup === aDraft.PurchasingGroup &&
					lv_supplier === aDraft.Supplier &&
					lv_orderType === aDraft.OrderType
				) {
					break;
				} else {
					aDraft = null;
				}
			}*/

			if (!!aDraft) {
				that._addOrderDraftItem(aDraft.DraftUUID, data, lv_orderType, function (rItem) {
					if (!!rItem) {
						//data.items.push(rItem);
						aDraft.Lines = aDraft.Lines + 1;
					}
					callback(data, true);
				});
			} else {
				//for now, only create purchase order, will be an condition here for sales order
				var bModel = this.getPurchaseOrderModel();

				// --- BYPASS -1
				// var entry = bModel.createEntry('/Draft_POHeaderSet', {});
				// var obj = entry.getObject();

				var obj = {};
				// --- BYPASS -1

				obj.Purch_Org = data.purchaseOrg;
				obj.Pur_Group = data.purchasingGroup;
				obj.DealerCode = data.dealerCode;
				obj.DealerOrderNo = data.tciOrderNumber;
				obj.Doc_Type = lv_orderType;

				// do we nee it?
				obj.Comp_Code = data.companyCode;

				//TODO
				if ('UB' === lv_orderType) {
					//				obj.Supplier = data.revPlant;
					obj.Suppl_Plnt = data.stoSupplyingPlant;
					obj.Currency = data.documentCurrency;
					//				obj.Currency= "USD";
					//				obj.Pur_Group = "150";
				} else if ('ZLOC' === lv_orderType) {
					//fake the data					
					//				obj.Comp_Code = "2014";
					//				obj.Currency= "USD";
					//				obj.Pur_Group = "500";
					//				lv_supplier = "T2030";
					obj.Currency = data.items[0].currency || 'CAD';
					obj.Vendor = data.supplier;
					//obj.Supplier = data.Supplier;
				}

				// --- BYPASS -1
				bModel.create('/Draft_POHeaderSet', {
					"d": obj
				}, {
					success: function (oData, response) {
						// prepare aDraft
						aDraft = {};
						aDraft.PurchasingOrganization = oData.Purch_Org;
						aDraft.PurchasingGroup = oData.Pur_Group;
						aDraft.Supplier = oData.Vendor;
						aDraft.OrderType = oData.Doc_Type;
						aDraft.DraftUUID = oData.HeaderDraftUUID;
						aDraft.Lines = 0;

						that._addOrderDraftItem(aDraft.DraftUUID, data, lv_orderType, function (rItem) {
							if (!!rItem) {
								//data.items.push(rItem);
								aDraft.Lines = aDraft.Lines + 1;
							}
							data.associatedDrafts.push(aDraft);
							callback(data, true);
						});
					},
					error: function (oError) {
						callback(data, false);
					}
				});
			}
		},

		_addOrderDraftItem: function (pUuid, data, orderType, callback) {
			var that = this;
			var bModel = this.getPurchaseOrderModel();

			// --- PYPASS -1
			// var entry = bModel.createEntry('/Draft_POItemSet', {});
			// item level data
			// var obj = entry.getObject();

			var obj = {};
			// --- PYPASS -1
			var len = 0;
			obj.HeaderDraftUUID = pUuid;
			obj.Quantity = data.items[len].qty.toString() || "";
			obj.Material = data.items[len].partNumber;
			obj.Comments = data.items[len].comment;
			obj.MatDesc = data.items[len].partDesc;

			// fake the data	
			obj.Po_Unit = 'EA';

			if ('UB' === orderType) {
				obj.Plant = data.revPlant;
				obj.Stge_Loc = data.sloc;
				//					obj.Plant = "6000";          
			} else if ('ZLOC' === orderType) {
				//					obj.Plant = "6000";          // Should I pass the sloc?
				obj.Plant = data.revPlant;
				obj.Stge_Loc = data.sloc;
				//obj.PurchasingInfoRecord=items[0].purInfoRecord;
			}

			// --- PYPASS -1
			//				bModel.create("/Draft_POItemSet", obj, {
			bModel.create("/Draft_POItemSet", {
				"d": obj
			}, {
				success: function (oData, oResponse) {
					var messageList = that._extractSapItemMessages(oResponse);
					data.items[len].uuid = oData.ItemDraftUUID;
					data.items[len].parentUuid = oData.HeaderDraftUUID;
					data.items[len].line = oData.Po_Item;
					data.items[len].messageLevel = that.getMessageLevel(messageList);
					data.items[len].messages = messageList;
					callback(data.items[0]);
				},
				error: function (oError) {
					callback(null);
				}
			});
		},

		searchPurOrdDraftByDealerCode: function (dealer, conditions, callback) {
			var that = this;
			var bModel = this.getPurchaseOrderModel();
			var oFilter = new Array();

			var dealerCode = dealer;

			//				oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
			oFilter[0] = new sap.ui.model.Filter("DealerCode", sap.ui.model.FilterOperator.EQ, dealerCode);
			if (!!conditions) {
				if (!!conditions.orderNumber) {
					oFilter[2] = new sap.ui.model.Filter("DealerOrderNo", sap.ui.model.FilterOperator.EQ, conditions.orderNumber);
				}
			}

			bModel.read('/Draft_POHeaderSet', {
				urlParameters: {
					//	"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime",
					"$orderby": "DealerCode,DealerOrderNo,CreatedOn",
					"$expand": "headerToItemDraft"
				},
				filters: oFilter,
				success: function (oData, oResponse) {
					var sapMessage = null;
					var messageList = [];
					var messageItem = null;
					var uuid = null;
					var target = null;
					var index = 0;
					var mItem = null;
					if (!!oResponse && !!oResponse.headers['sap-message']) {
						sapMessage = JSON.parse(oResponse.headers['sap-message']);
						if (!!sapMessage.target) {
							index = sapMessage.target.search('guid');
							if (index > 0) {
								uuid = sapMessage.target.substr(index + 5, 36);
								messageItem = {
									uuid: uuid,
									severity: sapMessage.severity,
									code: sapMessage.code,
									message: sapMessage.message
								};
								messageList[uuid] = messageItem;
							}
						}
						for (var x = 0; x < sapMessage.details.length; x++) {
							mItem = sapMessage.details[x];
							if (!!mItem && !!mItem.target) {
								index = mItem.target.search('guid');
								if (index > 0) {
									uuid = mItem.target.substr(index + 5, 36);
									messageItem = {
										uuid: uuid,
										severity: mItem.severity,
										code: mItem.code,
										message: mItem.message
									};
									messageList[uuid] = messageItem;
								}
							}
						}
					}

					if (!!oData && !!oData.results) {
						var drafts = [];
						var lv_draft = null;
						var lv_aResult = null;
						var aDraftItem = null;
						var currentOrderNumber = null;
						for (var i = 0; i < oData.results.length; i++) {
							lv_aResult = oData.results[i];

							if (currentOrderNumber === null || currentOrderNumber !== lv_aResult.DealerOrderNo) {
								//push eixtingto order list 
								if (lv_draft !== null) {
									drafts.push(lv_draft);
								}

								lv_draft = {
									associatedDrafts: []
								};
								currentOrderNumber = lv_aResult.DealerOrderNo;
								lv_draft.orderNumber = currentOrderNumber;

								lv_draft.dealerCode = lv_aResult.DealerCode;
								lv_draft.createdOn = that.s2date(lv_aResult.CreatedOn);
								lv_draft.modifiedOn = lv_draft.createdOn;
								lv_draft.scOrderType = "1"; // always standard as in front view 

								// new
								aDraftItem = {};
								aDraftItem.purchaseOrg = lv_aResult.Purch_Org;
								aDraftItem.purchaseGrp = lv_aResult.Pur_Group;
								aDraftItem.supplier = lv_aResult.Vendor;
								aDraftItem.orderType = lv_aResult.Doc_Type;
								aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;

								lv_draft.associatedDrafts.push(aDraftItem);

							} else {
								// addmore - just add
								if (lv_draft !== null) {
									lv_draft.modifiedOn = that.s2date(lv_aResult.CreatedOn);
									aDraftItem = {};
									aDraftItem.purchaseOrg = lv_aResult.Purch_Org;
									aDraftItem.purchaseGrp = lv_aResult.Pur_Group;
									aDraftItem.supplier = lv_aResult.Vendor;
									aDraftItem.orderType = lv_aResult.Doc_Type;
									aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;

									lv_draft.associatedDrafts.push(aDraftItem);

								}
							}

							if (!!lv_draft && !!lv_draft.messages) {
								lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
							} else {
								lv_draft.messages = [];
								lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
							}
						}
						if (!!lv_draft) {
							drafts.push(lv_draft);
							lv_draft = null;
						}
					}
					callback(drafts);
				},
				error: function (err) {
					callback(null);
				}
			});
		},

		loadPurDealerDraft: function (dealer, orderData, callback) {
			var that = this;
			var lv_orderData = orderData;
			var bModel = this.getPurchaseOrderModel();
			var oFilter = new Array();
			var dealerCode = dealer;

			oFilter[0] = new sap.ui.model.Filter("DealerCode", sap.ui.model.FilterOperator.EQ, dealerCode);
			oFilter[1] = new sap.ui.model.Filter("DealerOrderNo", sap.ui.model.FilterOperator.EQ, orderData.tciOrderNumber);

			bModel.read('/Draft_POHeaderSet', {
				urlParameters: {
					//     		 			"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime,to_PurchaseOrderItemTP",
					"$orderby": "DealerCode,DealerOrderNo,CreatedOn",
					"$expand": "headerToItemDraft"
				},
				filters: oFilter,
				success: function (oData, oResponse) {

					var messageList = that._extractSapMessage(oResponse);

					if (!!oData && !!oData.results) {

						var lv_aResult = null;
						var lv_aResultItem = null;
						var aDraftItem = null;
						var aDraftHeader = null;
						var messageItem = null;
						var createontime = null;

						for (var x = 0; x < oData.results.length; x++) {
							lv_aResult = oData.results[x];
							createontime = that.s2date(lv_aResult.CreatedOn);
							// The main document
							// the first creation time 
							if (!!lv_orderData.createDate) {
								if (lv_orderData.createDate > createontime) {
									lv_orderData.createDate = createontime;
								}
							} else {
								lv_orderData.createDate = createontime;
							}

							// the last last modification date/time
							if (!!lv_orderData.modifiedOn) {
								if (lv_orderData.modifiedOn < createontime) {
									lv_orderData.modifiedOn = createontime;
								}
							} else {
								lv_orderData.modifiedOn = createontime;
							}

							// add the header to the document cache
							aDraftHeader = {};
							aDraftHeader.PurchasingOrganization = lv_aResult.Purch_Org;
							aDraftHeader.PurchasingGroup = lv_aResult.Pur_Group;
							aDraftHeader.Supplier = lv_aResult.Vendor;
							aDraftHeader.OrderType = lv_aResult.Doc_Type;
							aDraftHeader.DraftUUID = lv_aResult.HeaderDraftUUID;
							aDraftHeader.Lines = 0;

							// process item level 
							if (!!lv_aResult.headerToItemDraft && !!lv_aResult.headerToItemDraft.results) {
								aDraftHeader.Lines = lv_aResult.headerToItemDraft.results.length;
								for (var i = 0; i < lv_aResult.headerToItemDraft.results.length; i++) {
									lv_aResultItem = lv_aResult.headerToItemDraft.results[i];

									aDraftItem = {};
									aDraftItem.line = i + 1;
									aDraftItem.Po_Item = lv_aResultItem.Po_Item;
									aDraftItem.partNumber = lv_aResultItem.Material;

									//aDraftItem.partDesc =lv_aResultItem.PurchaseOrderItemText;
									aDraftItem.qty = lv_aResultItem.Quantity;

									aDraftItem.comment = lv_aResultItem.Comments;
									aDraftItem.plant = lv_aResultItem.Plant;
									aDraftItem.storage_Loc = lv_aResultItem.Stge_Loc;
									aDraftItem.uuid = lv_aResultItem.ItemDraftUUID;
									aDraftItem.parentUuid = lv_aResultItem.HeaderDraftUUID;
									aDraftItem.partDesc = lv_aResultItem.MatDesc;
									aDraftItem.ItemStatus = "Draft";
									that.getSPQForDraftItem(aDraftItem, orderData);
									// aDraftItem.supplier = lv_aResultItem.Supplier;
									// aDraftItem.purInfoRecord = lv_aResultItem.PurchasingInfoRecord;
									//aDraftItem.spq = lv_aResultItem:'',

									// messages - item level messages
									if (!!aDraftItem && !!aDraftItem.messages) {
										aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
									} else {
										aDraftItem.messages = [];
										aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
									}
									aDraftItem.messageLevel = that.getMessageLevel(aDraftItem.messages);
									lv_orderData.items.push(aDraftItem);
								}
							}
							lv_orderData.associatedDrafts.push(aDraftHeader);
						}
					}

					lv_orderData.totalLines = lv_orderData.items.length;
					callback(lv_orderData);
				},
				error: function (err) {
					lv_orderData.totalLines = lv_orderData.items.length;
					callback(lv_orderData);
				}
			});
		},

		getSPQForDraftItem: function (aDraftItem, oOrderModel) {
			var that = this;
			var orderTypeId = oOrderModel.orderTypeId;
			DataManager.getPartDescSPQForPart(aDraftItem.partNumber, aDraftItem, function (item1Data, oItem) {
				if (!!item1Data) {
					oItem["Status"] = "Success";
					oItem["StatusText"] = "";
					oItem["hasError"] = false;
					oItem["itemCategoryGroup"] = item1Data[0].categoryGroup;
					oItem["division"] = item1Data[0].Division;
					//oItem["partDesc"] = item1Data[0].MaterialDescription;
					//oItem["sloc"] = oOrderModel.getProperty("/sloc");
					//Valid for UB Only-will be updated for ZLOC
					//oItem["revPlant"] = oOrderModel.getProperty("/revPlant");
					//Valid for UB Only-will be updated for ZLOC
					oItem["companyCode"] = "2014";
					oItem["spq"] = item1Data[0].SPQ;
					oItem["selected"] = false;
					oItem["OrderType"] = that.getRealOrderTypeByItemCategoryGroup(item1Data[0].categoryGroup, that.bIsSalesOrder, orderTypeId);
					/*if (oItem["orderType"] === 'ZLOC') {
 							that.getSupplierForPart(oItem["partNum"], stoSupplyingPlant, function (data) {
 								if (!!data && !!data[0]) {*/
					//oItem["supplier"] = data[0].VendorAccountNumber;
					//oItem["supplier"] = item1Data[0].VendorAccountNumber;
					//oItem["sloc"] = data.SLoc;
					oItem["revPlant"] = item1Data[0].Plant;
					//oModel.setProperty("/itemCategoryGroup", item1Data[0].categoryGroup);

				} else {
					oItem["Status"] = "Error";
					oItem["StatusText"] = "Incorrect Data";
					oItem["hasError"] = true;
					oItem["itemCategoryGroup"] = "";
					//oItem["division"] = "";
					//oItem["partDesc"] = "";
					//oItem["supplier"] = "";
					//oItem["purInfoRecord"] = "";
					//oItem["companyCode"] = "";
					//oItem["currency"] = 'CAD';
					//oItem["netPriceAmount"] = "";
					//oItem["taxCode"] = "";
					oItem["spq"] = "";
				}
				//return oItem;
			});
		},

		// [uuid, line] as key 
		updateOrderDraftItem: function (keys, valueObj, callback) {
			var that = this;
			var bModel = this.getPurchaseOrderModel();
			var key = bModel.createKey('/Draft_POItemSet', {
				'HeaderDraftUUID': keys[1],
				'ItemDraftUUID': keys[0],
				'IsActiveEntity': false
			});

			bModel.update(key, valueObj, {
				success: function (oData, oResponse) {
					var messageList = that._extractSapItemMessages(oResponse);
					callback(oData, messageList);
				},
				error: function (oError) {
					callback(null);
				}
			});
		},

		_searchPurchaseOrder: function (exactMode, conditions, callback) {
			var bModel = this.getPurchaseOrderModel();
			var oFilter = new Array();
			var aFilter = null;
			var dealerCode = conditions.bpCode;

			oFilter[0] = new sap.ui.model.Filter("dealer_code", sap.ui.model.FilterOperator.EQ, dealerCode);
			if (!!exactMode) {
				if (!!conditions.tciOrderNumber) {
					oFilter.push(new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.EQ, conditions.tciOrderNumber.padStart(10,
						'0')));
				}
				if (!!conditions.deleveryNumber) {
					oFilter.push(new sap.ui.model.Filter("deliv_no", sap.ui.model.FilterOperator.EQ, conditions.deleveryNumber.padStart(10,
						'0')));
				}
				// if(!!conditions.fiNumber){
				// 	oFilter.push(new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.EQ, conditions.fiNumber ));		
				// }
			} else {
				oFilter[1] = new sap.ui.model.Filter("erdat", sap.ui.model.FilterOperator.BT, conditions.fromOrderDate, conditions.toOrderDate);
				if (!!conditions.partNumber) {
					aFilter = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, conditions.partNumber);
					oFilter.push(aFilter);
				}
				if (!!conditions.orderNumber) {
					aFilter = new sap.ui.model.Filter("dealer_orderNo", sap.ui.model.FilterOperator.EQ, conditions.orderNumber);
					oFilter.push(aFilter);
				}

				// order type has only one - standard order
				if (!!conditions.partsStates && conditions.partsStates.length > 0) {
					var partsSts = [];
					for (var x1 = 0; x1 < conditions.partsStates.length; x1++) {
						switch (conditions.partsStates[x1]) {
						case 'IP':
							partsSts.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'PR':
							partsSts.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'CL':
							partsSts.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'BK':
							partsSts.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.GT, '0'));
							break;
						case 'OpOR':
							partsSts.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.EQ, '0'));
							partsSts.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.EQ, '0'));
							// partsSts.push(new sap.ui.model.Filter("quant_ordered", sap.ui.model.FilterOperator.NE, '0'));
							break;
						}
					}
					aFilter = new sap.ui.model.Filter(partsSts, false);
					oFilter.push(aFilter);
				}
			}

			bModel.read('/find_poSet', {
				urlParameters: {
					//		"$select": "PurchaseOrder,CompanyCode,PurchasingOrganization,PurchasingGroup,Supplier,DocumentCurrency,PurchaseOrderStatus,PurchaseOrderNetAmount,PurchaseOrderType,CreationDate,ZZ1_DealerCode_PDH,ZZ1_AppSource_PDH,ZZ1_DealerOrderNum_PDH,CreatedByUser",
					"$expand": "POtoDeliv",
					"$orderby": "erdat"
				},
				filters: oFilter,
				success: function (oData, oResponse) {
					var orders = [];
					if (!!oData && !!oData.results) {
						callback(oData.results);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					callback(null);
				}
			});
		},

		// End of new Purchase Order

		// start of purchase order old 
		// for now, only the purchase order	
		activateDraftOrder: function (iData, callBack) {
			var that = this;
			var lv_hasError = false;
			var resourceBundle = this.getResourceBundle();

			var drafts = null;

			function isFinished() {
				var isFinished = true;
				if (!!drafts && drafts.length) {
					for (var i1 = 0; i1 < drafts.length; i1++) {
						if (!!!drafts[i1].pEnded) {
							isFinished = false;
							return isFinished;
						}
					}
				}
				return isFinished;
			}

			if (!!iData.associatedDrafts && iData.associatedDrafts.length > 0) {
				drafts = iData.associatedDrafts;
				for (var i0 = 0; i0 < drafts.length; i0++) {
					drafts[i0].pEnded = false;
					drafts[i0].hasError = false;
					drafts[i0].orderNumber = null;

					this.activateDraft(drafts[i0].DraftUUID, i0, iData.isSalesOrder, function (orderNumber, index, messages) {
						drafts[index].pEnded = true;
						if (!!orderNumber) {
							drafts[index].orderNumber = orderNumber;
						} else {
							lv_hasError = true;
							drafts[index].hasError = true;
						}
						drafts[index].messages = messages;

						if (isFinished()) {
							callBack(iData, lv_hasError);
						}
					});
				}
			}
		},

		validateDraftOrder: function (iData, callBack) {
			var that = this;
			var lv_hasError = false;
			var resourceBundle = this.getResourceBundle();

			var drafts = null;

			function isFinished() {
				var isFinished = true;
				if (!!drafts && drafts.length) {
					for (var i1 = 0; i1 < drafts.length; i1++) {
						if (!!!drafts[i1].pEnded) {
							isFinished = false;
							return isFinished;
						}
					}
				}
				return isFinished;
			}

			if (!!iData.associatedDrafts && iData.associatedDrafts.length > 0) {
				drafts = iData.associatedDrafts;
				for (var i0 = 0; i0 < drafts.length; i0++) {
					drafts[i0].pEnded = false;
					drafts[i0].hasError = false;
					drafts[i0].messages = null;
					that.validateDraft(drafts[i0].DraftUUID, i0, function (hasError, index, messages) {
						drafts[index].pEnded = true;
						drafts[index].hasError = hasError;
						if (!!hasError) {
							lv_hasError = true;
						} else {
							if (drafts[index].Lines < 1) {
								lv_hasError = true;
								if (!!!messages) {
									messages = [];
								}
								messages.push({
									code: 'F001',
									message: resourceBundle.getText('Message.Failed.EmptyLine.Draft', [drafts[index].DraftUUID]),
									severity: 'error'
								});
							}
						}

						drafts[index].messages = messages;
						if (isFinished()) {
							callBack(iData, lv_hasError);
						}
					});
				}
			}
		},

		validateDraft: function (uuid, index, callBack) {
			var that = this;

			if (!!uuid) {
				var bModel = this.getPurV2Model();

				bModel.callFunction('/C_PurchaseOrderTPValidation', {
					method: "GET",
					urlParameters: {
						PurchaseOrder: '',
						DraftUUID: uuid,
						IsActiveEntity: false
					},
					success: function (oData, oResponse) {
						var messageList = that._extractSapItemMessages(oResponse);
						var hasError = that._hasError(messageList);
						//orderDraft.draftUuid = oData.DraftUUID;                         
						callBack(hasError, index, messageList);
					},
					error: function (oError) {
						//	var messageList = that._extractSapItemMessages(oResponse);
						var err = oError;
						callBack(true, index, null);
					}
				});
			}
		}

	});
});