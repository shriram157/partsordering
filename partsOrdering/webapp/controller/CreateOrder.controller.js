/* global XLSX:true */
sap.ui.define(["tci/wave2/ui/parts/ordering/controller/BaseController", 'sap/m/MessagePopover', 'sap/m/MessageItem', 'sap/m/Link',
	'sap/ui/model/json/JSONModel', "sap/m/MessageBox", "sap/ui/export/Spreadsheet", "sap/m/MessageToast",
	"tci/wave2/ui/parts/ordering/model/formatter", "tci/wave2/ui/parts/ordering/utils/ImportSalesOrder",
	"tci/wave2/ui/parts/ordering/utils/ImportPurchaseOrder", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter",
	"tci/wave2/ui/parts/ordering/utils/DataManager"
], function (BaseController, MessagePopover, MessageItem, Link, JSONModel, MessageBox, Spreadsheet, MessageToast, formatter,
	ImportSalesOrder, ImportPurchaseOrder, Filter, FilterOperator, Sorter, DataManager) {
	"use strict";
	var CONT_ORDER_MODEL = "orderModel";
	var CONT_INFOREC_MODEL = "infoRecordModel";
	var CONST_VIEW_MODEL = 'viewModel';
	var CONT_SIZE_MODEL = 'sizeModel';
	var CONST_IMPORT_ORDER_MODEL = 'importOrderModel';

	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CreateOrder", {

		formatter: formatter,
		ImportSalesOrder: ImportSalesOrder,
		ImportPurchaseOrder: ImportPurchaseOrder,
		DataManager: DataManager,

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
			this.oMaterialColumn = this.byId("Material");
			this.oCampaignColumn = this.byId("CampaignNo");
			this.oContractColumn = this.byId("ContractNo");
			this.oOperationCodeColumn = this.byId("OperationCode");
			this.oVinColumn = this.byId("Vin");

			this.btnFilterError = this.byId('btnFilterError');
			this.btnSortError = this.byId('btnSortError');
			this.btnClearFilterError = this.byId('btnClearFilterError');
			this.btnSubmit = this.byId("btnSubmit");
			this.btnDraft = this.byId("btnDraft");

			this.partDescModel = this.getZCMATERIALModel();

			this.sLang = this.getSapLangugaeFromLocal();

			this.oResourceBundle = this.getResourceBundle();
			this.OwnerComponent = this.getOwnerComponent();

			DataManager.init(BaseController, this.OwnerComponent, this.oResourceBundle, this.sLang);
			this.submitError = null;
			this.lineError = null;

			// make sure the dealer information is there
			//Commented For Debugging
			this.checkDealerInfo();
		},

		_typeACrem: function () {
			return {
				remLine: "2rem",
				remPartNo: "8rem",
				remPartDesc: "14rem",
				remSPQ: "5rem",
				remQty: "9rem",
				remComments: "25rem",
				remCommentsPx: "375px"
			};
		},

		_typeBrem: function () {
			return {
				remLine: "2rem",
				remPartNo: "22rem",
				remPartDesc: "14rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remContractNo: "8rem",
				remComments: "22rem",
				remCommentsPx: "340px"
			};
		},

		_typeDrem: function () {
			return {
				remLine: "2rem",
				remPartNo: "22rem",
				remPartDesc: "14rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remCampaignNo: "6rem",
				remOpCode: "7rem",
				remVin: "11rem",
				remComments: "18rem",
				remCommentsPx: "275px"
			};
		},

		_onObjectMatched: function (oEvent) {
			// clear all the other message 

			var that = this;
			this.submitError = null;
			this.lineError = null;
			sap.ui.getCore().getMessageManager().removeAllMessages();
			//Commented for debugging
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

			this._resetValueStateOfRows();

			model.setData(orderData);
			this.setModel(model, CONT_ORDER_MODEL);
			this.oOrderModel = this.getModel(CONT_ORDER_MODEL);

			this.bIsSalesOrder = this.oOrderModel.getProperty('/isSalesOrder');

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
					if (!!!aCustSaleArea) {
						// fall back to first one 
						aCustSaleArea = data.to_CustomerSalesArea.results[0];
					}

					model.setProperty('/stoSupplyingPlant', aCustSaleArea.SupplyingPlant);
					model.setProperty('/Division', aCustSaleArea.Division);

					// hard code ---
					model.setProperty('/SalesOrganization', '7000');
					model.setProperty('/DistributionChannel', "10");
					if ('00' === aCustSaleArea.Division) {
						model.setProperty('/Division', "10");
					}

					switch (data.Attribute1) {
					case "01":
						model.setProperty('/Attribute1', "10");
						break;
					case "02":
						model.setProperty('/Attribute1', "20");
						break;
					case "03":
						var division = model.getProperty("/Division");
						if (division === "10") {
							model.setProperty("/Attribute1", "10");
						} else if (division === "20") {
							model.setProperty("/Attribute1", "20");
						} else {
							model.setProperty("/Attribute1", "03");
						}
						break;
					case "04":
						var division = model.getProperty("/Division");
						if (division === "00") {
							model.setProperty("/Attribute1", "00");
						} else if (division === "10") {
							model.setProperty("/Attribute1", "10");
						} else {
							model.setProperty("/Attribute1", "04");
						}
						break;
					default:
						model.setProperty("/Attribute1", "");
						break;
					}

				}

				if (!!that._oImportTable) {
					that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL).setData({});
					that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL).refresh(true);
				}

			});
			//For UB
			this.getStorageInfo(orderData.Customer, function (data) {
				// populate the rest of field
				if (!!data && !!orderData.purBpCode) {
					model.setProperty('/sloc', data.SLoc);
					model.setProperty('/revPlant', data.Plant);
				}
			});
			DataManager.setOrderData(this.oOrderModel.getData());
			this.loadDealerDraft(orderData.dealerCode, orderData, function (rData) {
				for (var x = 0; x < rData.items.length; x++) {
					rData.items[x].messageLevel = that.getMessageLevel(rData.items[x].messages);
				}
				if (rData.items.length > 0) {
					that.btnSubmit.setVisible(true);
					that.btnDraft.setVisible(false);

					for (var i = 0; i < rData.items.length; i++) {
						rData.items[i].addIcon = false;
						rData.items[i].hasError = false;
					}
					rData.totalLines = rData.items.length;
				} else {
					rData.totalLines = 0;
					that.btnDraft.setVisible(true);
					that.btnSubmit.setVisible(false);
				}
				if (rData.dealerType === '04') {
					// campaign 
					rData.typeB = true;
				} else if (rData.orderTypeId === '3') {
					rData.typeD = true;
				}

				if (orderData.items.length === 0) {
					that.btnDraft.setVisible(true);
					that.btnSubmit.setVisible(false);
				}
				orderData.items.splice(0, 0, that._getNewItem());
				model.setData(rData);

				that.setModel(model, CONT_ORDER_MODEL);
				sap.ui.core.BusyIndicator.hide();
			});

			//Initialize Create & Update Items
			this.itemTable.getBinding("rows").getModel().refresh(true);

			this.aUpdateItems = [];
			this.aCreateItems = [];
			that.toggleSubmitDraftButton();

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

			//Added
			orderData.Customer = appStateModel.getProperty('/selectedBP/customer');

			orderData.isSalesOrder = this.isSalesOrderAssociated(orderData.bpTypeGroup);

			// main section for the order - will not affect by record in the system
			if (!!orderType && orderType === '-1' && orderData.isSalesOrder) {
				// load sale order from uuid
				// level it empty
				//orderData.orderTypeId =  orderType;
				orderData.DraftUUID = orderNum;
			} else {
				orderData.orderTypeId = orderType;
				orderData.orderTypeName = this.getOrderTypeName(orderData.orderTypeId);
				orderData.tciOrderNumber = orderNum;
			}

			if (orderData.dealerType === '04') {
				// campaign 
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

		_getNewItem: function () {
			return {
				line: 0,
				hasError: false,
				selected: false,
				partNumber: '',
				partDesc: "",
				spq: '',
				qty: '',
				fillBo: 0,
				comment: "",
				companyCode: "",
				purcahseOrg: "",
				itemCategoryGroup: '',
				sloc: '',
				revPlant: '',
				contractNum: '',
				addIcon: true

			};
		},

		showPartAvailabilityInfo: function (oEvent) {
			var vModel = this.getModel();
			// get the view model

			var root = vModel.getProperty('/appLinkes/PARTS_AVAILIBILITY');
			var lang = vModel.getProperty('/userProfile/language');
			var div = vModel.getProperty('/userProfile/division');

			var partsNumber = oEvent.getSource().getBindingContext('orderModel').getProperty('partNumber');

			var url = root + "index.html?partNumber=" + partsNumber + "&Division=" + div + "&Language=" + lang;
			var win = window.open(url, 'PartsAvailibility');
			win.focus();
		},

		handleSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sTerm));
			}
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
		},

		handleProductChange: function (oEvent) {
			var that = this;
			var sValue = oEvent.getParameter("newValue");
			var oVBox = oEvent.getSource().getParent();
			var oRow = oVBox.getParent();
			var iRowIndex = oRow.getIndex();
			var oItem = this.oOrderModel.getData().items[iRowIndex];
			var sAttribute1 = this.oOrderModel.getProperty("/Attribute1");
			that.itemTable.setBusy(true);
			DataManager.getPartDescSPQForPart(sValue, oItem, function (item1Data, oitem) {
				//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), function (item1Data) {
				if (!!item1Data && (item1Data[0].Division !== sAttribute1) && that.bIsSalesOrder) {
					var failedtext = that.oResourceBundle.getText('Message.Failed.Not.Valid.Dealer.Part', [sValue]);
					MessageBox.error(failedtext, {
						onClose: function (sAction) {
							that.itemTable.setBusy(false);
						}
					});
				} else if (!!item1Data && that.bIsSalesOrder) {
					oitem.hasError = false;
					oitem.itemCategoryGroup = item1Data[0].categoryGroup;
					oitem.division = item1Data[0].Division;
					oitem.partDesc = item1Data[0].MaterialDescription;
					oitem.supplier = item1Data[0].VendorAccountNumber;
					oitem.sloc = that.oOrderModel.getProperty("/sloc");
					oitem.revPlant = that.oOrderModel.getProperty("/revPlant");
					oitem.OrderType = that.getRealOrderTypeByItemCategoryGroup(oitem.itemCategoryGroup, that.bIsSalesOrder, that.oOrderModel.getProperty(
						"/orderTypeId"));
					oitem.companyCode = "2014";
					oitem.spq = item1Data[0].SPQ;
					oitem.ItemStatus = "Unsaved";
				} else if (!!item1Data && (!that.bIsSalesOrder) && (oitem.itemCategoryGroup !== "")) {
					oitem.hasError = false;
					oitem.itemCategoryGroup = item1Data[0].categoryGroup;
					oitem.division = item1Data[0].Division;
					oitem.partDesc = item1Data[0].MaterialDescription;
					oitem.supplier = item1Data[0].VendorAccountNumber;
					oitem.sloc = that.oOrderModel.getProperty("/sloc");
					oitem.revPlant = that.oOrderModel.getProperty("/revPlant");
					oitem.OrderType = that.getRealOrderTypeByItemCategoryGroup(oitem.itemCategoryGroup, that.bIsSalesOrder, that.oOrderModel.getProperty("/orderTypeId"));
					oitem.companyCode = "2014";
					oitem.spq = item1Data[0].SPQ;
					oitem.ItemStatus = "Unsaved";
				} else {
					oitem.hasError = "";
					oitem.itemCategoryGroup = "";
					oitem.division = "";
					oitem.partDesc = "";
					oitem.supplier = "";
					oitem.purInfoRecord = "";
					oitem.companyCode = "";
					oitem.currency = 'CAD';
					oitem.netPriceAmount = "";
					oitem.taxCode = "";
					oitem.spq = "";
					oitem.contractNum = "";
					oitem.partNumber = "";
					//oItem.addIcon = true;

					var failedtext = that.oResourceBundle.getText('Message.Failed.Load.Part', [sValue]);
					MessageBox.error(failedtext, {
						onClose: function (sAction) {
							that.itemTable.setBusy(false);
						}
					});
					if (iRowIndex === 0) {
						oitem.addIcon = true;
						oitem.hasError = false;
					} else {
						oitem.addIcon = false;
						oitem.hasError = oitem.hasError || false;
					}

				}
			});
			that.oOrderModel.refresh(true);
			that.itemTable.setBusy(false);
		},

		handleAddPart: function (oEvent) {
			var that = this;
			var oSource = oEvent.getSource() || null;
			var oOrderData = this.oOrderModel.getData();
			//this.itemTable.setBusy(true);
			if (oSource) {
				oSource.setEnabled(false);
				oSource.setBusy(true);
			}
			if (oOrderData.items[0].hasError || oOrderData.items[0].partNumber.toString().trim() === "") {
				if (oSource) {
					oSource.setEnabled(true);
					oSource.setBusy(false);
				}
				return;
			}
			var oItem = JSON.parse(JSON.stringify(oOrderData.items[0]));
			oItem.addIcon = false;
			oItem.hasError = false;
			var lv_orderType = oItem.OrderType;
			oOrderData.items[0] = oItem;
			oOrderData.items[0].line = oOrderData.totalLines + 1;
			oOrderData.items[0].addIcon = false;
			oOrderData.items[0].selected = false;
			oOrderData.items[0]["ItemStatus"] = "Unsaved";
			oOrderData.items.splice(oOrderData.items.length, 0, oOrderData.items[0]);
			this.aCreateItems.push(oOrderData.items[0]);
			this.toggleSubmitDraftButton();
			oOrderData.items.splice(0, 1);
			oOrderData.items.splice(0, 0, that._getNewItem());
			//rData.newline = [that._getNewLine()];
			oOrderData.totalLines = oOrderData.items.length - 1;
			// ---to save some newwork traffic
			oOrderData.modifiedOn = new Date();
			that.oOrderModel.setData(oOrderData);
			DataManager.setOrderData(oOrderData);
			if (oSource) {
				oSource.setEnabled(true);
				oSource.setBusy(false);
			}
		},

		onSaveDraft: function (oEvent) {
			var that = this;
			that.itemTable.setBusy(true);
			if (this.bIsSalesOrder) {
				DataManager.saveDraftSalesOrder(this.aCreateItems, this.aUpdateItems, function (oSalesItem, sOperation, IIndex, isOK,errorMessages) {
					var Index = oSalesItem.line;
					var oItem = that.oOrderModel.getData().items[Index];
					if (isOK) {
						if (sOperation === "Create") {
							oItem["uuid"] = oSalesItem.uuid;
							oItem["parentUuid"] = oSalesItem.parentUuid;
							oItem["ItmNumber"] = oSalesItem.ItmNumber;
							that.aCreateItems.splice(0, 1);
						} else { // it is update.
							that.aUpdateItems.splice(0, 1);
						}
						oItem.ItemStatus = "Draft";
						oItem.hasError = false;
						that.oOrderModel.getData().modifiedOn = new Date();
						that.oOrderModel.refresh(true);
					} // isOK end;
					oItem.selected = false;
					that._resetLineError(oSalesItem.line);
					if (!isOK) {
						oSalesItem.hasError = true;
						that._setLineError(oSalesItem.line, sOperation, errorMessages);
					}
					that.toggleSubmitDraftButton();
				});
			} else {
				DataManager.saveDraftPurchaseOrder(this.aCreateItems, this.aUpdateItems, function (oPurchaseItem, sOperation, IIndex, isOK,	errorMessages) {
					var Index = oPurchaseItem.line;
					var oItem = that.oOrderModel.getData().items[Index];
					if (isOK) {
						if (sOperation === "Create") {
							oItem["uuid"] = oPurchaseItem.uuid;
							oItem["parentUuid"] = oPurchaseItem.parentUuid;
							oItem["ItmNumber"] = oPurchaseItem.ItmNumber;
							for (var j = 0; j < that.aCreateItems.length; j++) {
								if (that.aCreateItems[j].line === Index) {
									that.aCreateItems.splice(j, 1);
									break;
								}
							}
						} else {
							for (var u = 0; u < that.aUpdateItems.length; u++) {
								if (that.UpdateItems[j].line === Index) {
									that.aUpdateItems.splice(j, 1);
									break;
								}
							}
						}
						oItem.ItemStatus = "Draft";
						oItem.hasError = false;
						that.oOrderModel.getData().modifiedOn = new Date();
						that.oOrderModel.refresh(true);
						that._resetLineError(oItem.line);
					}
					oItem.selected = false;
					if (!isOK) {
						oItem.hasError = true;
						//oItem["errorMessages"] = errorMessages;
						if (sOperation !== "Invalid") {
							that._setLineError(oItem.line, sOperation, errorMessages);
						} else {
							if (!that.lineError) {
								that.lineError = {};
							}
							that.lineError[oItem.line] = [];
							that.lineError[oItem.line]["error"] = that.oResourceBundle.getText("Message.error.invalid.part");
							that.itemTable.getBinding("rows").getModel().refresh(true);
							that.btnSortError.setVisible(true);
							that.btnFilterError.setVisible(true);
						}
					}
					that.toggleSubmitDraftButton();
				});
				this.toggleSubmitDraftButton();
			}
			that.itemTable.setBusy(false);
		},

		toggleSubmitDraftButton: function () {
			if (this.aCreateItems.length === 0 && this.aUpdateItems.length === 0) {
				this.btnSubmit.setVisible(true);
				this.btnDraft.setVisible(false);
			} else {
				this.btnSubmit.setVisible(false);
				this.btnDraft.setVisible(true);
			}

		},

		toggleSelect: function (oEvent) {
			var that = this;
			var isSelected = oEvent.getParameters("Selected").selected;
			var oRow = oEvent.getSource().getParent();
			var iRowIndex = oRow.getIndex();
			var data = this.oOrderModel.getData();
			data.items[iRowIndex].selected = isSelected;
		},

		toggleRowSelect: function (oEvent) {
			var that = this;
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = this.oOrderModel.getProperty(path);
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
			var orderModel = this.oOrderModel;
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

		_setLineError: function (iline, sOperation, messageList) {
			var that = this;
			if (messageList.length > 0) {
				if (!this.lineError) {
					this.lineError = {};
				};

				var otherError = "";
				for (var j = 0; j < messageList.length; j++) {
					if (messageList[j].msgType === "E") {
						//items[i].errorMessages = messageList[j].message;
						if (!that.lineError[iline]) {
							that.lineError[iline] = [];
						}

						that.lineError[iline]["error"] = messageList[j].message + "<br>";
						that.itemTable.getBinding("rows").getModel().refresh(true);
						
					} else {
						otherError = messageList[j].message + "<br>";
					}

				}
			}

			if (otherError.trim().length > 0) {
				MessageBox.error(otherError, {
					onClose: function (sAction) {
						sap.ui.core.BusyIndicator.hide();

					}
				});

			}
			that._showErrorSort(true);

		},

		_resetLineError: function (iline) {

		},

		onActivate: function (oEvent) {
			this._validateTableInput();
		},

		_activateFinal: function (bValidationError) {
			var that = this;
			var aOrderErrorMessages = [];
			if (bValidationError === false) {
				if (this.bIsSalesOrder) {
					DataManager.activateSalesDraftOrder(this.oOrderModel.getData(), function (oData, orderNumber, messageList) {
						sap.ui.core.BusyIndicator.hide();
						if ((!orderNumber) && (!!oData.results)) {
							orderNumber = oData.results[0].vbeln;
						}
						if (!orderNumber) {
							if (messageList.length > 0) {
								that.submitError = {};
								var items = that.oOrderModel.getData().items;
								for (var i = 1; i < items.length; i++) {
									//items[i]["errorMessages"] = "Error";
									//items[i].errorMessages.push("Error");
									var sError = "";
									for (var j = 0; j < messageList.length; j++) {
										if (messageList[j].msgType === "E") {
											if (items[i].partNumber === messageList[j].Material) {
												items[i].hasError = true;
												//items[i].errorMessages = messageList[j].message;
												if (!that.submitError[items[i].partNumber]) {
													that.submitError[items[i].partNumber] = [];

												}
												sError = messageList[j].message + "<br>";
												that.submitError[items[i].partNumber]["error"] = sError;
												that.itemTable.getBinding("rows").getModel().refresh(true);
												that.btnSortError.setVisible(true);
												that.btnFilterError.setVisible(true);
											} else {
												if (!aOrderErrorMessages.includes(messageList[j].message)) {
													aOrderErrorMessages.push(messageList[j].message);
												}
											}

										}
									}

								}
								// All other error messages 

							}
							if (aOrderErrorMessages.length > 0) {
								that._showValidationFailed(aOrderErrorMessages);
							}
							that._showErrorSort(true);
						} else {
							that.submitError = null;
							that._showErrorSort(false);
							that._showActivationResult(that.oOrderModel, that.bIsSalesOrder, orderNumber, false);

						}
						//that._showActivationResult(rxData, this.bSalesOrder, hasError);
					});
				} else {
					DataManager.activatePurchaseDraftOrder(function (oData, orderNumber, hasError, drafts) {
						that._showActivationResult(that.oOrderModel, false, orderNumber, hasError, drafts);
					});
				}
			}
		},

		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		},

		onError: function (oEvent) {
			var that = this;
			if (!!this.submitError || (!!this.lineError)) {
				if (!this._oPopover /*Not Null*/ ) {
					this._oPopover = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.LineErrorPopover", this);
					//this._oPopover.bindElement(that.submitError + "/421100C033");
					this.getView().addDependent(this._oPopover);
				}
				var obj = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getObject();
				var oModel = new JSONModel();
				if (this.lineError) {
					oModel.setData(that.lineError[obj.line].error);
				} else {
					oModel.setData(that.submitError[obj.partNumber].error);
				}
				this._oPopover.setModel(oModel);
				this._oPopover.getModel().refresh();
				this._oPopover.openBy(oEvent.getSource());
			}
		},

		handleCloseButton: function (oEvent) {
			this._oPopover.close();
		},

		_showActivationResult: function (oOrderModel, isSalesOrder, orderNumber, hasError, drafts) {
			var that = this;
			var resourceBundle = this.getResourceBundle();
			var lv_ErrorMessageArray = [];
			var lv_messageArray = [];
			var lv_draftUuid = null;
			var lv_messages = null;
			var lv_orderNumber = null;
			var lv_aDraft = null;
			var rData = oOrderModel.getData();
			var lv_tciOrderNumber = rData.tciOrderNumber;
			var bError = false;
			if (!!rData && !!rData.associatedDrafts) { //Only For Purchase.
				for (var x = 0; x < rData.associatedDrafts.length; x++) {
					lv_aDraft = rData.associatedDrafts[x];
					lv_messages = lv_aDraft.ActivationResults;
					lv_draftUuid = lv_aDraft.DraftUUID;
					lv_orderNumber = lv_aDraft.orderNumber;
					//lv_aDraft["hasError"] = false;
					if (lv_aDraft.hasError) {
						if (!lv_orderNumber) {
							if (lv_messages.length > 0) {
								that.submitError = {};
								var items = that.oOrderModel.getData().items;
								for (var i = 1; i < items.length; i++) {
									//items[i]["errorMessages"] = "Error";
									//items[i].errorMessages.push("Error");
									var sError = "";
									for (var j = 0; j < lv_messages.length; j++) {
										if (lv_messages[j].msgType === "E") {
											if (items[i].partNumber === lv_messages[j].Material) {
												items[i].hasError = true;
												//items[i].errorMessages = messageList[j].message;
												if (!that.submitError[items[i].partNumber]) {
													that.submitError[items[i].partNumber] = [];

												}
												sError = lv_messages[j].message + "<br>";
												that.submitError[items[i].partNumber]["error"] = sError;
												that.itemTable.getBinding("rows").getModel().refresh(true);
											} else {
												if (!lv_ErrorMessageArray.includes(lv_messages[j].message)) {
													lv_ErrorMessageArray.push(lv_messages[j].message);
												}
											}

										}
									}

								}
								// All other error messages 

							}
							lv_ErrorMessageArray.push(resourceBundle.getText('Message.Failed.Activate.Draft', [lv_draftUuid]));

						}
						bError = true;
					} else { //hasError - false
						if (!!isSalesOrder) {
							lv_messageArray.push(resourceBundle.getText('Message.Success.Activate.Draft.Sales', [lv_draftUuid, orderNumber,
								lv_tciOrderNumber
							]));
						} else {
							lv_orderNumber = lv_aDraft.orderNumber;
							lv_messageArray.push(resourceBundle.getText('Message.Success.Activate.Draft', [lv_draftUuid, lv_orderNumber,
								lv_tciOrderNumber
							]));
						}

					}
				}
				if (bError) { //rData.items.splice(0, 0, that._getNewItem());
				}
			}
			var failedtext = resourceBundle.getText('Message.Failed.Activation.Draft');
			if (lv_ErrorMessageArray.length > 0) {
				MessageBox.error(failedtext, {
					details: lv_ErrorMessageArray.join("<br/>"),
					styleClass: that.getOwnerComponent().getContentDensityClass(),
					onClose: function (sAction) {}
				});
			} /*else {*/
			if (lv_messageArray.length > 0) {
				that._showActivationOk(lv_messageArray.join('<br/>'));
			}

		},

		_showValidationFailed: function (aErrorMessages) {
			var resourceBundle = this.getResourceBundle();
			var failedtext = resourceBundle.getText('Message.Failed.Validate.Draft');
			var drafts = this.oOrderModel.getData().associatedDrafts;
			var draftUuid = null;
			var messageArrary = [];
			var lv_tciOrderNumber = this.oOrderModel.getData().tciOrderNumber;
			if (aErrorMessages && aErrorMessages.length > 0) {
				var lv_messages = aErrorMessages;
			} else {
				var lv_messages = null;
			}
			if (!!drafts) {
				for (var x = 0; x < drafts.length; x++) {
					//lv_messages = drafts[x].messages;
					draftUuid = drafts[x].DraftUUID;
					if (!!lv_messages && lv_messages.length > 0) {
						for (var y = 0; y < lv_messages.length; y++) {
							if (!!lv_messages[y]) {
								messageArrary.push(resourceBundle.getText('Message.Failed.Error.Message.Draft', [draftUuid, lv_messages[y]]));
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
			MessageBox.success(sDetails, {
				id: "okMessageBox",
				//						details : sDetails,
				styleClass: this.getOwnerComponent().getContentDensityClass(),
				actions: [MessageBox.Action.CLOSE],
				onClose: function (sAction) {
						that.getRouter().navTo("StartOrdering", null, false);
					}
					.bind(this)
			});
		},

		_insetUpadateArray: function (obj) {
			var bInsert = true;
			if (this.aUpdateItems.length > 0 && (!!obj.uuid)) {
				for (var i = 0; i < this.aUpdateItems.length; i++) {
					if (this.aUpdateItems[i].line === obj.line) {
						bInsert = false;
						break;
					}
				}
			}
			// check if the item is in create 

			if (bInsert && (!!obj.uuid)) {
				this.aUpdateItems.push(obj);
			}
			this.toggleSubmitDraftButton();
		},

		onQtyChange: function (oEvent) {
			var that = this;
			var model = this.oOrderModel;
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var oSource = oEvent.getSource();
			var obj = model.getProperty(path);
			if (obj.addIcon !== true) {
				var newValue = oEvent.getParameter("newValue");
				if (newValue > 0) {
					obj.ItemStatus = "Unsaved";

					oSource.setValueStateText("");
					oSource.setValueState("None");
					obj.hasError = false;
					this._insetUpadateArray(obj);

				} else {
					obj.hasError = true;
					//oSource.setValueStateText("Invalid Value");
					oSource.setValueState("Error");

				}
				this.itemTable.getBinding("rows").getModel().refresh(true);
				//this.draftInd.showDraftSaving

			}
		},

		onContractChange: function (oEvent) {
			var that = this;
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = this.oOrderModel.getProperty(path);
			var sValue = oEvent.getParameter("newValue");
			var oSource = oEvent.getSource();
			var bpCode = this.oOrderModel.getProperty('/purBpCode');
			if (obj.addIcon !== true) {

				this._insetUpadateArray(obj);
				this.toggleSubmitDraftButton();

				//var resourceBundle = this.oResourceBundle;
				DataManager.validateContractNumber(bpCode, sValue, obj.partNumber, function (data, isOK, messages) {
					if (!!isOK && !!data) {
						obj.contractLine = data.line_item;
						oSource.setValueState("None");
						obj.hasError = false;
						obj.ItemStatus = "Unsaved";
						//model.setProperty('/newline', newline);
					} else {
						//obj.hasError = true;
						obj.hasError = true;
						oSource.setValueState("Error");
						//oSource.setValueText("Invalid Contract No");
						//TODO -- ERROR 
					}
				});
			}

		},

		onCampOpVINChange: function (oEvent) {
			var that = this;
			var model = this.oOrderModel;
			var oSource = oEvent.getSource();
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = model.getProperty(path);
			if (obj.addIcon !== true) {

				var newValue = oEvent.getParameter("newValue");
				obj.ItemStatus = "Unsaved";
				this._insetUpadateArray(obj);
				this.toggleSubmitDraftButton();

				if (obj.campaignNum && obj.campaignNum.trim() !== "" && obj.opCode && obj.opCode.trim() !== "" && obj.vin && obj.vin.trim() !==
					"") {
					this.validateDataSet(obj.campaignNum, obj.opCode, obj.vin, obj.partNumber, function (oData, isOk, messageList) {
						if (isOk) {
							//bSubmit = true;
							//Do Nothing
							obj.hasError = false;
							if (that.submitError && (!!that.submitError[obj.partNumber])) {
								that.submitError[obj.partNumber] = null;
							}
							if (!!oSource) {
								oSource.setValueState("None");
							}
							that.itemTable.getBinding("rows").getModel().refresh(true);
							//model.setProperty('/newline', newline);
						} else {
							obj.hasError = true;
							if (!that.submitError) {
								that.submitError = [];
							};
							if (!that.submitError[obj.partNumber]) {
								that.submitError[obj.partNumber] = {};
							}
							that.submitError[obj.partNumber].error = oData;
							that.itemTable.getBinding("rows").getModel().refresh(true);

						}
					});
				}
			}
		},

		onCommentChange: function (oEvent) {
			var that = this;
			var model = this.oOrderModel;
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			var obj = model.getProperty(path);
			if (obj.addIcon !== true) {
				var newValue = oEvent.getParameter("newValue");
				obj.ItemStatus = "Unsaved";
				this._insetUpadateArray(obj);
				this.toggleSubmitDraftButton();
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
			var Deletelines = [];

			if (!!items && items.length > 0) {

				sap.ui.core.BusyIndicator.show(0);

				for (var i = 1; i < items.length; i++) {
					if (items[i].selected) {
						Deletelines.push(items[i].line);
						if (items[i].uuid) {
							this.draftInd.showDraftSaving();
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
										var Index = Deletelines.indexOf(y);
										if (Index >= 0) {
											for (var c = 0; c < that.aCreateItems.length; c++) {
												if (that.aCreateItems[c].line === y) {
													that.aCreateItems.splice(c, 1);
												}

											}
											for (var u = 0; u < that.aUpdateItems.length; c++) {
												if (that.aUpdateItems[u].line === y) {
													that.aUpdateItems.splice(u, 1);
												}
											}
											//items.splice(y, 1);

										}
										if (items[y].uuid && (!!deletedList[items[y].uuid])) { // n 
										} else {
											if (Index === -1) {
												newItems.push(items[y]);
											}
										}
									}

									//newItems = items;
									for (var z = 1; z < newItems.length; z++) {
										newItems[z].line = z;
										if (!!failedList[newItems[z].uuid]) {
											newItems[z].messages = newItems[z].messages.concat(newItems[z].messages);
										}
									}

									rData.items = newItems;
									rData.totalLines = rData.items.length - 1;
									// ---to save some newwork traffic
									rData.modifiedOn = new Date();
									model.setData(rData);
									that.draftInd.showDraftSaved();
								}
							});
						}
						// if uuid 

					}
				}
				if (todoList.length === 0) {
					for (var y = 0; y < items.length; y++) {
						var Index = Deletelines.indexOf(y);
						if (Index >= 0) {
							for (var c = 0; c < that.aCreateItems.length; c++) {
								if (that.aCreateItems[c].line === y) {
									that.aCreateItems.splice(c, 1);
								}
							}
							//items.splice(y, 1);
						} else {
							newItems.push(items[y]);
						}

					}
					for (var y = 0; y < newItems.length; y++) {
						newItems[y].line = y;
					}
					rData.items = newItems;
					rData.totalLines = rData.items.length - 1;
					// ---to save some newwork traffic
					rData.modifiedOn = new Date();
					model.setData(rData);
					//that.itemTableTable().getBinding("rows").getModel().refresh();

				}
				sap.ui.core.BusyIndicator.hide();
			}

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

			var columns = this.itemTable.getColumns();
			var model = this.getModel("orderModel");
			var items = model.getData().items;
			if (items.length > 11) {
				this.itemTable.setVisibleRowCount(items.length);
			}
			var len = items.length;
			var typeB = model.getData().typeB;
			var typeD = model.getData().typeD;
			var bSubmitError = false;
			var rows = this.itemTable.getRows();
			for (var x1 = 1; x1 < len; x1++) {
				var rowCells = rows[x1].getCells();
				var cellsLen = rowCells.length;
				//var bError = false;
				//for (var y1 = 0; y1 < cellsLen; y1++) {
				// PartNo
				for (var y1 = 5; y1 < cellsLen; y1++) {
					if (rowCells[y1].getMetadata()._sClassName === "sap.m.Input") {
						if (!!rowCells[y1].getProperty("required")) {
							if (!(rowCells[y1].getValue().trim())) {
								bSubmitError = true;
								rowCells[y1].setValueStateText("Invalid Value");
								rowCells[y1].setValueState("Error");
								items[x1].hasError = true;
							} else if ((rowCells[y1].getType() === "Number") && (rowCells[y1].getValue() < 1)) {
								bSubmitError = true;
								rowCells[y1].setValueStateText("Invalid Value");
								rowCells[y1].setValueState("Error");
								items[x1].hasError = true;
							} else {
								//bSubmitError = false;
								rowCells[y1].setValueStateText("");
								rowCells[y1].setValueState("None");
								items[x1].hasError = false;
							}
						}
					}
				}
			}

			if (typeB && (!bSubmitError)) {
				this._validateContract();
			} else if (typeD && (!bSubmitError)) {
				this._validateCampaign();
			} else {
				model.refresh(true);
				this._showErrorSort(bSubmitError);
				this._activateFinal(bSubmitError);
				//return bSubmitError;
			}
			if (bSubmitError) {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.error("Please fill all the required values", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});

			}
			this.itemTable.setVisibleRowCount(11);
			//var oTable = this.itemTable.
		},

		_validateContract: function () {
			var that = this;
			var bSubmitError = false;
			if (this.oOrderModel.getProperty('/typeB')) {
				var items = this.oOrderModel.getData().items;
				var IIndex = 0;
				that.submitError = {};
				var contractItems = [];

				var getItemIndex = function () {
					return IIndex++;
				};
				var bpCode = this.oOrderModel.getProperty('/purBpCode');
				for (var c1 = 1; c1 < items.length; c1++) {
					if (items[c1].contractNum && items[c1].contractNum.toString().trim() !== "") {
						contractItems.push(c1);
						DataManager.validateContractNumber(bpCode, items[c1].contractNum, items[c1].partNumber, function (data, isOK, messages) {
							if (!!isOK && !!data) {
								var C1 = getItemIndex();
								var I = contractItems[C1];
								items[I].contractLine = data.line_item;

								items[I].hasError = false;
								if (!!that.submitError[items[I].partNumber]) {
									that.submitError[items[I].partNumber] = null;
								}
								//model.setProperty('/newline', newline); 
							} else {
								var C1 = getItemIndex();
								var I = contractItems[C1];
								items[I].hasError = true;
								if (!that.submitError[items[I].partNumber]) {
									that.submitError[items[I].partNumber] = {};

								}
								that.submitError[items[I].partNumber].error = data;
								bSubmitError = true;

								that.itemTable.getBinding("rows").getModel().refresh(true);

							}
							if (IIndex === (contractItems.length) && (!bSubmitError)) {
								//return bSubmitError;
								that._activateFinal(false);

							}
						});
					} else {
						//var J = getItemIndex();
						if (contractItems.length === 0 && (!bSubmitError)) {
							that._activateFinal(false);

						}
					}

				}
			}

		},

		_validateCampaign: function () {
			var bSubmitError = false;
			var that = this;

			var items = this.oOrderModel.getData().items;
			var IIndex = 1;
			that.submitError = {};
			var contractItems = [];
			var getItemIndex = function () {
				return IIndex++;
			};

			for (var c1 = 1; c1 < items.length; c1++) {

				//if (items[c1].contractNum && items[c1].contractNum.toString().trim() !== "") {
				this.validateDataSet(items[c1].campaignNum, items[c1].opCode, items[c1].vin, items[c1].partNumber, function (data, isOK,
					messageList) {
					if (!!isOK && !!data) {
						var I = getItemIndex();

						items[I].hasError = false;
						if (!!that.submitError[items[I].partNumber]) {
							that.submitError[items[I].partNumber] = null;
						}
						//model.setProperty('/newline', newline);
					} else {
						var I = getItemIndex();
						items[I].hasError = true;
						if (!that.submitError[items[I].partNumber]) {
							that.submitError[items[I].partNumber] = {};
						}
						that.submitError[items[I].partNumber].error = data;
						that.itemTable.getBinding("rows").getModel().refresh(true);

						//obj.hasError = true;
						//oSource.setValueState("Error");
						//oSource.setValueText("Invalid Contract No");
					}
					if (IIndex === items.length && (!bSubmitError)) {
						that._activateFinal(false);

					}
				});
			}

		},

		_showErrorSort: function (bSubmitError) {
			var that = this;
			if (bSubmitError) {
				that.btnSortError.setVisible(true);
				that.btnFilterError.setVisible(true);
			} else {
				that.btnSortError.setVisible(false);
				that.btnFilterError.setVisible(false);

			}
		},

		handleSortError: function (oEvent) {
			this._spliceAddItem();
			var oErrorStatusColumn = this.byId("ErrorStatus");

			oEvent.preventDefault();

			//this.clearSortings();

			var sOrder = oEvent.getParameter("sortOrder");

			//this._resetSortingState(); //No multi-column sorting
			oErrorStatusColumn.setSorted(true);
			oErrorStatusColumn.setSortOrder(sOrder);

			this.itemTable.sort(oErrorStatusColumn, this._bSortColumnDescending ? sap.ui.table.SortOrder.Descending : sap.ui.table.SortOrder.Ascending, /*extend existing sorting*/
				true);
			this._bSortColumnDescending = !this._bSortColumnDescending;

		},

		_spliceAddItem: function () {
			if (this.oOrderModel.getData().items.length > 1) {
				var items = this.oOrderModel.getData().items;
				if (items[0].line === 0) {
					items.splice(0, 1);
				}
				this.itemTable.getBinding("rows").getModel().refresh(true);

			}
		},

		_unSpliceAddItem: function () {
			this.oOrderModel.getData().items.splice(0, 0, this._getNewItem());
		},

		handleFilterError: function (oEvent) {
			this._spliceAddItem();
			this._oFilter = new Filter("hasError", FilterOperator.EQ, true);
			this.itemTable.getBinding("rows").filter(this._oFilter, "");
			this.btnFilterError.setVisible(false);
			this.btnClearFilterError.setVisible(true);
		},

		handleClearFilterError: function (oEvent) {
			//this._oFilter = new Filter("hasError", FilterOperator.EQ, true);

			var iColCounter = 0;
			this.itemTable.clearSelection();
			var iTotalCols = this.itemTable.getColumns().length;
			var oItemBinding = this.itemTable.getBinding("rows");
			if (oItemBinding) {
				oItemBinding.aSorters = null;
				oItemBinding.aFilters = null;
				oItemBinding.oCombinedFilter = null;
			}
			this.itemTable.getBinding("rows").getModel().refresh(true);
			//this.itemTable.getModel().refresh(true);
			for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
				this.itemTable.getColumns()[iColCounter].setSorted(false);
				this.itemTable.getColumns()[iColCounter].setFilterValue("");
				this.itemTable.getColumns()[iColCounter].setFiltered(false);
			}
			//this.itemTable.getBinding("rows").aFilters = null;
			this.btnFilterError.setVisible(true);
			this.btnClearFilterError.setVisible(false);
			this._unSpliceAddItem();
			var SORTKEY = "line";
			var DESCENDING = false;
			var GROUP = false;
			var aSorter = [];

			var oBinding = this.itemTable.getBinding("rows");
			aSorter.push(new sap.ui.model.Sorter(SORTKEY, DESCENDING, GROUP));
			oBinding.sort(aSorter);

			this.itemTable.getBinding("rows").refresh(true);
		},

		clearSortings: function (oEvent) {

			this.itemTable.getBinding("rows").sort(null);
			var aColumns = this.itemTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}

		},

		handleSortColumn: function (oEvent) {
			//this._spliceAddItem();
			var oSortColumn = oEvent.getParameter("column");
			this.clearSortings();
			//No Multiple Sorts
			oSortColumn.setSorted(true);
			oEvent.preventDefault();

			var sOrder = oEvent.getParameter("sortOrder");
			oSortColumn.setSorted(true);
			oSortColumn.setSortOrder(sOrder);

			var oSorter = new Sorter(oSortColumn.getSortProperty(), sOrder === "Descending");
			//The date data in the JSON model is string based. For a proper sorting the compare function needs to be customized.
			if (oSortColumn !== this.byId("ErrorStatus")) {
				oSorter.fnCompare = function (a, b) {
					if (b == null) {
						return -1;
					}
					if (a == null) {
						return 1;
					}

					/*	var aa = oDateFormat.parse(a).getTime();
 						var bb = oDateFormat.parse(b).getTime();*/

					if (a < b) {
						return -1;
					}
					if (a > b) {
						return 1;
					}
					return 0;
				};
			} else {
				oSorter.fnCompare = function (a) {
					if (a.hasError) {
						return 1;
					} else {
						return -1;
					}

					/*	var aa = oDateFormat.parse(a).getTime();
 						var bb = oDateFormat.parse(b).getTime();*/

					return 0;
				};

			}
			this.itemTable.getBinding("rows").sort(oSorter);

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
		},

		onImport: function (oEven) {
			var that = this;
			var resourceBundle = this.getResourceBundle();

			var oDialog = this._get_oItemImportDialog();
			jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), oDialog);
			//oDialog.setContentWidth("500px");

			var model = new JSONModel();
			var data = {};

			model.setData(data);
			oDialog.setModel(model);
			oDialog.open();
		},

		onItemImportDialogCancel: function (oEvent) {
			if (!!this._oItemImportDialog) {
				this._oItemImportDialog.close();
			}
		},

		onItemImportDialogOk: function (oEvent) {
			if (!!this._oItemImportDialog) {
				this._oItemImportDialog.close();
			}
		},

		handleUploadPress: function (oEvent) {
			var that = this;
			var oModel = that.oOrderModel;
			var resourceBundle = this.getResourceBundle();
			var oFileUploader = sap.ui.core.Fragment.byId(this.getView().getId() + "ItemsImportDialog", "fileUploader");
			//	var oFileUploader = this.getView().byId("fileUploader");
			if (!oFileUploader.getValue()) {
				MessageToast.show(resourceBundle.getText('Message.error.import.nofile'));
				return;
			}

			var that = this;

			var impOrderModel = new JSONModel;
			this._oImportTable.setModel(impOrderModel, CONST_IMPORT_ORDER_MODEL);
			//var viewModel = this.getModel(CONST_IMPORT_ORDER_MODEL);

			var oDialog = this._get_oItemImportDialog();

			var theModel = oDialog.getModel();

			var domRef = oFileUploader.getFocusDomRef();
			var file = domRef.files[0];
			var oUploadB = sap.ui.core.Fragment.byId(this.getView().getId() + "ItemsImportDialog", "startUpload");

			var reader = new FileReader();

			reader.onload = function (e) {
				var data = e.target.result;
				var binary = "";
				var bytes = new Uint8Array(e.target.result);
				var length = bytes.byteLength;
				for (var i = 0; i < length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}

				var workbook = XLSX.read(binary, {
					type: 'binary'
				});

				if (!!workbook && !!workbook.SheetNames && workbook.SheetNames.length > 0) {
					var aSheet = workbook.Sheets[workbook.SheetNames[0]];
					impOrderModel["items"] = that.getPartImportitems(aSheet);
					that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL).setData(impOrderModel);
					that._oImportTable.getBinding("rows").getModel().refresh(true);

					that._oValidateImportedData();

					oUploadB.setEnabled(true);

					oFileUploader.setValue("");

				} else {
					MessageToast.show(resourceBundle.getText('Message.error.import.errorfile'));
					oUploadB.setEnabled(false);
					impOrderModel["items"] = [];
				}

			};
			reader.onerror = function (ex) {
				oUploadB.setEnabled(false);
				MessageToast.show(resourceBundle.getText('Message.error.import.errorfile'));
				theModel.setProperty("/currentImportitems", []);
			};
			//reader.readAsBinaryString(file);
			reader.readAsArrayBuffer(file);
		},

		getPartImportitems: function (sheet) {
			var that = this;
			var oModel = that.oOrderModel;
			var exLines = [];
			var exLine = {};
			var lines = null;
			if (oModel.getProperty("/typeB")) {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty", "spq", "partDesc", "contractNum", "comment"],
					skipHeader: false
				});

			} else if (oModel.getProperty("/typeD")) {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty", "spq", "partDesc", "campaignNum", "opCode", "vin", "comment"],
					skipHeader: false
				});
			} else {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty", "spq", "partDesc", "comment"],
					skipHeader: false
				});
			}
			// first line is title
			if (!!lines && lines.length > 1) {
				if (lines[2].partNumber.toString() !== that.oOrderModel.getData().dealerCode || lines[2].qty.toString().toUpperCase() !== that.oOrderModel
					.getData().tciOrderNumber.toUpperCase()) {
					var failedtext = "Dealer Code/Order No invalid in file";
					MessageBox.error(failedtext, {
						onClose: function (sAction) {}
					});

				} else {

					for (var i = 4; i < lines.length; i++) {
						exLine = {};
						var obj = lines[i];
						for (var tabHeader in obj) {
							if (tabHeader !== "spq" && tabHeader !== "partDesc") {
								exLine[tabHeader] = obj[tabHeader];
							}
						}
						exLines.push(exLine);
					}
				}
			}
			return exLines;
		},

		_get_oItemImportDialog: function () {
			if (!this._oItemImportDialog) {
				this._oItemImportDialog = sap.ui.xmlfragment(this.getView().getId() + "ItemsImportDialog",
					"tci.wave2.ui.parts.ordering.view.fragments.PartsOrderImport", this);
				this._oImportTable = sap.ui.core.Fragment.byId(this.getView().getId() + "ItemsImportDialog", "ImportProductsTable");
				this._oImportsDialog = sap.ui.core.Fragment.byId(this.getView().getId() + "ItemsImportDialog", "ImportDialog");
				this.getView().addDependent(this._oItemImportDialog);
			}
			if (this.oOrderModel.getProperty("/typeB")) {
				this._oImportsDialog.setContentWidth("700px");
			} else if (this.oOrderModel.getProperty("/typeD")) {
				this._oImportsDialog.setContentWidth("970px");
			} else {
				this._oImportsDialog.setContentWidth("600px");
			}
			if (this._oImportTable.getBinding("rows")) {
				this._oImportTable.getBinding("rows").getModel().getData().items = [];
				this._oImportTable.getModel().refresh(true);
			}
			return this._oItemImportDialog;
		},

	

		_oValidateImportedData: function () {
			var that = this;
			//var sValue = oEvent.getParameter("newValue");
			//var oModel = that.oOrderModel;
			var bpCode = that.oOrderModel.getProperty('/purBpCode');
			var oImportModel = that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL);
			var oItems = oImportModel.getData().items;
			var bIsSalesOrder = that.oOrderModel.getProperty('/isSalesOrder');
			var stoSupplyingPlant = that.oOrderModel.getProperty('/stoSupplyingPlant');
			var bTypeB = that.oOrderModel.getProperty("/TypeB");
			var bTypeD = that.oOrderModel.getProperty("/TypeD");
			var orderTypeId = that.oOrderModel.getProperty("/orderTypeId");
			var sAttribute1 = this.oOrderModel.getProperty("/Attribute1");
			//var newItem = model.getData().items[0];
			//var newline = model.getProperty('/newline');
			var resourceBundle = this.getResourceBundle();
			for (var i = 0; i < oItems.length; i++) {
				var oItem = oItems[i];
				oItem["line"] = i + 1;
				// Debugging
				DataManager.getPartDescSPQForPart(oItem.partNumber, oItem, function (item1Data, oItem) {
					if (!!item1Data && (item1Data[0].Division === sAttribute1) && that.bIsSalesOrder) {
						oItem["Status"] = "Success";
						oItem["StatusText"] = "";
						oItem["hasError"] = false;
						oItem["itemCategoryGroup"] = item1Data[0].categoryGroup;
						oItem["division"] = item1Data[0].Division;
						oItem["partDesc"] = item1Data[0].MaterialDescription;
						oItem["sloc"] = that.oOrderModel.getProperty("/sloc");
						//Valid for UB Only-will be updated for ZLOC
						oItem["revPlant"] = that.oOrderModel.getProperty("/revPlant");
						//Valid for UB Only-will be updated for ZLOC
						oItem["companyCode"] = "2014";
						oItem["spq"] = item1Data[0].SPQ;
						oItem["selected"] = false;
						oItem["OrderType"] = that.getRealOrderTypeByItemCategoryGroup(item1Data[0].categoryGroup, that.bIsSalesOrder, orderTypeId);
						oItem["supplier"] = item1Data[0].VendorAccountNumber;
						//oItem["sloc"] = data.SLoc;
						oItem["revPlant"] = item1Data[0].Plant;
						that.oOrderModel.setProperty("/itemCategoryGroup", item1Data[0].categoryGroup);
						oImportModel.getData().refresh(true);
					} else if (!!item1Data && (!that.bIsSalesOrder) && (item1Data[0].categoryGroup !== "")) {
						oItem["Status"] = "Success";
						oItem["StatusText"] = "";
						oItem["hasError"] = false;
						oItem["itemCategoryGroup"] = item1Data[0].categoryGroup;
						oItem["division"] = item1Data[0].Division;
						oItem["partDesc"] = item1Data[0].MaterialDescription;
						oItem["sloc"] = that.oOrderModel.getProperty("/sloc");
						//Valid for UB Only-will be updated for ZLOC
						oItem["revPlant"] = that.oOrderModel.getProperty("/revPlant");
						//Valid for UB Only-will be updated for ZLOC
						oItem["companyCode"] = "2014";
						oItem["spq"] = item1Data[0].SPQ;
						oItem["selected"] = false;
						oItem["OrderType"] = that.getRealOrderTypeByItemCategoryGroup(item1Data[0].categoryGroup, that.bIsSalesOrder, orderTypeId);
						oItem["supplier"] = item1Data[0].VendorAccountNumber;
						oItem["revPlant"] = item1Data[0].Plant;
						that.oOrderModel.setProperty("/itemCategoryGroup", item1Data[0].categoryGroup);
						oImportModel.getData().refresh(true);
					} else {
						oItem["Status"] = "Error";
						oItem["StatusText"] = "Incorrect Data";
						oItem["hasError"] = true;
						oItem["itemCategoryGroup"] = "";
						oItem["division"] = "";
						oItem["partDesc"] = "";
						oItem["supplier"] = "";
						oItem["purInfoRecord"] = "";
						oItem["companyCode"] = "";
						oItem["currency"] = 'CAD';
						oItem["netPriceAmount"] = "";
						oItem["taxCode"] = "";
						oItem["spq"] = "";
					}

				});
			}; // //model.getData().items[0] = newItem;
			oImportModel.refresh(true);
			//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), oItem);
			//model.setProperty('/newline', newline);

		},

		handleAddPartForImport: function (oEvent) {
			var that = this;
			var oModel = that.oOrderModel;
			var bIsSalesOrder = oModel.getProperty('/isSalesOrder');
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.warning("This will delete the existing items in the order and only Valid Parts will be imported", {
				actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				onClose: function (sAction) {
					if (sAction === "OK") {
						this.handleDeletePartForImport();

					}
				}.bind(this)
			});
			//sAction = OK
		},

		handleDeletePartForImport: function () {
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
			var Deletelines = [];

			if (!!items && items.length > 0) {

				sap.ui.core.BusyIndicator.show(0);

				for (var i = 1; i < items.length; i++) {
					//if (items[i].selected) {
					Deletelines.push(items[i].line);
					if (items[i].uuid) {
						//this.draftInd.showDraftSaving();
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
									var Index = Deletelines.indexOf(y);
									if (Index >= 0) {
										for (var c = 0; c < that.aCreateItems.length; c++) {
											if (that.aCreateItems[c].line === y) {
												that.aCreateItems.splice(c, 1);
											}

										}
										for (var u = 0; u < that.aUpdateItems.length; c++) {
											if (that.aUpdateItems[u].line === y) {
												that.aUpdateItems.splice(u, 1);
											}
										}
										//items.splice(y, 1);

									}
									if (items[y].uuid && (!!deletedList[items[y].uuid])) { // n 
									} else {
										if (Index === -1) {
											newItems.push(items[y]);
										}
									}
								}

								//newItems = items;
								for (var z = 1; z < newItems.length; z++) {
									newItems[z].line = z;
									if (!!failedList[newItems[z].uuid]) {
										newItems[z].messages = newItems[z].messages.concat(newItems[z].messages);
									}
								}

								rData.items = newItems;
								rData.totalLines = rData.items.length - 1;
								// ---to save some newwork traffic
								rData.modifiedOn = new Date();
								model.setData(rData);
								//that.draftInd.showDraftSaved();
								that._CreateImportItemsDraft();
							}
						});
					}
					// if uuid 

					//} selectedEnd
				}
				if (todoList.length === 0) {
					for (var y = 0; y < items.length; y++) {
						var Index = Deletelines.indexOf(y);
						if (Index >= 0) {
							for (var c = 0; c < that.aCreateItems.length; c++) {
								if (that.aCreateItems[c].line === y) {
									that.aCreateItems.splice(c, 1);
								}
							}
							//items.splice(y, 1);
						} else {
							newItems.push(items[y]);
						}

					}
					for (var y = 0; y < newItems.length; y++) {
						newItems[y].line = y;
					}
					rData.items = newItems;
					rData.totalLines = rData.items.length - 1;
					// ---to save some newwork traffic
					rData.modifiedOn = new Date();
					model.setData(rData);
					that._CreateImportItemsDraft();
					//that.itemTableTable().getBinding("rows").getModel().refresh();

				}

				sap.ui.core.BusyIndicator.hide();
			}

		},

		_CreateImportItemsDraft: function (sAction) {

			var that = this;
			var oModel = that.oOrderModel;
			var oImportModel = that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL);
			var oOrderData = oModel.getData();

			var oImportItems = oImportModel.getData().items;
			var impData = JSON.parse(JSON.stringify(oModel.getData()));
			var xItems = oModel.getData().items;

			var resourceBundle = that.getResourceBundle();
			var failedtext = null;
			var aFailedItems = [];
			var messageList = null;
			var _validatedItems = [];
			var itemNo = 0;

			for (var i = 0; i < oImportItems.length; i++) {
				if (oImportItems[i].hasError === false && oImportItems[i].Status === "Success") {
					//oImportItems[i]["line"] = itemNo + 1;
					oImportItems[i]["line"] = 0;
					//that.oOrderModel.getData().items.push(oImportItems[i]);
					that.oOrderModel.getData().items.splice(0, 1);
					that.oOrderModel.getData().items.splice(0, 0, oImportItems[i]);
					var oEvent = new sap.ui.base.Event();
					_validatedItems.push(oImportItems[i]);
					if (_validatedItems.length === 1) {
						//DeleteAllitems - 
						//that.handleDeletePartForImport();
						that.aCreateItems = [];
						that.aUpdateItems = [];
						//that.oOrderModel.getData().associatedDrafts = [];
						// empty the create & update array.
					}
					that.handleAddPart(oEvent);
					itemNo++;

				}
			}
			that.itemTable.getBinding("rows").getModel().refresh(true);

			//iData.items.splice(0, 1);
			//Register the controller 
			ImportSalesOrder.setControllerInstance(this);

			//oOrderData.items = [];
			//oOrderData["associatedDrafts"] = [];

			that.itemTable.getBinding("rows").refresh(true);
			that._oItemImportDialog.close();
			sap.m.MessageToast.show(+itemNo + " Valid Order Items Imported Successfully");

		},

	

		onExport: function () {

			var aCols, aFileName, oRowBinding, aData, oSheet, oHeader, stitle, aItems;
			var that = this;
			var oModel = that.oOrderModel;
			oRowBinding = that.itemTable.getBinding("rows");

			stitle = ["Parts Order"];
			var stitle2 = ["Dealer", "Order No "];
			var sValue2 = [oModel.getProperty("/dealerCode"), oModel.getProperty("/tciOrderNumber")];

			var ws = XLSX.utils.aoa_to_sheet([stitle, [], stitle2, sValue2]);
			if (oModel.getProperty("/typeB")) {

				oHeader = {
					"A7": "Part Number",
					"B7": "Order Quantity",
					"C7": "SPQ",
					"D7": "Part Description",
					"E7": "Contract Number",
					"F7": "Comments"
				};
				aItems = ["partNumber", "qty", "spq", "partDesc", "contractNum", "comment"];

			} else if (oModel.getProperty("/typeD")) {

				oHeader = {
					"A7": "Part Number",
					"B7": "Part Description",
					"C7": "SPQ",
					"D7": "Order Quantity",
					"E7": "Campaign Number",
					"F7": "Operation Code",
					"G7": "VIN",
					"H7": "Comments"
				};
				aItems = ["partNumber", "qty", "spq", "partDesc", "campaignNum", "opCode", "vin", "comment"];
			} else {

				oHeader = {
					"A7": "Part Number",
					"B7": "Order Quantity",
					"C7": "SPQ",
					"D7": "Part Description",
					"E7": "Comments"
				};
				aItems = ["partNumber", "qty", "spq", "partDesc", "comment"];
			};
			var aDataItems = oRowBinding.getModel().getData().items;
			var aData = [];

			for (var i = 0; i < aDataItems.length; i++) {
				var aItem = {};
				aItems.forEach(function (title) {
					if (aDataItems[i][title]) {
						aItem[title] = aDataItems[i][title];
					}
				});
				aData.push(aItem);
			}

			XLSX.utils.sheet_add_json(ws, aData, {
				header: aItems,
				origin: "A7",
				skipHeader: false
			});

			var wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "OrderNo " + oModel.getProperty("/tciOrderNumber"));
			var wbout = XLSX.write(wb, {
				bookType: "xlsx",
				type: "array"
			});

			for (var header in oHeader) {
				// skip loop if the property is from prototype
				ws[header].v = oHeader[header];

			}

			XLSX.writeFile(wb, "Order_" + oModel.getProperty("/tciOrderNumber") + ".xlsx");

		}

	});
});