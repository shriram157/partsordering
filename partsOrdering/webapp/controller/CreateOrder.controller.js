/* global XLSX:true */
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
	var CONST_IMPORT_ORDER_MODEL = 'importOrderModel';

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
			this.oMaterialColumn = this.byId("Material");
			this.oCampaignColumn = this.byId("CampaignNo");
			this.oContractColumn = this.byId("ContractNo");
			this.oOperationCodeColumn = this.byId("OperationCode");
			this.oVinColumn = this.byId("Vin");

			this.btnFilterError = this.byId('btnFilterError');
			this.btnSortError = this.byId('btnSortError');
			this.btnClearFilterError = this.byId('btnClearFilterError');

			this.partDescModel = this.getZCMATERIALModel();

			this.slang = this.getSapLangugaeFromLocal();

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
				remPartNo: "8rem",
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
				remPartNo: "8rem",
				remPartDesc: "14rem",
				remSPQ: "4rem",
				remQty: "7rem",
				remCampaignNo: "12rem",
				remOpCode: "14rem",
				remVin: "11rem",
				remComments: "18rem",
				remCommentsPx: "275px"
			};
		},

		_onObjectMatched: function (oEvent) {
			// clear all the other message 
			var that = this;

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
			//if (orderData.items && orderData.items.length === 0) {
			//this.itemTable.unbindRows();
			this._resetValueStateOfRows();
			//orderData.items.splice(0, 0, that._getNewItem());
			//}
			model.setData(orderData);
			this.setModel(model, CONT_ORDER_MODEL);
			this.oModel = this.getModel(CONT_ORDER_MODEL);
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
					//model.setProperty('/SalesOrganization', aCustSaleArea.SalesOrganization);
					//model.setProperty('/DistributionChannel', aCustSaleArea.DistributionChannel);
					model.setProperty('/Division', aCustSaleArea.Division);

					// hard code ---
					model.setProperty('/SalesOrganization', '7000');
					model.setProperty('/DistributionChannel', "10");
					if ('00' === aCustSaleArea.Division) {
						model.setProperty('/Division', "10");
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
					// 					orderData.sloc = data.SLoc;
					model.setProperty('/revPlant', data.Plant);
					//						orderData.revPlant = data.Plant;
				}
			});

			this.loadDealerDraft(orderData.dealerCode, orderData, function (rData) {
				for (var x = 0; x < rData.items.length; x++) {
					rData.items[x].messageLevel = that.getMessageLevel(rData.items[x].messages);
				}
				if (rData.items.length > 0) {

					for (var i = 0; i < rData.items.length; i++) {

						rData.items[i].addIcon = false;
						rData.items[i].hasError = false;

					}
					rData.totalLines = rData.items.length;
				} else {
					rData.totalLines = 0;
				}
				if (rData.dealerType === '04') { // campaign 
					rData.typeB = true;
				} else if (rData.orderTypeId === '3') {
					rData.typeD = true;
				}

				orderData.items.splice(0, 0, that._getNewItem());
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

			//Added
			orderData.Customer = appStateModel.getProperty('/selectedBP/customer');

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
				addIcon: true

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
					newItem.hasError = "true";
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
			var oVBox = oEvent.getSource().getParent();
			var oRow = oVBox.getParent();
			var iRowIndex = oRow.getIndex();
			var oItem = model.getData().items[iRowIndex];
			//var newItem = model.getData().items[0];
			//var newline = model.getProperty('/newline');
			var resourceBundle = this.getResourceBundle();
			oItem.partNumber = sValue;
			that.getPartDescSPQForPart(oItem, model.getProperty('/SalesOrganization'), model.getProperty('/DistributionChannel'), model.getProperty(
				'/stoSupplyingPlant'), function (
				item1Data, oItem) {
				//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), function (item1Data) {
				if (!!item1Data) {
					oItem.hasError = false;
					oItem.itemCategoryGroup = item1Data[0].categoryGroup;
					oItem.division = item1Data[0].Division;
					oItem.partDesc = item1Data[0].MaterialDescription;
					oItem.supplier = item1Data[0].Supplier;
					oItem.sloc = model.getProperty("/sloc"); //Valid for UB Only-will be updated for ZLOC
					oItem.revPlant = model.getProperty("/revPlant"); //Valid for UB Only-will be updated for ZLOC
					//	oItem.supplier = item1Data[0].supplier; //inforecord
					//	oItem.purInfoRecord = item1Data[0].purInfoRecord;
					oItem.companyCode = "2014";
					//	oItem.currency = item1Data[0].currency; //NR
					//	oItem.netPriceAmount = item1Data[0].netPriceAmount //NR
					//	oItem.taxCode = item1Data[0].taxCode;  //
					oItem.spq = item1Data[0].SPQ;

				} else {
					oItem.hasError = true;
					oItem.itemCategoryGroup = "";
					oItem.division = "";
					oItem.partDesc = "";
					oItem.supplier = "";
					oItem.purInfoRecord = "";
					oItem.companyCode = "";
					oItem.currency = 'CAD';
					oItem.netPriceAmount = "";
					oItem.taxCode = "";
					oItem.spq = "";
					//oItem.addIcon = true;

					var failedtext = resourceBundle.getText('Message.Failed.Load.Part', [sValue]);
					MessageBox.error(failedtext, {
						onClose: function (sAction) {
							sap.ui.core.BusyIndicator.hide();
						}
					});
					if (iRowIndex === 0) {
						oItem.addIcon = true;
						oItem.hasError = false;
					} else {
						oItem.addIcon = false;
						oItem.hasError = oItem.hasError || false;
					}

				}
				//model.getData().items[0] = newItem;
				model.refresh(true);
				//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), oItem);
				//model.setProperty('/newline', newline);
			});

		},

		getPartDescSPQForPart: function (oItem, sSalesOrganization, sDistributionChannel, stoSupplyingPlant, callback) {
			var that = this;

			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("MaterialNumber", sap.ui.model.FilterOperator.EQ, oItem.partNumber);
			oFilter[1] = new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, sSalesOrganization);
			oFilter[2] = new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, sDistributionChannel);
			//oFilter[3] = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, stoSupplyingPlant);
			oFilter[3] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, that.slang);

			that.partDescModel.read("/ZC_MATERIAL_SPQ", {
				filters: new Array(new sap.ui.model.Filter({
					filters: oFilter,
					and: true
				})),
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						callback(oData.results, oItem);
					} else {
						// error
						callback(null, oItem);
					}

				},

				error: function (err) {
					// handle error?
					callback(null);
				}
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
			var oSource = oEvent.getSource();
			var iData = model.getData();
			var resourceBundle = this.getResourceBundle();
			var failedtext = null;
			if (oSource) {
				oSource.setEnabled(false);
			}
			if (iData.items[0].hasError) {
				failedtext = resourceBundle.getText('Message.Failed.Load.Part', [iData.items[0].partNumber]);
				MessageBox.error(failedtext, {
					onClose: function (sAction) {}
				});
				oSource.setEnabled(true);
				return false;
			}
			if (iData.items[0].partNumber.toString().trim() === "") {
				oSource.setEnabled(true);
				return false;
			}

			// TODO-- check the values, warning message..
			failedtext = resourceBundle.getText('Message.Failed.Add.Part');
			sap.ui.core.BusyIndicator.show(0);
			//Code to get itemCategortype & Supplier

			this.draftInd.showDraftSaving();

			var oItem = JSON.parse(JSON.stringify(iData.items[0]));
			oItem.addIcon = false;
			oItem.hasError = false;
			// this step, all good, move the new line to to items
			/*	oItem.line = rData.totalLines + 1;
				oItem.addIcon = false;
				rData.items.splice(rData.items.length, 0, oItem);
				rData.items.splice(0, 1);
				rData.items.splice(0, 0, that._getNewItem());
				//rData.newline = [that._getNewLine()];
				rData.totalLines = rData.items.length - 1;
				// ---to save some newwork traffic
				rData.modifiedOn = new Date();*/
			that.getInfoForPart(oItem, iData, model.getProperty('/purBpCode'), iData.dealerCode, model.getProperty('/stoSupplyingPlant'),
				function (documentType) {
					that.createOrderDraft(iData, function (rData, isOk) {
						if (isOk) {
							rData.items[0].line = rData.totalLines + 1;
							rData.items[0].addIcon = false;
							rData.items[0].selected = false;
							rData.items.splice(rData.items.length, 0, rData.items[0]);
							rData.items.splice(0, 1);
							rData.items.splice(0, 0, that._getNewItem());
							//rData.newline = [that._getNewLine()];
							rData.totalLines = rData.items.length - 1;
							// ---to save some newwork traffic
							rData.modifiedOn = new Date();
							model.setData(rData);

							that.draftInd.showDraftSaved();
						} else {
							iData.items[0].addIcon = true;
							MessageBox.error(failedtext, {
								onClose: function (sAction) {
									//TODO??
								}
							});
						};
					});
				});

			sap.ui.core.BusyIndicator.hide();
			oSource.setEnabled(true);
			//});
		},

		toggleSelect: function (oEvent) {
			var that = this;
			var isSelected = oEvent.getParameters("Selected").selected;
			var model = this.getModel(CONT_ORDER_MODEL);
			var oRow = oEvent.getSource().getParent();
			var iRowIndex = oRow.getIndex();
			var data = model.getData();
			data.items[iRowIndex].selected = isSelected;
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
				//items.splice(0,1);
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
			var bError = false;
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
						bError = true;
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
				if (bError) {
					rData.items.splice(0, 0, that._getNewItem());
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
			if (obj.addIcon !== true) {
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
			}
		},

		onCommentChange: function (oEvent) {
			var that = this;
			var model = this.getModel(CONT_ORDER_MODEL);
			var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
			if (obj.addIcon !== true) {
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
				for (var i = 1; i < items.length; i++) {
					if (items[i].selected) {
						todoList.push(items[i].uuid);
						this.deleteOrderDraftItem([items[i].uuid, items[i].line, items[i].parentUuid], isSalesOrder, function (keys, isOk, messages) {
							// only failed record will be returning message. message of good one will be ignored
							if (isOk) {
								deletedList[keys[0]] = keys;
								deletedList.count = deletedList.count + 1;
								items.splice(i, 1);
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
								rData.totalLines = rData.items.length - 1;
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

		/*onExport: function (oEvent) {
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
		},*/
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
				for (var y1 = 5; y1 < cellsLen; y1++) {
					if (rowCells[y1].getMetadata()._sClassName === "sap.m.Input") {
						if (!!rowCells[y1].getProperty("required")) {
							if (!(rowCells[y1].getValue().trim())) {
							//if ((rowCells[y1].getValue()) && (rowCells[y1].getValue().trim() === "")) {
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
			/*	if (!!rowCells[2].getProperty("required")) {
					if (rowCells[2].getValue() && rowCells[2].getValue().trim() === "") {
						bSubmitError = true;
						rowCells[2].setValueStateText("Invalid Value");
						rowCells[2].setValueState("Error");
						items[x1].hasError = true;
					} else {
						//bSubmitError = false;
						rowCells[2].setValueStateText("");
						rowCells[2].setValueState("None");
						items[x1].hasError = false;
					}
				}
				//Qty
				if (!!rowCells[5].getProperty("required")) {
					if (rowCells[5].getValue() === "" || rowCells[5].getValue() < 1) {
						bSubmitError = true;
						//rowCells[1].setValueStateText("Invalid Value");
						rowCells[5].setValueState("Error");
						items[x1].hasError = true;
					} else {
						//bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[5].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Campaign No or Contract No 
				if ((typeD || typeB) && !!rowCells[6].getProperty("required")) {
					if (rowCells[6].getValue() === "" || rowCells[6].getValue().trim() === "") {
						bSubmitError = true;
						rowCells[6].setValueStateText("Invalid Value");
						rowCells[6].setValueState("Error");
						items[x1].hasError = true;
					} else {
						//bSubmitError = false;
						//rowCells[5].setValueStateText("");
						rowCells[5].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Operation Code 
				if (typeD && !!rowCells[7].getProperty("required")) {
					if (rowCells[7].getValue() === "") {
						bSubmitError = true;
						rowCells[7].setValueStateText("Invalid Value");
						rowCells[7].setValueState("Error");
						items[x1].hasError = true;
					} else {
						//bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[7].setValueState("None");
						items[x1].hasError = false;
					}
				}
				// Vin 
				if (typeD && !!rowCells[8].getProperty("required")) {
					if (rowCells[8].getValue() === "") {
						bSubmitError = true;
						rowCells[8].setValueStateText("Invalid Value");
						rowCells[8].setValueState("Error");
						items[x1].hasError = true;
					} else {
						//bSubmitError = false;
						//rowCells[1].setValueStateText("");
						rowCells[8].setValueState("None");
						items[x1].hasError = false;
					}
				}

				//}

			}*/
			//if 
			model.refresh(true);
			this._showErorSort(bSubmitError);
			return bSubmitError;
			//var oTable = this.itemTable.
		},

		_showErorSort: function (bSubmitError) {
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

			//var sValue = oEvent.getParameter("value");
			/*var sValue = true;
			this._oFilter = new Filter("hasError", FilterOperator.EQ, sValue);
			this.itemTable.getBinding("rows").filter(this._oFilter, "Application");

			function clear() {

				oColumn.setFiltered(false);
				this.itemTable.getBinding("rows").filter(null, "Application");
			}*/

			//if (!isNaN(fValue)) {

		},

		handleFilterError: function (oEvent) {
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
		},

		clearSortings: function (oEvent) {
			this.itemTable.getBinding("rows").sort(null);
			var aColumns = this.itemTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},

		handleSortColumn: function (oEvent) {
			var oSortColumn = oEvent.getParameter("column");
			this.clearSortings(); //No Multiple Sorts
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

		/*	sortColumn : function(oSortColumn) {
			this.itemTable.sort(oSortColumn, this._bSortColumnDescending ? sap.ui.table.SortOrder.Descending : sap.ui.table.SortOrder.Ascending, /*extend existing sorting*/
		//	true);
		//this._bSortColumnDescending = !this._bSortColumnDescending;
		//	}*/

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
			/*	data.title = resourceBundle.getText("Label.Header.Import.Part");
				data.currentTab = 'Part';
				data.isOk = false;
				data.currentImportitems = [];*/
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
			//var oUploadB = that.getView().byId("startUpload");
			// Create a File Reader object
			var reader = new FileReader();

			reader.onload = function (e) {
				var data = e.target.result;

				var workbook = XLSX.read(data, {
					type: 'binary'
				});

				if (!!workbook && !!workbook.SheetNames && workbook.SheetNames.length > 0) {
					var aSheet = workbook.Sheets[workbook.SheetNames[0]];
					impOrderModel["items"] = that.getPartImportitems(aSheet);
					that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL).setData(impOrderModel);
					that._oImportTable.getBinding("rows").getModel().refresh(true);
					oUploadB.setEnabled(true);
					that._oValidateImportedData();
					oFileUploader.setValue("");

				} else {
					MessageToast.show(resourceBundle.getText('Message.error.import.errorfile'));
					oUploadB.setEnabled(false);
					impOrderModel["items"] = [];
				}
				//theModel.setProperty("/currentImportitems", currentImportitems);
				// workbook.SheetNames.forEach(function (sheetName) {
				// 	// Here is your object
				// 	var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
				// 	var json_object = JSON.stringify(XL_row_object);
				// });

				// Bind the data to the Table
				// var oModel = new sap.ui.model.json.JSONModel();
				// oModel.setData(lines);
				// var oTable = that.getView().byId("loadTable");
				// oTable.setModel(oModel);
			};
			reader.onerror = function (ex) {
				oUploadB.setEnabled(false);
				MessageToast.show(resourceBundle.getText('Message.error.import.errorfile'));
				theModel.setProperty("/currentImportitems", []);
			};
			reader.readAsBinaryString(file);
		},

		createColumnConfig: function () {
			var that = this;
			var aCols = [];

			aCols.push({
				label: 'Part Number',
				type: 'string',
				property: 'partNumber'
					//template: '{0}, {1}'
			});

			aCols.push({
				label: 'Part Description',
				type: 'string',
				property: 'partDesc'
			});

			aCols.push({
				label: 'SPQ',
				property: 'spq',
				type: 'number'
			});

			aCols.push({
				label: 'Quantity',
				property: 'qty',
				type: 'number'
			});

			if (that.oModel.getProperty("/typeB")) {
				aCols.push({
					label: 'Contract Number',
					property: 'contractNum',
					type: 'string'
				});
			}

			if (that.oModel.getProperty("/typeD")) {
				aCols.push({
					label: 'Campaign Number',
					property: 'campaignNum',
					type: 'number'
				});

				aCols.push({
					label: 'Operation Code',
					property: 'opCode',
					type: 'number'
				});

				aCols.push({
					label: 'VIN',
					property: 'vin',
					type: 'string'
				});

			}
			aCols.push({
				label: 'Comments',
				property: 'comment',
				type: 'string'
			});

			return aCols;
		},

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			oRowBinding = this.itemTable.getBinding("rows");

			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {

					columns: aCols
				},
				dataSource: oRowBinding.getModel().getData().items
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},

		getPartImportitems: function (sheet) {
			var that = this;
			var exLines = [];
			var exLine = {};
			var lines = null;
			if (that.oModel.getProperty("/typeB")) {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty", "spq", "partDesc", "contractNum"],
					skipHeader: false
				});

			} else if (that.oModel.getProperty("/typeD")) {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty", "spq", "partDesc", "campaignNum", "opCode", "vin"],
					skipHeader: false
				});
			} else {
				lines = XLSX.utils.sheet_to_json(sheet, {
					header: ["partNumber", "qty"],
					skipHeader: false
				});
			}
			// first line is title
			if (!!lines && lines.length > 1) {

				for (var i = 5; i < lines.length; i++) {
					exLine = {};
					var obj = lines[i];
					for (var tabHeader in obj) {
						if (tabHeader !== "spq" && tabHeader !== "partDesc") {
							exLine[tabHeader] = obj[tabHeader];
						}
					}
					/*exLine = {};
					exLine.partNumber = lines[i].PartNumber;
					exLine.qty = lines[i].Qty;*/
					//exLine.desc = lines[i].C;
					//exLine.category = lines[i].D;
					//exLine.status = 'PD';
					exLines.push(exLine);
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
			if (this.oModel.getProperty("/typeB")) {

				this._oImportsDialog.setContentWidth("700px");
			} else if (this.oModel.getProperty("/typeD")) {
				this._oImportsDialog.setContentWidth("970px");
			} else {
				this._oImportsDialog.setContentWidth("600px");
			}
			return this._oItemImportDialog;
		},

		_oValidateImportedData: function () {
			var that = this;
			//var sValue = oEvent.getParameter("newValue");
			var oModel = that.getModel(CONT_ORDER_MODEL);
			var bpCode = oModel.getProperty('/purBpCode');
			var oImportModel = that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL);
			var oItems = oImportModel.getData().items;
			//var newItem = model.getData().items[0];
			//var newline = model.getProperty('/newline');
			var resourceBundle = this.getResourceBundle();
			for (var i = 0; i < oItems.length; i++) {
				var oItem = oItems[i];
				oItem["line"] = i + 1;
				// Debugging
				that.getPartDescSPQForPart(oItem, oModel.getProperty('/SalesOrganization'), oModel.getProperty('/DistributionChannel'), oModel.getProperty(
					'/stoSupplingPlant'), function (item1Data, oItem) {
					//that.getPartDescSPQForPart(oItem, "7000", "10",  oModel.getProperty('/stoSupplyingPlant'), function (
					//item1Data, oItem) {
					//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), function (item1Data) {
					if (!!item1Data) {
						oItem["Status"] = "Success";
						oItem["StatusText"] = "";
						oItem["hasError"] = false;
						oItem["itemCategoryGroup"] = item1Data[0].categoryGroup;
						oItem["division"] = item1Data[0].Division;
						oItem["partDesc"] = item1Data[0].MaterialDescription;

						oItem["sloc"] = oModel.getProperty("/sloc"); //Valid for UB Only-will be updated for ZLOC
						oItem["revPlant"] = oModel.getProperty("/revPlant"); //Valid for UB Only-will be updated for ZLOC
						//	oItem.supplier = item1Data[0].supplier; //inforecord
						//	oItem.purInfoRecord = item1Data[0].purInfoRecord;
						oItem["companyCode"] = "2014";
						//	oItem.currency = item1Data[0].currency; //NR
						//	oItem.netPriceAmount = item1Data[0].netPriceAmount //NR
						//	oItem.taxCode = item1Data[0].taxCode;  //
						oItem["spq"] = item1Data[0].SPQ;
						oItem["selected"] = false;
						oImportModel.refresh(true);
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
						//oItem.addIcon = true;

						// 	var failedtext = resourceBundle.getText('Message.Failed.Load.Part', [sValue]);
						// 	MessageBox.error(failedtext, {
						// 		onClose: function (sAction) {
						// 			sap.ui.core.BusyIndicator.hide();
						// 		}
						// 	});
						// 	if (iRowIndex === 0) {
						// 		oItem.addIcon = true;
						// 		oItem.hasError = false;
						// 	} else {
						// 		oItem.addIcon = false;
						// 		oItem.hasError = oItem.hasError || false;
						// 	}

						//} else {
						//	oItem.hasError = true;
					}
					/*	if (oItem["Status"] === "Success" && that.oModel.getProperty("/typeB")) {

							var resourceBundle = that.getResourceBundle();
							this.validateContractNumber(bpCode, oItem.contractNum, oItem.partNumber, function (data, isOK, messages) {
								if (!!isOK && !!data) {
									//newItem.contractLine = data.line_item;
									//model.setProperty('/newline', newline);
								} else {
									oItem["Status"] = "Error";
									oItem["StatusText"] = messages;
									oItem["hasError"] = true;
									//TODO -- ERROR 
								}
							});

						}
						if (oItem["Status"] === "Success" && that.oModel.getProperty("/typeD")) {

							var resourceBundle = that.getResourceBundle();
							this.validateDataSet(oItem.campaignNum, oItem.opCode, oItem.vin, oItem.partNumber, function (data, isOK, messages) {
								if (!!isOK && !!data) {
									//newItem.contractLine = data.line_item;
									//model.setProperty('/newline', newline);
								} else {
									oItem["Status"] = "Error";
									oItem["StatusText"] = messages;
									oItem["hasError"] = true;
									//TODO -- ERROR 
								}
							});

						}*/
				}); // ValidateContract Num End 

			};

			// //model.getData().items[0] = newItem;
			oImportModel.refresh(true);
			//that.getInfoFromPart(sValue, model.getProperty('/purBpCode'), oItem);
			//model.setProperty('/newline', newline);

		},

		handleAddPartForImport: function (oEvent) {
			var that = this;
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.warning(
				"This will delete the existing items in the order", {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (sAction) {
						if (sAction === "OK") {
							that._CreateImportItemsDraft();

						}
					}.bind(this)
				}); //sAction = OK
		},

		_CreateImportItemsDraft: function (sAction) {
			var that = this;
			var oModel = that.getModel(CONT_ORDER_MODEL);
			var oImportModel = that._oImportTable.getModel(CONST_IMPORT_ORDER_MODEL);
			var oItems = oImportModel.getData().items;
			var xItems = oModel.getData().items;

			//var model = this.getModel(CONT_ORDER_MODEL);
			//var oSource = oEvent.getSource();

			var iData = oModel.getData();
			that._iData = iData;
			var resourceBundle = that.getResourceBundle();
			var failedtext = null;

			sap.ui.core.BusyIndicator.show(0);
			/*	for (var i = 0; i < oItems.length; i++) {
					if (oItems[i].hasError === false && oItems[i].Status === "Success") {
						_validatedItems.push(oItems[i]);
					}
				}*/

			//iData.items.splice(0, 1);
			iData.items = [];
			for (var j = oItems.length - 1; j > -1; j--) {
				var oItem = oItems[j];
				oItem.line = j + 1;
				that.draftInd.showDraftSaving();
				var oItem = JSON.parse(JSON.stringify(oItem));
				//iData.items.splice(0, 1);
				iData.items.splice(0, 0, oItem);
				/*	if (_validatedItems.length < i + 1) {
						that._oImportNextItem = JSON.parse(JSON.stringify(_validatedItems[++i]));
					} else {
						that._oImportNextItem = that._getNewItem();
					}*/
				oItem.addIcon = false;
				oItem.hasError = false;

				// this step, all good, move the new line to to items
				/*	oItem.line = rData.totalLines + 1;
					oItem.addIcon = false;
					rData.items.splice(rData.items.length, 0, oItem);
					rData.items.splice(0, 1);
					rData.items.splice(0, 0, that._getNewItem());
					//rData.newline = [that._getNewLine()];
					rData.totalLines = rData.items.length - 1;
					// ---to save some newwork traffic
					rData.modifiedOn = new Date();*/
				that.getInfoForPart(oItem, iData, oModel.getProperty('/purBpCode'), iData.dealerCode, oModel.getProperty('/stoSupplyingPlant'),
					function (documentType) {
						that.createOrderDraft(iData, function (rData, isOk) {
							if (isOk) {
								//rData.items[0].line = rData.totalLines + 1;
								//rData.items[0].addIcon = false;
								//rData.items.splice(rData.items.length, 0, rData.items[0]);
								//rData.items.splice(0, 1);
								//rData.items.splice(0, 0, that._getNewItem());
								//rData.newline = [that._getNewLine()];
								rData.totalLines = rData.items.length;
								// ---to save some newwork traffic
								rData.modifiedOn = new Date();
								oModel.setData(rData);

								that.draftInd.showDraftSaved();
								/*if (rData.totalLines === _validatedItems.length) {
									rData.items.splice(0, 0, that._getNewItem());
									that.getModel(CONT_ORDER_MODEL).setData(rData);
									that.itemTable.getBinding("rows").refresh(true);
								}*/
							} else {
								//iData.items[0].addIcon = true;
								MessageBox.error(failedtext, {
									onClose: function (sAction) {
										//TODO??
									}
								});
							};
						});
					});
			}
			iData.items.splice(0, 0, that._getNewItem());
			iData.items[0].line = 0;
			//iData.items.splice(0, 0, that._getNewItem());
			sap.ui.core.BusyIndicator.hide();
			//oSource.setEnabled(true);
			//});
		}

	});
});