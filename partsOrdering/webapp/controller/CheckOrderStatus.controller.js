sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/MessageToast',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"tci/wave2/ui/parts/ordering/model/formatter",
	'sap/ui/model/Sorter'
], function (BaseController, MessagePopover, MessageItem, MessageToast, Link, JSONModel, formatter, Sorter) {
	"use strict";

	var CONST_VIEW_MODEL = 'viewModel';
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CheckOrderStatus", {

		formatter: formatter,

		onInit: function () {
			var that = this;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("CheckOrderStatus").attachPatternMatched(this._onObjectMatched, this);

			// default mode
			var appStateModel = this.getStateModel();
			this.getView().setModel(appStateModel);

			//message
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(oMessageManager.getMessageModel(), "message");
			// or just do it for the whole view
			oMessageManager.registerObject(this.getView(), true);

			if (!this._oResponsivePopover) {
				this._oResponsivePopover = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.OrderStatusQtySort", this);
				//this._oResponsivePopover.setModel(this.getView().getModel());
			};

			var viewState = {
				filteredItems: 0,
				filterPanelEnable: true,
				contHigh: "40%",
				sortDescending: false,
				sortKey: 'TCI_order_no',
				orders: [],
				filters: this.getDefaultFilterValues(),
				filterAll: true,
				filterAllx: true
			};
			var viewModel = new JSONModel();
			viewModel.setData(viewState);
			this.setModel(viewModel, CONST_VIEW_MODEL);

			this._oList = this.byId('idProductsTable');
			this._oFilterTciOrderNumber = this.byId('tciOrderNumberFilter');
			this._oFilterDeleveryNumber = this.byId('deleveryNumberFilter');
			this._oFilterFiNumber = this.byId('fiNumberFilter');
			this._fromDate = this.byId('dateFrom');
			this._toDate = this.byId('dateTo');
			var that = this;
			var userProfile = appStateModel.getProperty('/userProfile');

			var bpCode = null;
			var userType = null;
			var dealerType = null;
			var zGroup = null;
			if (userProfile.userType !== "National" && userProfile.userType.toUpperCase() !== "ZONE") {
				this.getBusinessPartnersByDealerCode(userProfile.dealerCode, function (sData) {
					bpCode = sData.BusinessPartner;
					appStateModel.setProperty('/selectedBP/bpNumber', bpCode);

					//appStateModel.setProperty('/selectedBP/bpName', sData.BusinessPartnerName);
					appStateModel.setProperty('/selectedBP/bpName', sData.OrganizationBPName1);
					appStateModel.setProperty('/selectedBP/dealerCode', userProfile.dealerCode);

					appStateModel.setProperty('/selectedBP/customer', sData.Customer);

					zGroup = sData.BusinessPartnerType;
					dealerType = sData.to_Customer.Attribute1;
					appStateModel.setProperty('/selectedBP/bpType', dealerType);
					appStateModel.setProperty('/selectedBP/bpGroup', zGroup);

					// get the user type
					//Debugging
					//userProfile.userType = "Dealer";
					userType = that.getInternalUserType(userProfile.userType, zGroup);
					appStateModel.setProperty('/userInfo/userType', userType);
					that._onObjectMatched();
				});

			} else {
				that._onObjectMatched();
			}
			var oTable = this.getView().byId("idProductsTable");
			oTable.addEventDelegate({
				onAfterRendering: function () {
					var oHeader = this.$().find('.sapMColumnHeaderContent'); //Get hold of table header elements
					for (var i = 0; i < oHeader.length; i++) {
						var oID = oHeader[i].id;
						that.onClick(oID);
					}
				}
			}, oTable);

			this._oList.addEventDelegate({
				onAfterRendering: function () {
					var oHeader = this.$().find('.sapMListTblHeaderCell'); //Get hold of table header elements
					for (var i = 0; i < oHeader.length; i++) {
						var oID = oHeader[i].id;
						that.onClick(oID);
					}
				}
			}, this._oList);

		},

		getDealersForTCIUser: function () {
			this.getView().byId("cb_filterDealer").setBusy(true);
			var oFilter = new Array();
			var that = this;
			oFilter[1] = new sap.ui.model.Filter("zstatus", sap.ui.model.FilterOperator.NE, 'X');
			oFilter[0] = new sap.ui.model.Filter(
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
					//"$expand": "to_Customer",
					"$orderby": "BusinessPartner asc"
				},
				success: function (oData, oResponse) {

					if (!!oData && !!oData.results && oData.results.length > 0) {
						var BpDealer = [];
						for (var x1 = 0; x1 < oData.results.length; x1++) {

							var item = oData.results[x1];

							BpDealer.push({
								"BusinessPartnerKey": item.BusinessPartner,
								"BusinessPartner": item.BusinessPartner.substring(5, item.BusinessPartner.length), //.substring(5, BpLength),
								"BusinessPartnerName": item.OrganizationBPName1, //item.OrganizationBPName1 //item.BusinessPartnerFullName
								"OrganizationBPName1": item.OrganizationBPName1,
								"BusinessPartnerType": item.BusinessPartnerType
							});

						}
					}
					that.getView().setModel(new sap.ui.model.json.JSONModel(BpDealer), "BpDealerModel");
					that.getView().byId("cb_filterDealer").setBusy(false);
				},
				error: function (err) {
					that.getView().byId("cb_filterDealer").setBusy(false);
					// error handling here
					//callback(null);
				}
			});
		},

		onBusinessPartnerSelected: function (oEvent) {
			var oSource = oEvent.getSource();
			var selectedDealer = oSource.getSelectedKey();
			var oContext = oEvent.getSource().getSelectedItem().getBindingContext("BpDealerModel");
			var oObject = oContext.getObject();
			if (oObject.BusinessPartnerType === "Z004") { //PO/STO
				this.getView().getModel().setProperty("/filters/dealer", oObject.BusinessPartner);
			} else {
				this.getView().getModel().setProperty("/filters/dealer", selectedDealer);
			}
			var appStateModel = this.getStateModel();
			appStateModel.setProperty("/selectedBP/bpName", oObject.OrganizationBPName1);
			appStateModel.setProperty("/selectedBP/dealerCode", oObject.BusinessPartner);
			appStateModel.setProperty('/selectedBP/bpGroup', oObject.BusinessPartnerType);
			appStateModel.setProperty('/selectedBP/bpNumber', selectedDealer);
		},

		onFilterChange: function (oEvent) {
			var shouldExclude = false;
			var lc_value = this._oFilterTciOrderNumber.getValue().trim();
			if (!!lc_value) {
				shouldExclude = true;
			}

			lc_value = this._oFilterDeleveryNumber.getValue().trim();
			if (!!lc_value) {
				shouldExclude = true;
			}

			lc_value = this._oFilterFiNumber.getValue().trim();
			if (!!lc_value) {
				shouldExclude = true;
			}

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			if (!!shouldExclude) {
				viewModel.setProperty('/filterAll', false);
			} else {
				viewModel.setProperty('/filterAll', true);
			}
		},

		getDefaultFilterValues: function () {
			return {
				partsStates: ['ALL'],
				orderStates: [0],
				partNumber: '',
				deleveryNumber: '',
				fiNumber: '',
				dealer: '',
				superUsrer: "false",
				orderNumber: '',
				tciOrderNumber: '',
				fromOrderDate: '',
				toOrderDate: ''
			};
		},

		onConfirmViewSettingsDialog: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			if (sPath === "est_deliv_date") {
				var mySorter = new sap.ui.model.Sorter(sPath, bDescending);
				mySorter.fnCompare = function (a, b) {
					var date1, date2;
					if (a === "") {
						date1 = new Date(0);
					} else {
						if (a.charAt(0) === "+") {
							date1 = new Date(a.substring(2, 6), a.substring(6, 8) - 1, a.substring(8, 10));
						} else {
							date1 = new Date(a.substring(0, 4), a.substring(4, 6) - 1, a.substring(6, 8));
						}
					}
					if (b === "") {
						date2 = new Date(0);
					} else {
						if (b.charAt(0) === "+") {
							date2 = new Date(b.substring(2, 6), b.substring(6, 8) - 1, b.substring(8, 10));
						} else {
							date2 = new Date(b.substring(0, 4), b.substring(4, 6) - 1, b.substring(6, 8));
						}
					}

					if (date1 > date2) {
						return 1;
					} else if (date1 < date2) {
						return -1;
					} else {
						return 0;
					}
				};
				aSorters.push(mySorter);
			} else {
				aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			}
			//aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		// 	onConfirmViewSettingsDialog: function (oEvent) {
		// 	var mParams = oEvent.getParameters(),
		// 		sPath,
		// 		bDescending,
		// 		aSorters = [];
		// 	sPath = mParams.sortItem.getKey();
		// 	bDescending = mParams.sortDescending;
		// 	aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
		// 	this._oList.getBinding("items").sort(aSorters);
		// },

		onSetting: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.CosViewSettingsDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.setModel(this.getView().getModel());
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},

		onDialogClose: function (oEvent) {
			if (!!this._oDetailDialog) {
				this._oDetailDialog.close();
			}
		},

		afterDialogOpen: function (oEvent) {
			if (!!this._oDetailDialog) {
				sap.ui.getCore().byId('topPageHeader').focus();
			}
		},

		onSelectChangeOT: function (oEvent) {
			var currentKey = oEvent.getParameters('changedItem').changedItem.getKey();
			var state = oEvent.getParameters('changedItem').selected;
			if (!!state) { // only for the selected

				if ('0' === currentKey) {
					oEvent.getSource().setSelectedKeys(['0']);
				} else {
					var keys = oEvent.getSource().getSelectedKeys();
					var index = keys.indexOf('0');
					if (index >= 0) {
						keys = keys.splice(index + 1);
						oEvent.getSource().setSelectedKeys(keys);
					}
				}
			}
		},

		onSelectChangeOS: function (oEvent) {
			var currentKey = oEvent.getParameters('changedItem').changedItem.getKey();
			var state = oEvent.getParameters('changedItem').selected;
			if (!!state) { // only for the selected

				if ('ALL' === currentKey) {
					oEvent.getSource().setSelectedKeys(['ALL']);
				} else {
					var keys = oEvent.getSource().getSelectedKeys();
					var index = keys.indexOf('ALL');
					if (index >= 0) {
						keys = keys.splice(index + 1);
						oEvent.getSource().setSelectedKeys(keys);
					}
				}
			}
		},

		getRunningDefaultFilterValues: function () {
			var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyyMMdd"
			});
			var appStateModel = this.getStateModel();
			var dealerCode;
			if (this.getView().byId("cb_filterDealer").getVisible()) {
				dealerCode = this.getView().byId("cb_filterDealer").getSelectedKey();
			} else {
				dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
			}
			var nowDate = new Date();
			// //				var fromMonth = nowDate.getMonth() + 1 -3; // three months
			// 				var fromYear = nowDate.getFullYear();
			// 				if (fromMonth < 0){
			// 					fromMonth = fromMonth + 12;
			// 					fromYear = fromYear -1;
			// 				}
			// 				var fromDate = new Date(fromYear,fromMonth,nowDate.getDate());
			var timelong = nowDate.getTime() - (15 * 1000 * 60 * 60 * 24);
			var fromDate = new Date(timelong);
			//var fromDateStr = ''+fromYear+fromMonth+nowDate.getDate();
			return {
				partsStates: ['ALL'],
				orderStates: [0],
				partNumber: '',
				deleveryNumber: '',
				fiNumber: '',
				dealer: dealerCode,
				superUsrer: "false",
				orderNumber: '',
				tciOrderNumber: '',
				fromOrderDate: dateFormat.format(fromDate),
				toOrderDate: dateFormat.format(nowDate)
			};
		},

		_onObjectMatched: function (oEvent) {
			// first, clean the message
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var resourceBundle = this.getResourceBundle();
			var appStateModel = this.getStateModel();
			var filterModel = this.getModel('filterModel');
			appStateModel.setProperty('/tabKey', 'CS');
			if (appStateModel.getProperty('/userProfile').userType === "National" || appStateModel.getProperty('/userProfile').userType.toUpperCase() ===
				"ZONE") {

				this.getView().byId("fi_Dealer").setVisible(true);
				this.getView().byId("cb_filterDealer").setVisible(true);
				this.getView().byId("Itf_CreateOrder").setVisible(false);
				this.getView().byId("Itf_FindOrder").setVisible(false);

				if (!this.getView().getModel("BpDealerModel")) {
					this.getDealersForTCIUser();
				}
			} else {
				if (!this.checkDealerInfo()) {
					return;
				}
				//var otList = this.getCurrentOrderTypeList().getData();
				this.getView().byId("fi_Dealer").setVisible(false);
				this.getView().byId("cb_filterDealer").setVisible(false);
				this.getView().byId("Itf_CreateOrder").setVisible(true);
				this.getView().byId("Itf_FindOrder").setVisible(true);
				if (this.getCurrentOrderTypeList()) {
					var otList = this.getCurrentOrderTypeList().getData();
					var newList = [{
						code: 0,
						name: resourceBundle.getText('Parts.Status.All')
					}];
					newList = newList.concat(otList.typeList);
					filterModel.setProperty('/orderTypeList', newList);
				}
			}

			// dynamic the type list 

			if (!!!filterModel) {
				filterModel = this.getFilterSelectionModel();
				this.setModel(filterModel, 'filterModel');
			}

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			viewModel.setProperty('/filters', this.getRunningDefaultFilterValues());

			//this.refresh(); //No initial loading of table 
		},

		onClick: function (oID) {
			var that = this;
			$('#' + oID).click(function (oEvent) { //Attach Table Header Element Event
				var oTarget = oEvent.currentTarget; //Get hold of Header Element
				var oLabelText = oTarget.childNodes[0].textContent; //Get Column Header text
				var oIndex = oTarget.id.slice(-1); //Get the column Index
				var oView = that.getView();
				var oModel = that._oList.getModel().getProperty("/orders"); //Get Hold of Table Model Values
				var oKeys = Object.keys(oModel[0]); //Get Hold of Model Keys to filter the value
				oView.getModel().setProperty("/bindingValue", oKeys[oIndex]); //Save the key value to property
				that._oResponsivePopover.openBy(oTarget);
			});
		},

		onAscending: function () {
			//var oTable = this.getView().byId("idProductsTable");
			var oItems = this._oList.getBinding("items");
			var oBindingPath = this.getView().getModel().getProperty("/bindingValue");
			var oSorter = new Sorter(oBindingPath);
			oItems.sort(oSorter);
			this._oResponsivePopover.close();
		},

		onDescending: function () {
			var oItems = this._oList.getBinding("items");
			var oBindingPath = this.getView().getModel().getProperty("/bindingValue");
			var oSorter = new Sorter(oBindingPath, true);
			oItems.sort(oSorter);
			this._oResponsivePopover.close();
		},

		onOpen: function (oEvent) {
			//On Popover open focus on Input control
			var oPopover = sap.ui.getCore().byId(oEvent.getParameter("id"));
			var oPopoverContent = oPopover.getContent()[0];
			var oCustomListItem = oPopoverContent.getItems()[2];
			var oCustomContent = oCustomListItem.getContent()[0];
			var oInput = oCustomContent.getItems()[1];
			oInput.focus();
			oInput.$().find('.sapMInputBaseInner')[0].select();
		},

		onMasterSelected: function (oEvent) {
			var that = this;
			var sPath = null;
			if (!this._oDetailDialog) {
				this._oDetailDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.CosDetails", this);
				this.getView().addDependent(this._oDetailDialog);
			}
			var sPathList = oEvent.getSource().getSelectedContextPaths();
			if (!!sPathList && sPathList.length > 0) {
				sPath = sPathList[0];
			}
			var theData = this.getModel(CONST_VIEW_MODEL).getProperty(sPath);

			//this._oDetailDialog.bindElement("viewModel>" +sPath);
			var aModel = new JSONModel();
			aModel.setData(theData);
			// call a server to get the desc

			this.getMaterialDesc(theData.matnr, 0, function (index, desc) {
				theData.partdesc = desc;
				that._oDetailDialog.setModel(aModel);
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), that._oDetailDialog);
				that._oDetailDialog.open();
			});

		},

		cleanUpDialog: function (oEvent) {
			this.byId('idProductsTable').removeSelections(true);
		},

		removeSpaceDash: function (oEvent) {
			var oSource = oEvent.getSource();
			var spartNumber = oSource.getValue();
			spartNumber = spartNumber.trim();
			if (spartNumber.length > 0) {
				spartNumber = spartNumber.toString().replace(/-/g, "");
				spartNumber = spartNumber.toUpperCase();
			}
			oSource.setValue(spartNumber);
		},

		onReset: function (oEvent) {
			var viewModel = this.getModel(CONST_VIEW_MODEL);
			viewModel.setProperty('/filters', this.getRunningDefaultFilterValues());
			viewModel.setProperty('/filterAll', true);
		},

		onSearch: function (oEvent) {
			var query = oEvent.getParameters('query').query;

			this.refresh(query);
		},

		onLiveChange: function (oEvent) {
			var sQuery = oEvent.getSource().getValue().trim();
			sQuery = sQuery.toString().replace(/-/g, "");
			oEvent.getSource().setValue(sQuery);

			var aFilters = [];
			var orFilters = [];
			var filter = null;
			if (!!sQuery && sQuery.length > 0) {
				filter = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, sQuery);
				orFilters.push(filter);
				filter = new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.Contains, sQuery);
				orFilters.push(filter);
				filter = new sap.ui.model.Filter("deliv_no_str", sap.ui.model.FilterOperator.Contains, sQuery);
				orFilters.push(filter);
				filter = new sap.ui.model.Filter("bill_no_str", sap.ui.model.FilterOperator.Contains, sQuery);
				orFilters.push(filter);
				filter = new sap.ui.model.Filter("dealer_orderNo", sap.ui.model.FilterOperator.EQ, sQuery);
				orFilters.push(filter);
				filter = new sap.ui.model.Filter("ship_from", sap.ui.model.FilterOperator.Contains, sQuery);
				orFilters.push(filter);

				filter = new sap.ui.model.Filter({
					filters: orFilters,
					and: false
				});
				aFilters.push(filter);
			} else {
				//TODO
			}

			// update list binding
			var list = this.byId("idProductsTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			viewModel.setProperty('/filteredItems', binding.getLength());

		},

		refresh: function (query) {
			var that = this;
			//take the existing conditions get the data
			var appStateModel = this.getStateModel();
			//var oItem = this.byId('iconTabHeader');

			var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');

			var bpCode = appStateModel.getProperty('/selectedBP/bpNumber');
			var ztype = appStateModel.getProperty('/selectedBP/bpGroup');
			var isSalesOrder = that.isSalesOrderAssociated(ztype);
			var viewModel = this.getModel(CONST_VIEW_MODEL);

			sap.ui.core.BusyIndicator.show(0);

			var conditions = {};
			if (!!isSalesOrder) {
				conditions.bpCode = bpCode;
			} else {
				conditions.bpCode = dealerCode;
			}

			//		var viewModel = this.getModel(CONST_VIEW_MODEL);
			var filters = viewModel.getProperty('/filters');
			var filterAll = viewModel.getProperty('/filterAll');
			var lc_index = -1;
			var exactMode = !filterAll;
			if (!!filters) {
				if (!!filters.partNumber && filters.partNumber.trim().length > 0) {
					conditions.partNumber = filters.partNumber.trim();
					conditions.partNumber = conditions.partNumber.toUpperCase();
				}
				if (!!filters.deleveryNumber && filters.deleveryNumber.trim().length > 0) {
					conditions.deleveryNumber = filters.deleveryNumber.trim();
				}
				if (!!filters.fiNumber && filters.fiNumber.trim().length > 0) {
					conditions.fiNumber = filters.fiNumber.trim();
				}
				if (!!filters.orderNumber && filters.orderNumber.trim().length > 0) {
					conditions.orderNumber = filters.orderNumber.trim();
				}
				if (!!filters.tciOrderNumber && filters.tciOrderNumber.trim().length > 0) {
					conditions.tciOrderNumber = filters.tciOrderNumber.trim();
				}
				conditions.fromOrderDate = filters.fromOrderDate;
				conditions.toOrderDate = filters.toOrderDate;

				if (conditions.toOrderDate === "" && conditions.fromOrderDate !== "") {
					conditions.toOrderDate = conditions.fromOrderDate;
					viewModel.setProperty("/filters/toOrderDate", conditions.fromOrderDate);
				} else if (conditions.fromOrderDate === "" && conditions.toOrderDate !== "") {
					conditions.fromOrderDate = conditions.toOrderDate;
					viewModel.setProperty("/filters/fromOrderDate", conditions.toOrderDate);
				} else if (conditions.fromOrderDate === "" && conditions.toOrderDate === "") {
					var date = new Date();
					var year = date.getFullYear();
					var month = date.getMonth();

					if (month < 10) {
						month = "0" + month;
					}
					var day = date.getDate();

					if (day < 10) {
						day = "0" + day;
					}
					conditions.toOrderDate = year + month + day;
					viewModel.setProperty("/filters/toOrderDate", year + month + day);
					date.setMonth(month - 3);
					month = date.getMonth();

					if (month < 10) {
						month = "0" + month;
					};
					year = date.getFullYear();
					conditions.fromOrderDate = year + month + day;
					viewModel.setProperty("/filters/fromOrderDate", year + month + day);

				}

				// the ALL will not put new condition to the search query
				if (!!filters.partsStates) {
					lc_index = filters.partsStates.indexOf('ALL');
					if (lc_index < 0) { // can not find
						conditions.partsStates = filters.partsStates;
					}
				}
				if (!!filters.orderStates) {
					lc_index = filters.orderStates.indexOf('0');
					if (lc_index < 0) { // can not find
						conditions.orderStates = filters.orderStates;
					}
				}
			}
			if (!!conditions.bpCode && conditions.bpCode !== "") {
				this.searchPartsOrders(exactMode, conditions, isSalesOrder, function (results) {
					viewModel.setProperty('/orders', results);

					var list = that.byId("idProductsTable");
					var binding = list.getBinding("items");
					var afilters = [];
					binding.afilters = null;
					binding.oCombinedFilter = null;
					binding.filter(null);
					if (!!filters.partNumber && filters.partNumber.trim().length > 0) {
						var filter = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.EQ, filters.partNumber);
						//binding.filter(filter, true);
						afilters.push(filter);
						//conditions.partNumber = filters.partNumber.trim();
					}

					if (!!filters.partsStates && filters.partsStates.length > 0) {

						for (var x1 = 0; x1 < filters.partsStates.length; x1++) {
							switch (filters.partsStates[x1]) {
							case 'IP':
								afilters.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.GT, 0.00));
								break;
							case 'PR':
								afilters.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.GT, 0.00));
								break;
							case 'CL':
								afilters.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.GT, 0.00));
								break;
							case 'BK':
								afilters.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.GT, 0.00));
								break;
							case 'QtOp':
								afilters.push(new sap.ui.model.Filter("open_qty", sap.ui.model.FilterOperator.GT, 0.00));
								break;
							case 'OpOR':
								afilters.push(new sap.ui.model.Filter("quant_back_ordered", sap.ui.model.FilterOperator.EQ, 0.00));
								afilters.push(new sap.ui.model.Filter("quant_cancelled", sap.ui.model.FilterOperator.EQ, 0.00));
								afilters.push(new sap.ui.model.Filter("quant_processed", sap.ui.model.FilterOperator.EQ, 0.00));
								afilters.push(new sap.ui.model.Filter("quant_in_process", sap.ui.model.FilterOperator.EQ, 0.00));
								// afilters.push(new sap.ui.model.Filter("quant_ordered", sap.ui.model.FilterOperator.NE, 0.00));
								afilters.push(new sap.ui.model.Filter("open_qty", sap.ui.model.FilterOperator.EQ, 0.00));
								break;
							}
						}
						//var aFilter = new sap.ui.model.Filter(partsSts, false);
						//oFilter.push(aFilter);

					}
					if (afilters.length > 0) {
						binding.filter(afilters, true);
					}
					viewModel.setProperty('/filteredItems', binding.getLength());

					sap.ui.core.BusyIndicator.hide();
				});
			} else {
				sap.ui.core.BusyIndicator.hide();
			}
		},

		onExpandFilter: function (oEvevt) {
			var viewModel = this.getModel(CONST_VIEW_MODEL);
			var togglePanel = viewModel.getProperty('/filterPanelEnable');
			var togglePanel = !togglePanel;
			var filterButton = this.byId('filterButton');
			if (togglePanel) {
				filterButton.setIcon('sap-icon://collapse');
				viewModel.setProperty('/contHigh', "40%");
			} else {
				filterButton.setIcon('sap-icon://add-filter');
				viewModel.setProperty('/contHigh', "80%");
			}
			viewModel.setProperty('/filterPanelEnable', togglePanel);

		},
		// CR1044- Export To excel Functionlity
		onDataExport: function (oEvent) {
			var data;
			if (this.getView().getModel("viewModel") != undefined) {
				data = this.getView().getModel("viewModel").getData();
			} else {
				data = this.getView().byId("idProductsTable").getModel("viewModel").getData();
			}
			this.JSONToExcelConvertor(data, "Report", true);
		},
		estDateFormat: function (inDate) {
			// var inDate = "+ 20200314";
			/* alert(inDate); */
			// alert(inDate.indexOf("+"));
			var outDate = "";
			if (inDate !== "") {
				if (inDate.indexOf("+") >= 0) {
					var onlyDate = inDate.slice(2, 10);
					// alert(onlyDate);
					var sYear = onlyDate.slice(0, 4);
					// alert(sYear);
					var sMonth = onlyDate.slice(4, 6) - 1;
					// alert(sMonth);
					var sDate = onlyDate.slice(6, 8);
					// alert(sDate);
					var formattedDate = new Date(sYear, sMonth, sDate);
					// alert(formattedDate);
					var strDate = formattedDate.toString();
					// alert(formattedDate.toString().slice(4, 15));
					// var outDate = "+ " + strDate.slice(11,15) + " " + strDate(4,7) + " ," + strDate (8,10);
					if (onlyDate) {
						outDate = "+ " + strDate.slice(4, 7) + " " + strDate.slice(8, 10) + ", " + strDate.slice(11, 15);
					} else {
						outDate = "+ ";
					}
					// alert(outDate);
				} else {
					var onlyDate = inDate.slice(0, 8);
					// alert(onlyDate);
					var sYear = onlyDate.slice(0, 4);
					// alert(sYear);
					var sMonth = onlyDate.slice(4, 6) - 1;
					// alert(sMonth);
					var sDate = onlyDate.slice(6, 8);
					// alert(sDate);
					var formattedDate = new Date(sYear, sMonth, sDate);
					// alert(formattedDate);
					var strDate = formattedDate.toString();
					// alert(formattedDate.toString().slice(4, 15));
					//var outDate =strDate.slice(11,15) + " " + strDate.slice(4,7) + " ," + strDate.slice(8,10);
					outDate = strDate.slice(4, 7) + " " + strDate.slice(8, 10) + ", " + strDate.slice(11, 15);
					// alert(outDate);
				}
			}
			return outDate;

		},
		OrdDatFormat: function (orDate) {
			var sDate = "";
			if (orDate !== "") {
				// alert(myDate);
				var sYear = orDate.substr(0, 4);
				// alert(myYear);
				var sMon = orDate.substr(4, 2);
				// alert(myMon);
				if (sMon.substr(0, 1) == "0") {
					sMon = sMon.substr(1, 1);
				} else {
					// alert(sMon);
					sMon=sMon;
				}
				var sDay = orDate.substr(6, 2);
				// alert(myDay);
				var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				// alert(monthNames[myMon - 1]);
				// alert(monthNames[myMon - 1] + " " + myDay + "," + myYear);
				sDate = monthNames[sMon - 1] + " " + sDay + "," + sYear;
			}
			return sDate;

		},

		JSONToExcelConvertor: function (JSONData, ReportTitle, ShowLabel) {
			var arrData = typeof JSONData.orders != 'object' ? JSON.parse(JSONData.orders) : JSONData.orders;
			var CSV = "";
			if (ShowLabel) {
				var row = "";
				row = row.slice(0, -1);
			}

			row += this.getResourceBundle().getText("Label.CheckOrder.PartNumber") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.LineItem") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.Ordered") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.InProcess") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.Processed") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.Cancelled") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.BackOrdered") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Quantity.Open") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Estimated.Delivery.Date") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.DealerOrder") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.TciOrder") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.OrderType") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.ShipFrom") + ",";
			row += this.getResourceBundle().getText("Label.CheckOrder.Order.Date") + ",";
			// row += _thatDT.oI18nModel.getResourceBundle().getText("CustomerName") + ",";

			CSV += row + '\r\n';

			// loop is to extract each row
			for (var i = 0; i < arrData.length; i++) {
				var row = "";
				row += '="' + arrData[i].matnr + '","' + arrData[i].TCI_itemNo + '","' + arrData[i].quant_ordered +
					'","' + arrData[i].quant_in_process + '","' + arrData[i].quant_processed + '","' + arrData[i].quant_cancelled + '","' + arrData[i]
					.quant_back_ordered + '","' +
					arrData[i].open_qty + '","' + this.estDateFormat(arrData[i].est_deliv_date) + '","' + arrData[i].dealer_orderNo + '","' + arrData[
						i]
					.TCI_order_no + '","' + arrData[i].doc_type + '","' + arrData[i].ship_from + '","' + this.OrdDatFormat(arrData[i].erdat) + '",';
				//}
				row.slice(1, row.length);
				CSV += row + '\r\n';
			}
			if (CSV == "") {
				alert("Invalid data");
				return;
			}
			var fileName = this.getResourceBundle().getText("Label.CheckOrderStatus");
			fileName += ReportTitle.replace(/ /g, "_");
			// Initialize file format you want csv or xls

			var blob = new Blob(["\ufeff" + CSV], {
				type: "text/csv;charset=utf-8,"
			});
			if (sap.ui.Device.browser.name === "ie" || sap.ui.Device.browser.name === "ed") { // IE 10+ , Edge (IE 12+)
				navigator.msSaveBlob(blob, this.getResourceBundle().getText("Label.CheckOrderStatus") + ".csv");
			} else {
				var uri = 'data:text/csv;charset=utf-8,' + "\ufeff" + encodeURIComponent(CSV); //'data:application/vnd.ms-excel,' + escape(CSV);
				var link = document.createElement("a");

				link.href = uri;
				link.style = "visibility:hidden";
				link.download = fileName + ".csv";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}

	});
});