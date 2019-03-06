sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast",
	"tci/wave2/ui/parts/ordering/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter"

], function (BaseController, MessagePopover, MessageItem, Link, JSONModel, MessageBox, Spreadsheet, MessageToast, formatter, Filter,
	FilterOperator, Sorter) {
	"use strict";
	var CONT_ORDER_MODEL = "orderModel";
	var CONT_INFOREC_MODEL = "infoRecordModel";
	var CONST_VIEW_MODEL = 'viewModel';
	var CONT_SIZE_MODEL = 'sizeModel';

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CreateOrderGrid", {

		formatter: formatter,

		onInit: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("CreateOrder").attachPatternMatched(this._onObjectMatched, this);

			// default mode
			var appStateModel = this.getStateModel();
			this.setModel(appStateModel);

			//message
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(oMessageManager.getMessageModel(), "message");
			// or just do it for the whole view
			oMessageManager.registerObject(this.getView(), true);

			//view model 
			var viewState = {
				filterPanelEnable: false,
				columnList: [],
				contHigh: "60%"
			};
			var viewModel = new JSONModel();
			viewModel.setData(viewState);
			this.setModel(viewModel, CONST_VIEW_MODEL);

			this.draftInd = this.byId('draftInd');
			this.itemTable = this.byId('idProductsTable');

			// make sure the dealer information is there
			this.checkDealerInfo();
		},

		_typeACrem: function () {
			return {
				remLine: "2rem",
				remPartno: "12rem",
				remPartDesc: "20rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remComments: "32rem"
			};
		},

		_typeBrem: function () {
			return {
				remLine: "2rem",
				remPartno: "12rem",
				remPartDesc: "20rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remContractNo: "8rem",
				remComments: "20rem"
			};
		},

		_typeDrem: function () {
			return {
				remLine: "2rem",
				remPartno: "12rem",
				remPartDesc: "18rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remCampaignNo: "10rem",
				remOpCode: "6rem",
				remVin: "6rem",
				remComments: "14rem"
			};
		},

		_onObjectMatched: function (oEvent) {
			// clear all the other message 
			var that = this;

			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (!this.checkDealerInfo()) {
				return;
			}

			var appStateModel = this.getStateModel();
			appStateModel.setProperty('/tabKey', 'CO');

			// load the model ... 
			var orderType = oEvent.getParameter("arguments").orderType;
			var orderNum = oEvent.getParameter("arguments").orderNum;

			//				var orderData = { typeB: false, typeD:false };
			var orderData = this.initLocalModels(orderType, orderNum.trim());
			var model = new sap.ui.model.json.JSONModel();
			if (orderData.items && orderData.items.length === 0) {
				//this.itemTable.unbindRows();
				this._resetValueStateOfRows();
				orderData.items.splice(0, 0, that._getNewItem());
			}
			model.setData(orderData);
			this.setModel(model, CONT_ORDER_MODEL);

			// start show busy
			sap.ui.core.BusyIndicator.show(0);
			var oJModel = new sap.ui.model.json.JSONModel();
			if (orderData.typeB) {
				oJModel.setData(this._typeBrem());
				this.setModel(oJModel, CONT_SIZE_MODEL);
			} else if (orderData.typeD) {
				oJModel.setData(this._typeDrem());
				this.setModel(oJModel, CONT_SIZE_MODEL);

			} else {
				oJModel.setData(this._typeACrem());
				this.setModel(oJModel, CONT_SIZE_MODEL);
			}
			var infoRecordModel = this.getProductModel();
			this.setModel(infoRecordModel, CONT_INFOREC_MODEL);
		

			//				get the company code for the default purcahse org
			this.getCompanyCodeByPurcahseOrg(orderData.purchaseOrg, function (companyCode) {
				model.setProperty('/companyCode', companyCode);
				//orderData.companyCode = companyCode;

			});

			this.getCustomerById(orderData.purBpCode, function (data) {
				// the default supplying plant for STO only 
				var aCustSaleArea = null;
				if (!!data && !!data.to_CustomerSalesArea && !!data.to_CustomerSalesArea.results && !!data.to_CustomerSalesArea.results.length >
					0) {
					for (var x1 = 0; x1 < data.to_CustomerSalesArea.results.length; x1++) {
						aCustSaleArea = data.to_CustomerSalesArea.results[x1];
						if ('7000' === aCustSaleArea.SalesOrganization) {
							break;
						} else {
							aCustSaleArea = null;
						}
					}
					if (!!!aCustSaleArea) { // fall back to first one 
						aCustSaleArea = data.to_CustomerSalesArea.results[0];
					}

					model.setProperty('/stoSupplyingPlant', aCustSaleArea.SupplyingPlant);
					model.setProperty('/SalesOrganization', aCustSaleArea.SalesOrganization);
					model.setProperty('/DistributionChannel', aCustSaleArea.DistributionChannel);
					model.setProperty('/Division', aCustSaleArea.Division);

					// hard code ---
					model.setProperty('/SalesOrganization', '7000');
					model.setProperty('/DistributionChannel', "10");
					if ('00' === aCustSaleArea.Division) {
						model.setProperty('/Division', "10");
					}

				}

			});

			this.getStorageInfo(orderData.purBpCode, function (data) {
				// populate the rest of field
				if (!!data && !!orderData.purBpCode) {
					model.setProperty('/sloc', data.SLoc);
					// 					orderData.sloc = data.SLoc;
					model.setProperty('/revPlant', data.Plant);
					//						orderData.revPlant = data.Plant;
				}
			});

			this.loadDealerDraft(orderData.dealerCode, orderData, function (rData) {
				for (var x = 0; x < rData.items.length; x++) {
					rData.items[x].messageLevel = that.getMessageLevel(rData.items[x].messages);
				}
				if (rData.items.length < 0) {
					rData.totalLines = rData.items.length - 1;
				} else {
					rData.totalLines = 0;
				}
				if (rData.dealerType === '04') { // campaign 
					rData.typeB = true;
				} else if (rData.orderTypeId === '3') {
					rData.typeD = true;
				}

				model.setData(rData);
				that.setModel(model, CONT_ORDER_MODEL);
				sap.ui.core.BusyIndicator.hide();
			});
		},

		onSort: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.COViewSettingsDialog", this);
				this.getView().addDependent(this._oDialog);
			}

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			var list = [];
			// var item = {} ;
			// item.code = 'SSSS';
			// item.name = 'SSSS1';

			// list.push(item);
			viewModel.setProperty("/columnList", list);

			this._oDialog.setModel(this.getView().getModel());
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},

		initLocalModels: function (orderType, orderNum) {
			// default mode
			var appStateModel = this.getStateModel();

			var orderData = {};
			// inital value 
			orderData.typeB = false;
			orderData.typeD = false;

			// if it is sale order, flag it, or it will be handled as purcahse order.		
			orderData.isSalesOrder = true;

			orderData.purBpCode = appStateModel.getProperty('/selectedBP/bpNumber');
			orderData.dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');

			orderData.dealerType = appStateModel.getProperty('/selectedBP/bpType');
			orderData.bpTypeGroup = appStateModel.getProperty('/selectedBP/bpGroup');

			orderData.isSalesOrder = this.isSalesOrderAssociated(orderData.bpTypeGroup);

			// main section for the order - will not affect by record in the system
			if (!!orderType && orderType === '-1' && orderData.isSalesOrder) { // load sale order from uuid
				// level it empty
				//orderData.orderTypeId =  orderType;
				orderData.DraftUUID = orderNum;
			} else {
				orderData.orderTypeId = orderType;
				orderData.orderTypeName = this.getOrderTypeName(orderData.orderTypeId);
				orderData.tciOrderNumber = orderNum;
			}

			if (orderData.dealerType === '04') { // campaign 
				orderData.typeB = true;
			} else if (orderData.orderTypeId === '3') {
				orderData.typeD = true;
			}

			//orderData.newline = [this._getNewLine()];

			orderData.createDate = new Date();
			orderData.modifiedOn = new Date();

			// maybe deleted
			orderData.submittedDate = null;
			orderData.statusCode = 'DF';
			orderData.documentCurrency = 'CAD';

			//default
			orderData.purchasingGroup = '150';
			orderData.purchaseOrg = '7019';

			orderData.associatedDrafts = [];
			orderData.items = [];

			// calculated filed
			orderData.totalLines = 0;
			return orderData;
		},

		_getNewLine: function () {
			return {
				hasError: false,
				selected: false,
				line: '',
				partNumber: '',
				partDesc: "",
				spq: '',
				qty: 0,
				fillBo: 0,
				comment: "",
				companyCode: "",
				purcahseOrg: "",
				itemCategoryGroup: ''
			};
		},

		_getNewItem: function () {
			return {
				line: 0,
				hasError: false,
				selected: false,
				partNumber: '',
				partDesc: "",
				spq: '',
				qty: 0,
				fillBo: 0,
				comment: "",
				companyCode: "",
				purcahseOrg: "",
				itemCategoryGroup: '',
				addIcon: true,
				minusIcon: false
			};
		},

		handleContractNumChange: function (oEvent) {
			var that = this;
			var sValue = oEvent.getParameter("newValue");
			var model = this.getModel(CONT_ORDER_MODEL);
			//var newline = model.getProperty('/newline');
			var newItem = model.items[0];
			var bpCode = model.getProperty('/purBpCode');
			var resourceBundle = this.getResourceBundle();
			this.validateContractNumber(bpCode, sValue, newItem.partNumber, function (data, isOK, messages) {
				if (!!isOK && !!data) {
					newItem.contractLine = data.line_item;
					//model.setProperty('/newline', newline);
				} else {
					//TODO -- ERROR 
				}
			});

		},

		handlePartMessage: function (oEvent) {
			// create popover
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment(this.getView().getId() + "-rowRelated",
					"tci.wave2.ui.parts.ordering.view.fragments.RowPopover", this);
				this.getView().addDependent(this._oPopover);
			}
			var path = oEvent.getSource().getBindingContext('orderModel').getPath();
			//				var  = oEvent.getSource().getBindingContext('orderModel').get;

			this._oPopover.bindElement("orderModel>" + path);
			this._oPopover.openBy(oEvent.getSource());
		},

		showDraftItemInfo: function (oEvent) {
			var vModel = this.getModel(); // get the view model

			var root = vModel.getProperty('/appLinkes/PARTS_AVAILIBILITY');
			var lang = vModel.getProperty('/userProfile/language');
			var div = vModel.getProperty('/userProfile/division');

			var partsNumber = oEvent.getSource().getBindingContext('orderModel').getProperty('partNumber');

			var url = root + "index.html?partNumber=" + partsNumber + "&Division=" + div + "&Language=" + lang;
			var win = window.open(url, 'PartsAvailibility');
			win.focus();
		},

		showDraftItemInfoX: function (oEvent) {
			if (!this._oToolTipPopover) {
				this._oToolTipPopover = sap.ui.xmlfragment(this.getView().getId() + "-rowTooltip",
					"tci.wave2.ui.parts.ordering.view.fragments.TooltipPopover", this);
				this.getView().addDependent(this._oToolTipPopover);
			}
			var path = oEvent.getSource().getBindingContext('orderModel').getPath();

			this._oToolTipPopover.bindElement("orderModel>" + path);
			this._oToolTipPopover.openBy(oEvent.getSource());
		},

		handleSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sTerm));
			}
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
			//                   	oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		handleProductChange: function (oEvent) {
			var that = this;
			var sValue = oEvent.getParameter("newValue");
			var model = this.getModel(CONT_ORDER_MODEL);
			var newItem = model.getData().items[0];
			//var newline = model.getProperty('/newline');
			var resourceBundle = this.getResourceBundle();
			that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), function (item1Data) {
				if (!!item1Data) {
					newItem.hasError = false;
					newItem.itemCategoryGroup = item1Data.itemCategoryGroup;
					newItem.division = item1Data.division;
					newItem.partDesc = item1Data.partDesc;
					newItem.supplier = item1Data.supplier;
					newItem.purInfoRecord = item1Data.purInfoRecord;
					newItem.companyCode = item1Data.companyCode;
					newItem.currency = item1Data.currency;
					newItem.netPriceAmount = item1Data.netPriceAmount;
					newItem.taxCode = item1Data.taxCode;
					newItem.spq = item1Data.spq;
					newItem.addIcon = true;
					newItem.minusIcon = false;
				} else {
					newItem.hasError = true;
					newItem.itemCategoryGroup = "";
					newItem.division = "";
					newItem.partDesc = "";
					newItem.supplier = "";
					newItem.purInfoRecord = "";
					newItem.companyCode = "";
					newItem.currency = 'CAD';
					newItem.netPriceAmount = "";
					newItem.taxCode = "";
					newItem.spq = "";
					newItem.addIcon = true;
					newItem.minusIcon = false;
					var failedtext = resourceBundle.getText('Message.Failed.Load.Part', [sValue]);
					MessageBox.error(failedtext, {
						onClose: function (sAction) {
							sap.ui.core.BusyIndicator.hide();
						}
					});

				}
				//model.getData().items[0] = newItem;
				model.refresh(true);
				//model.setProperty('/newline', newline);
			});

		},

		handleProductChangeX: function (oEvent) {
			var that = this;
			var sValue = oEvent.getParameter("newValue");
			var model = this.getModel(CONT_ORDER_MODEL);
			//var newline = model.getProperty('/newline');
			var newItem = model.items[0];

			// step A1
			that.getPartsInfoById(sValue, function (item1Data) {
				if (!!item1Data) {
					newItem.itemCategoryGroup = item1Data.ItemCategoryGroup;
					if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length > 0) {
						for (var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++) {
							// rounding profile  -- get the first one then			            	
							that.getRoundingprofileOFVendor(sValue,
								item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
								item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl,
								function (item2Data) {
									if (!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile) {
										newItem.spq = item2Data.Item.Roundingprofile;
										//model.setProperty('/newline', newline);
									}
								});
						}
					}
				}
			});

			this.getZMaterialById(sValue, function (data) {
				if (!!data) {
					newItem.division = data.Division;
					newItem.partDesc = data.MaterialName;
					//model.setProperty('/newline', newline);

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
						newItem.supplier = lv_supplier;
						newItem.purInfoRecord = lvPurchasingInfoRecord;
						//model.setProperty('/newline', newline);

						// get the company code 
						//   				that.getCompanyCodeByVendor(lv_supplier, function(o1Data){
						//   					if (!!o1Data && !!o1Data.to_CustomerCompany &&!!lv_supplier){
						//   						newline[0].companyCode =o1Data.to_CustomerCompany.CompanyCode;
						// model.setProperty('/newline',newline);
						//   					} 
						//   				});

						//   				// don' need this step as we have infoRecord 
						//   				that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord, 
						//   												"7019",
						//   												model.getProperty('/revPlant'),
						//   					function(cData){
						//   					if (!!cData && !!lvPurchasingInfoRecord){
						//   						newline[0].currency =cData.Currency;
						//   						newline[0].netPriceAmount = cData.NetPriceAmount;
						//   						newline[0].taxCode = cData.TaxCode;
						// model.setProperty('/newline',newline);
						//   					} 
						//   				});
					}
				}
			});
		},

		handleAddPart: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);
			var iData = model.getData();
			var resourceBundle = this.getResourceBundle();
			var failedtext = null;
			if (iData.items[0].hasError) {
				failedtext = resourceBundle.getText('Message.Failed.Load.Part', [iData.items[0].partNumber]);
				MessageBox.error(failedtext, {
					onClose: function (sAction) {}
				});
				return false;
			}

			// TODO-- check the values, warning message..
			failedtext = resourceBundle.getText('Message.Failed.Add.Part');
			sap.ui.core.BusyIndicator.show(0);
			this.draftInd.showDraftSaving();
			this.createOrderDraft(iData, function (rData, isOk) {
				if (isOk) {
					// this step, all good, move the new line to to items
					iData.items[0].line = rData.totalLines + 1;
					iData.items[0].addIcon = false;
					iData.items[0].minusIcon = true;
					rData.items.splice(rData.items.length, 0, JSON.parse(JSON.stringify(iData.items[0])));
					rData.items.splice(0, 1);
					rData.items.splice(0, 0, that._getNewItem());
					//rData.newline = [that._getNewLine()];
					rData.totalLines = rData.items.length - 1;
					// ---to save some newwork traffic
					rData.modifiedOn = new Date();
					model.setData(rData);
					that.draftInd.showDraftSaved();
				} else {
					MessageBox.error(failedtext, {
						onClose: function (sAction) {
							//TODO??
						}
					});
				}
				sap.ui.core.BusyIndicator.hide();
			});
		},

		toggleSelect: function (oEvent) {
			var that = this;
			var isSelected = oEvent.getParameters("Selected").selected;
			var model = this.getModel(CONT_ORDER_MODEL);
			var data = model.getData();
			for (var i = 0; i < data.items.length; i++) {
				data.items[i].selected = isSelected;
			}
			model.setData(data);
		},

		toggleRowSelect: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = model.getProperty(path);
			var isSelected = oEvent.getParameters("Selected").selected;
			var row = oEvent.getSource().getParent();
			var table = oEvent.getSource().getParent().getTable();
			if (isSelected) {
				table.setSelectedItem(row, true);
			} else {
				table.setSelectedItem(row, false);
			}
		},

		onDelete: function (oEvent) {
			var that = this;
			var orderModel = this.getModel(CONT_ORDER_MODEL);
			var orderData = orderModel.getData();
			var isSalesOrder = orderModel.getProperty('/isSalesOrder');
			// prepare the to do list
			var todoList = [];
			if (!!orderData.associatedDrafts && orderData.associatedDrafts.length > 0) {
				for (var y = 0; y < orderData.associatedDrafts.length; y++) {
					todoList.push(orderData.associatedDrafts[y].DraftUUID);
				}
			}

			var processedList = [];
			var failedList = [];
			var successList = [];

			var resourceBundle = this.getResourceBundle();
			var confirmtext = resourceBundle.getText('Message.Comfirm.Delete.Order', [orderData.orderTypeName, orderData.tciOrderNumber]);
			var successtext = resourceBundle.getText('Message.Success.Delete.Order', [orderData.orderTypeName, orderData.tciOrderNumber]);
			var failedtext = resourceBundle.getText('Message.Failed.Delete.Order', [orderData.orderTypeName, orderData.tciOrderNumber]);

			MessageBox.confirm(confirmtext, {
				onClose: function (sAction) {
					if (sap.m.MessageBox.Action.OK === sAction) {
						if (!!todoList && !!todoList.length && todoList.length > 0) {
							sap.ui.core.BusyIndicator.show(0);
							for (var i = 0; i < todoList.length; i++) {
								that.deleteDraft(todoList[i], isSalesOrder, function (uuid, status) {
									if (status) {
										processedList.push(uuid);
										successList.push(uuid);
									} else {
										processedList.push(uuid);
										failedList.push(uuid);
									}

									// all the draft deleted 
									if (todoList.length <= processedList.length) {
										if (failedList.length > 0) {
											MessageBox.error(failedtext, {
												onClose: function (sAction) {
													sap.ui.core.BusyIndicator.hide();

												}
											});
										} else {
											//we are Ok, then move to add order
											MessageBox.success(successtext, {
												onClose: function (sAction) {
													sap.ui.core.BusyIndicator.hide();
													that.removeAllMessages();
													that.getRouter().navTo("StartOrdering", null, false);
												}
											});
										}
									}
								});
							}
						}
					}
				}
			});
		},

		onActivate: function (oEvent) {
			if (this._validateTableInput() === false) {
				var that = this;
				var model = this.getModel(CONT_ORDER_MODEL);

				// start show busy
				sap.ui.core.BusyIndicator.show(0);
				//var newLineItems = model.getData().newline;
				var items = model.getData().items;
				that.activateDraftOrder(model.getData(), function (rxData, hasError) {
					sap.ui.core.BusyIndicator.hide();
					that._showActivationResult(rxData, model.isSalesOrder, hasError);
				});

				// // start show busy
				// sap.ui.core.BusyIndicator.show(0);		
				//     		this.validateDraftOrder(model.getData(), function(rData, hasError){
				//     			if (hasError){
				// 		sap.ui.core.BusyIndicator.hide();        				
				//     				that._showValidationFailed(rData);
				//     			} else {
				//     				that.activateDraftOrder(rData, function(rxData, hasError){
				// 			sap.ui.core.BusyIndicator.hide();        				
				// 			that._showActivationResult(rxData, hasError);
				// 		});
				//     				// error free 
				//     			}
				// if (!!rData ){
				// 	var lv_data = rData;
				// 	var orderNNumber = lv_data.PurchaseOrder;
				// 	var messsage = "Order " + orderNNumber + "created";
				// 	// that._showActivationOk(messsage);
				// }
				// });
			} else {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error(
					"Please fill all the required values", {
						styleClass: bCompact ? "sapUiSizeCompact" : ""
					}
				);

			}
		},

		_showActivationResult: function (rData, isSalesOrder, hasError) {
			var that = this;
			var resourceBundle = this.getResourceBundle();
			var lv_messageArrary = [];
			var lv_draftUuid = null;
			var lv_messages = null;
			var lv_orderNumber = null;
			var lv_aDraft = null;
			var lv_tciOrderNumber = rData.tciOrderNumber;
			if (!!rData && !!rData.associatedDrafts) {
				for (var x = 0; x < rData.associatedDrafts.length; x++) {
					lv_aDraft = rData.associatedDrafts[x];
					lv_messages = lv_aDraft.messages;
					lv_draftUuid = lv_aDraft.DraftUUID;
					lv_orderNumber = lv_aDraft.orderNumber;
					if (lv_aDraft.hasError) {
						lv_messageArrary.push(resourceBundle.getText('Message.Failed.Activate.Draft', [lv_draftUuid]));
						if (!!lv_messages && lv_messages.length > 0) {
							for (var y = 0; y < lv_messages.length; y++) {
								lv_messageArrary.push(lv_messages[y].code + " : " + lv_messages[y].message);
							}
						}
					} else {
						if (!!isSalesOrder) {
							lv_messageArrary.push(resourceBundle.getText('Message.Success.Activate.Draft.Sales', [lv_draftUuid, lv_orderNumber,
								lv_tciOrderNumber
							]));
						} else {
							lv_messageArrary.push(resourceBundle.getText('Message.Success.Activate.Draft', [lv_draftUuid, lv_orderNumber, lv_tciOrderNumber]));
						}

					}
				}
			}
			var failedtext = resourceBundle.getText('Message.Failed.Activation.Draft');
			if (hasError) {
				MessageBox.error(failedtext, {
					details: lv_messageArrary.join("<br/>"),
					styleClass: that.getOwnerComponent().getContentDensityClass(),
					onClose: function (sAction) {}
				});
			} else {
				that._showActivationOk(lv_messageArrary.join('<br/>'));
			}

		},

		_showValidationFailed: function (rData) {
			var resourceBundle = this.getResourceBundle();
			var failedtext = resourceBundle.getText('Message.Failed.Validate.Draft');
			var drafts = rData.associatedDrafts;
			var messageArrary = [];
			var draftUuid = null;
			var lv_messages = null;
			var lv_tciOrderNumber = rData.tciOrderNumber;
			if (!!drafts) {
				for (var x = 0; x < drafts.length; x++) {
					lv_messages = drafts[x].messages;
					draftUuid = drafts[x].DraftUUID;
					if (!!lv_messages && lv_messages.length > 0) {
						for (var y = 0; y < lv_messages.length; y++) {
							if (!!lv_messages[y]) {
								messageArrary.push(resourceBundle.getText('Message.Failed.Message.Draft', [draftUuid, lv_messages[y].code, lv_messages[y].message]));
							} else {
								messageArrary.push(resourceBundle.getText('Message.Failed.Communication.Draft', [draftUuid]));
							}
						}
					}
				}
			}

			MessageBox.error(failedtext, {
				details: messageArrary.join("<br/>"),
				styleClass: this.getOwnerComponent().getContentDensityClass(),
				onClose: function (sAction) {}
			});
		},

		_showActivationOk: function (sDetails) {
			var that = this;
			MessageBox.success(
				sDetails, {
					id: "okMessageBox",
					//						details : sDetails,
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						that.getRouter().navTo("StartOrdering", null, false);
					}.bind(this)
				}
			);
		},

		onQtyChange: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = model.getProperty(path);
			var newValue = oEvent.getParameter("newValue");
			var isSalesOrder = model.getProperty('/isSalesOrder');
			this.draftInd.showDraftSaving();

			if (!!isSalesOrder) {
				//sales order 
				this.updateSalesDraftItem([obj.uuid, obj.parentUuid], {
					'TargetQty': newValue.toString()
				}, function (data, messageList) {
					obj.messages = messageList;
					obj.colorCode = that.getMessageColor(messageList);
					obj.iconUrl = 'sap-icon://e-care';
					obj.messageLevel = that.getMessageLevel(messageList);
					model.setProperty(path, obj);
					that.draftInd.showDraftSaved();
				});

			} else {
				// thr purchase order
				this.updateOrderDraftItem([obj.uuid, obj.parentUuid, obj.line], {
					'Quantity': newValue
				}, function (data, messageList) {
					obj.messages = messageList;
					obj.colorCode = that.getMessageColor(messageList);
					obj.iconUrl = 'sap-icon://e-care';
					obj.messageLevel = that.getMessageLevel(messageList);
					model.setProperty(path, obj);
					that.draftInd.showDraftSaved();
				});
			}

		},

		onCommentChange: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = model.getProperty(path);
			var newValue = oEvent.getParameter("newValue");
			var isSalesOrder = model.getProperty('/isSalesOrder');
			this.draftInd.showDraftSaving();
			if (!!isSalesOrder) {
				//sales order 
				this.updateSalesDraftItem([obj.uuid, obj.parentUuid], {
					'Comments': newValue
				}, function (data, messageList) {
					obj.messages = messageList;
					obj.colorCode = that.getMessageColor(messageList);
					obj.iconUrl = 'sap-icon://e-care';
					obj.messageLevel = that.getMessageLevel(messageList);
					model.setProperty(path, obj);
					that.draftInd.showDraftSaved();
				});

			} else {
				// thr purchase order
				this.updateOrderDraftItem([obj.uuid, obj.parentUuid, obj.line], {
					'Comments': newValue
				}, function (data, messageList) {
					obj.messages = messageList;
					obj.colorCode = that.getMessageColor(messageList);
					obj.iconUrl = 'sap-icon://e-care';
					obj.messageLevel = that.getMessageLevel(messageList);
					model.setProperty(path, obj);
					that.draftInd.showDraftSaved();
				});
			}

		},

		handleDeletePart: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);

			var todoList = [];
			var deletedList = {};
			deletedList.count = 0;
			var failedList = {};
			failedList.count = 0;

			var rData = model.getData();
			var items = rData.items;
			var newItems = [];
			var isSalesOrder = model.getProperty('/isSalesOrder');

			if (!!items && items.length > 0) {

				//sap.ui.core.BusyIndicator.show(0);				
				this.draftInd.showDraftSaving();
				for (var i = 0; i < items.length; i++) {
					if (items[i].selected) {
						todoList.push(items[i].uuid);
						this.deleteOrderDraftItem([items[i].uuid, items[i].line, items[i].parentUuid], isSalesOrder, function (keys, isOk, messages) {
							// only failed record will be returning message. message of good one will be ignored
							if (isOk) {
								deletedList[keys[0]] = keys;
								deletedList.count = deletedList.count + 1;

							} else {
								failedList[keys[0]] = messages;
								failedList.count = failedList.count + 1;
							}

							if (todoList.length <= (deletedList.count + failedList.count)) {
								// create new items 
								for (var y = 0; y < items.length; y++) {
									if (!!deletedList[items[y].uuid]) {
										// n	
									} else {
										newItems.push(items[y]);
									}
								}
								for (var z = 0; z < newItems.length; z++) {
									if (!!failedList[newItems[z].uuid]) {
										newItems[z].messages = newItems[z].messages.concat(newItems[z].messages);
									}
								}
								rData.items = newItems;
								rData.totalLines = rData.items.length;
								// ---to save some newwork traffic
								rData.modifiedOn = new Date();
								model.setData(rData);
								that.draftInd.showDraftSaved();
							}
						});
					}
				}
			}
		},

		onExport: function (oEvent) {
			var aColumns = [];
			aColumns.push({
				label: "Name",
				property: "name"
			});

			var mDataSource = [{
				'name': 'aa'
			}];
			var mSettings = {
				workbook: {
					columns: aColumns,
					context: {
						application: 'Debug Test Application',
						version: '1.54',
						title: 'Some random title',
						modifiedBy: 'John Doe',
						metaSheetName: 'Custom metadata'
					},
					hierarchyLevel: 'level'
				},
				dataSource: mDataSource,
				fileName: "salary.xlsx"
			};

			new Spreadsheet(mSettings)
				.build()
				.then(function () {
					MessageToast.show("Spreadsheet export has finished");
				});
		},
		onBack: function (oEvent) {
			var that = this;
			this.draftInd.clearDraftState();
			that.getRouter().navTo("FindOrder", null, false);
		},

		_validateInput: function (oInput) {
			var oBinding = oInput.getBinding("value");
			var sValueState = "None";
			var bValidationError = false;

			try {
				oBinding.getType().validateValue(oInput.getValue());
			} catch (oException) {
				sValueState = "Error";
				bValidationError = true;
			}

			oInput.setValueState(sValueState);

			return bValidationError;
		},

		_validateTableInput: function (oEvent) {
			var rows = this.itemTable.getRows();
			var columns = this.itemTable.getColumns();
			var model = this.getModel("orderModel");
			var items = model.getData().items;
			var len = model.getData().items.length;
			var typeB = model.getData().typeB;
			var typeD = model.getData().typeD;
			var bSubmitError = false;
			for (var x1 = 1; x1 < len; x1++) {
				var rowCells = rows[x1].getCells();
				var cellsLen = rowCells.length;
				//var bError = false;
				//for (var y1 = 0; y1 < cellsLen; y1++) {
				// PartNo
				if (!!rowCells[1].getProperty("required")) {
					if (rowCells[1].getValue() && rowCells[1].getValue().trim() === "") {
						bSubmitError = true;
						rowCells[1].setValueStateText("Invalid Value");
						rowCells[1].setValueState("Error");
						items[x1].hasError = true;
					} else {
						bSubmitError = false;
						rowCells[1].setValueStateText("");
						rowCells[1].setValueState("None");
						items[x1].hasError = false;
					}
				}
				//Qty
				if (!!rowCells[4].getProperty("required")) {
					if (rowCells[4].getValue() === "" || rowCells[4].getValue() < 1) {
						bSubmitError = true;
						//rowCells[1].setValueStateText("Invalid Value");
						rowCells[4].setValueState("Error");
						items[x1].hasError = true;
					} else {
						bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[4].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Campaign No or Contract No 
				if ((typeD || typeB) && !!rowCells[5].getProperty("required")) {
					if (rowCells[5].getValue() === "" || rowCells[5].getValue().trim() === "") {
						bSubmitError = true;
						rowCells[5].setValueStateText("Invalid Value");
						rowCells[5].setValueState("Error");
						items[x1].hasError = true;
					} else {
						bSubmitError = false;
						rowCells[5].setValueStateText("");
						rowCells[5].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Operation Code 
				if (typeD && !!rowCells[6].getProperty("required")) {
					if (rowCells[6].getValue() === "") {
						bSubmitError = true;
						rowCells[6].setValueStateText("Invalid Value");
						rowCells[6].setValueState("Error");
						items[x1].hasError = true;
					} else {
						bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[6].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Vin 
				if (typeD && !!rowCells[7].getProperty("required")) {
					if (rowCells[7].getValue() === "") {
						bSubmitError = true;
						rowCells[7].setValueStateText("Invalid Value");
						rowCells[7].setValueState("Error");
						items[x1].hasError = true;
					} else {
						bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[7].setValueState("None");
						items[x1].hasError = false;
					}
				}

				//}

			}
			//if 
			model.refresh(true);
			return bSubmitError;
			//var oTable = this.itemTable.
		},

		filterErrorStatus: function (oEvent) {
			var oColumn = oEvent.getParameter("column");
			if (oColumn != this.byId("ErrorStatus")) {
				return;
			}

			oEvent.preventDefault();

			//var sValue = oEvent.getParameter("value");
			var sValue = true;
			this._oFilter = new Filter("hasError", FilterOperator.EQ, sValue);
			this.itemTable.getBinding("rows").filter(this._oFilter, "Application");

			function clear() {

				oColumn.setFiltered(false);
				this.itemTable.getBinding("rows").filter(null, "Application");
			}

			//if (!isNaN(fValue)) {

		},

		clearMaterialSortings: function (oEvent) {
			this.itemTable.getBinding("rows").sort(null);
			var aColumns = this.itemTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},

		sortMaterial: function (oEvent) {
			var oCurrentColumn = oEvent.getParameter("column");
			var oMaterialColumn = this.byId("Material");
			if (oCurrentColumn != oMaterialColumn) {
				oMaterialColumn.setSorted(false); //No multi-column sorting
				return;
			}

			//oEvent.preventDefault();

			var sOrder = oEvent.getParameter("sortOrder");

			//this._resetSortingState(); //No multi-column sorting
			oMaterialColumn.setSorted(true);
			oMaterialColumn.setSortOrder(sOrder);

			/*	var oSorter = sap.ui.table.SortOrder(oMaterialColumn.getSortProperty(), sOrder === sap.ui.table.SortOrder.Descending);
				//The date data in the JSON model is string based. For a proper sorting the compare function needs to be customized.
				oSorter.fnCompare = function(a, b) {
					if (b == null) {
						return -1;
					}
					if (a == null) {
						return 1;
					}

					var aa = a;
					var bb = b;

					if (aa < bb) {
						return -1;
					}
					if (aa > bb) {
						return 1;
					}
					return 0;
				};*/
			this.itemTable.sort(oMaterialColumn, this._bSortColumnDescending ? sap.ui.table.SortOrder.Descending : sap.ui.table.SortOrder.Ascending, /*extend existing sorting*/
				true);
			this._bSortColumnDescending = !this._bSortColumnDescending;
			//this.itemTable.getBinding("rows").sort(oSorter);

		},

		_resetValueStateOfRows: function () {
			var rows = this.itemTable.getRows();
			var rowsLen = rows.length;
			for (var x1 = 1; x1 < rowsLen; x1++) {
				var rowCells = rows[x1].getCells();
				var cellsLen = rowCells.length;
				//var bError = false;
				for (var y1 = 0; y1 < cellsLen; y1++) {
					// PartNo
					//var cellMetaData = rowCells[y1].getMetadata();
					if (rowCells[y1].getMetadata()._sClassName === "sap.m.Input") {
						rowCells[y1].setValueState("None");
					}
				}
			}
		}

	});

});