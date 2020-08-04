sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"tci/wave2/ui/parts/ordering/model/formatter"
], function (BaseController, MessagePopover, MessageItem, Link, JSONModel, formatter) {
	"use strict";
	var CONST_VIEW_MODEL = 'viewModel';
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.FindOrder", {

		formatter: formatter,

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("FindOrder").attachPatternMatched(this._onObjectMatched, this);

			// default mode
			var appStateModel = this.getStateModel();
			this.setModel(appStateModel);

			//message
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(oMessageManager.getMessageModel(), "message");
			// or just do it for the whole view
			oMessageManager.registerObject(this.getView(), true);

			this.orderTypeSelection = this.byId("orderType");
			this.orderNumberSearch = this.byId('oidSearch');
			//view model 
			var viewState = {
				rowStateMessageVsbl: false,
				filterPanelEnable: false,
				filteredItems: 0,
				filters: {
					orderStates: [0]
				},
				sortDescending: true,
				orderTypeList: [],
				contHigh: "85%",
				orders: []
			};
			var viewModel = new JSONModel();
			viewModel.setData(viewState);
			this.setModel(viewModel, CONST_VIEW_MODEL);

			this._oList = this.byId('idProductsTable');
			this.checkDealerInfo();

		},

		_onObjectMatched: function (oEvent) {
		
			// default mode
			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (!this.checkDealerInfo()) {
				return;
			}

			//this.orderTypeSelection.setSelectedKeys(['1']);
			//this.orderTypeSelection.setEnabled(false);
			var appStateModel = this.getStateModel();
			appStateModel.setProperty('/tabKey', 'FO');

			this.setModel(appStateModel);
			this.refresh(this.orderNumberSearch.getValue());
			var bpGroup = appStateModel.getProperty('/selectedBP/bpGroup');

			if (this.isSalesOrderAssociated(bpGroup)) {
				this.getModel(CONST_VIEW_MODEL).setProperty("/rowStateMessageVsbl", true);
			} else {
				this.getModel(CONST_VIEW_MODEL).setProperty("/rowStateMessageVsbl", false);
			}

			var otList = this.getCurrentOrderTypeList().getData();
			var resourceBundle = this.getResourceBundle();
			var newList = [{
				code: 0,
				name: resourceBundle.getText('Parts.Status.All')
			}];
			newList = newList.concat(otList.typeList);

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			viewModel.setProperty('/filters', {
				orderStates: [0]
			});
			viewModel.setProperty('/orderTypeList', newList);
			viewModel.setProperty('/orderStatusList', [
				{
					StatusCode : "N", 
					StatusName : resourceBundle.getText('Parts.Status.All')
				},
				{
					StatusCode : "D", 
					StatusName : resourceBundle.getText('Order.Status.Draft')
				},
				{
					StatusCode : "E", 
					StatusName : resourceBundle.getText('Order.Status.Error')
				}
				
			]);
			
			this.byId("orderStatusType").setSelectedKey("N");

		},

		onSelectChangeOT: function (oEvent) {
			//var currentKey = oEvent.getParameters('changedItem').changedItem.getKey();
			var state = oEvent.getSource().getSelectedKey();
			if (!!state) { // only for the selected

				// if ('0' === currentKey) {
				// 	oEvent.getSource().setSelectedKeys(['0']);
				// } else {
				// 	var keys = oEvent.getSource().getSelectedKeys();
				// 	var index = keys.indexOf('0');
				// 	if (index >= 0) {
				// 		keys = keys.splice(index + 1);
				// 		oEvent.getSource().setSelectedKeys(keys);
				// 	}

				var SelectedOrderType = oEvent.getSource().getSelectedKey();
				var aFilters = [];
				var filter = null;
				if (!!SelectedOrderType && SelectedOrderType.length > 0) {
					if (SelectedOrderType === "0") {
						this.refresh(this.orderNumberSearch.getValue());
					} else {
						filter = new sap.ui.model.Filter("scOrderType", sap.ui.model.FilterOperator.Contains, SelectedOrderType);
						aFilters.push(filter);
					}
				}

				// update list binding
				var binding = this._oList.getBinding("items");
				binding.filter(aFilters, "Application");

				var viewModel = this.getModel(CONST_VIEW_MODEL);
				viewModel.setProperty('/filteredItems', binding.getLength());

				/////////////////
				// var sQuery = oEvent.getSource().getValue();

				// var aFilters = [];
				// var filter = null;
				// if (!!sQuery && sQuery.length > 0) {
				// 	filter = new sap.ui.model.Filter("orderNumber", sap.ui.model.FilterOperator.Contains, sQuery);
				// 	aFilters.push(filter);
				// } else {
				// 	
				// }

				// // update list binding
				// var binding = this._oList.getBinding("items");
				// binding.filter(aFilters, "Application");

				// var viewModel = this.getModel(CONST_VIEW_MODEL);
				// viewModel.setProperty('/filteredItems', binding.getLength());
				///////////////////////
			}
		},
		
		onSelectChangeST : function(oEvent){
				var state = oEvent.getSource().getSelectedKey();
			if (!!state) { // only for the selected

				// if ('0' === currentKey) {
				// 	oEvent.getSource().setSelectedKeys(['0']);
				// } else {
				// 	var keys = oEvent.getSource().getSelectedKeys();
				// 	var index = keys.indexOf('0');
				// 	if (index >= 0) {
				// 		keys = keys.splice(index + 1);
				// 		oEvent.getSource().setSelectedKeys(keys);
				// 	}

				var SelectedOrderType = oEvent.getSource().getSelectedKey();
				var aFilters = [];
				var filter = null;
				if (!!SelectedOrderType && SelectedOrderType.length > 0) {
					if (SelectedOrderType === "N") {
						this.refresh(this.orderNumberSearch.getValue());
					} else {
						filter = new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, SelectedOrderType);
						aFilters.push(filter);
					}
				}

				// update list binding
				var binding = this._oList.getBinding("items");
				binding.filter(aFilters, "Application");

				var viewModel = this.getModel(CONST_VIEW_MODEL);
				viewModel.setProperty('/filteredItems', binding.getLength());

				/////////////////
				// var sQuery = oEvent.getSource().getValue();

				// var aFilters = [];
				// var filter = null;
				// if (!!sQuery && sQuery.length > 0) {
				// 	filter = new sap.ui.model.Filter("orderNumber", sap.ui.model.FilterOperator.Contains, sQuery);
				// 	aFilters.push(filter);
				// } else {
				// 	
				// }

				// // update list binding
				// var binding = this._oList.getBinding("items");
				// binding.filter(aFilters, "Application");

				// var viewModel = this.getModel(CONST_VIEW_MODEL);
				// viewModel.setProperty('/filteredItems', binding.getLength());
				///////////////////////
			}
		},

		onConfirmViewSettingsDialog: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		onAdd: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getRouter().navTo("StartOrdering", null, false);
		},

		onEdit: function (oEvent) {
			var model = this.getModel(CONST_VIEW_MODEL);
			var path = oEvent.getSource().getBindingContext(CONST_VIEW_MODEL).getPath();
			var obj = model.getProperty(path);

			sap.ui.getCore().getMessageManager().removeAllMessages();
			if (obj.isSalesOrder) {
				this.getRouter().navTo("CreateOrder", {
					orderNum: obj.uuid,
					orderType: '-1'
				});
			} else {
				this.getRouter().navTo("CreateOrder", {
					orderNum: obj.orderNumber,
					orderType: obj.scOrderType
				});
			}
		},

		onLiveChange: function (oEvent) {
			var sQuery = oEvent.getSource().getValue();

			// var aFilters = [];
			// var filter = null;
			// if (!!sQuery && sQuery.length > 0) {
			// 	filter = new sap.ui.model.Filter("orderNumber", sap.ui.model.FilterOperator.Contains, sQuery);
			// 	aFilters.push(filter);
			// } else {
			// 	//TODO
			// }

			// // update list binding
			// var binding = this._oList.getBinding("items");
			// binding.filter(aFilters, "Application");

			// var viewModel = this.getModel(CONST_VIEW_MODEL);
			// viewModel.setProperty('/filteredItems', binding.getLength());

		},

		onSearch: function (oEvent) {
			var sQuery = oEvent.getParameters('query').query;
			// this.refresh(query);

			var that = this;
			var appStateModel = this.getStateModel();
			//var oItem = this.byId('iconTabHeader');
			var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
			var bpCode = appStateModel.getProperty('/selectedBP/bpNumber');
			var bpGroup = appStateModel.getProperty('/selectedBP/bpGroup');

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			//var filters = viewModel.getProperty('/filters');
			var conditions = {};
			conditions.orderNumber = sQuery;
			//var lc_index = -1;
			// if (!!filters.orderStates) {
			// 	lc_index = filters.orderStates.indexOf('0');
			// 	if (lc_index < 0) { // can not find
			// 		conditions.orderStates = filters.orderStates;
			// 	}
			// }

			sap.ui.core.BusyIndicator.show(0);

			this.searchDraftByDealerCode(dealerCode, bpCode, bpGroup, conditions, function (results) {
				viewModel.setProperty('/orders', results);
				var binding = that._oList.getBinding("items");
				viewModel.setProperty('/filteredItems', binding.getLength());
				sap.ui.core.BusyIndicator.hide();
			});
		},

		refresh: function (query) {
			//take the existing conditions get the data
			var that = this;
			var appStateModel = this.getStateModel();
			//var oItem = this.byId('iconTabHeader');
			var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
			var bpCode = appStateModel.getProperty('/selectedBP/bpNumber');
			var bpGroup = appStateModel.getProperty('/selectedBP/bpGroup');

			var viewModel = this.getModel(CONST_VIEW_MODEL);
			var filters = viewModel.getProperty('/filters');
			var conditions = {};
			var lc_index = -1;
			if (!!filters.orderStates) {
				lc_index = filters.orderStates.indexOf('0');
				if (lc_index < 0) { // can not find
					conditions.orderStates = filters.orderStates;
				}
			}

			// handle the order type search 
			// if (!!query){
			// 	conditions = {'orderNumber' : query.trim()};
			// }
			sap.ui.core.BusyIndicator.show(0);

			this.searchDraftByDealerCode(dealerCode, bpCode, bpGroup, conditions, function (results) {
				viewModel.setProperty('/orders', results);
				var binding = that._oList.getBinding("items");
				viewModel.setProperty('/filteredItems', binding.getLength());
				sap.ui.core.BusyIndicator.hide();
			});
		},

		onSetting: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.FOViewSettingsDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.setModel(this.getView().getModel());
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oDialog.open();
		},

		onUpdateFinished: function (oEvent) {},

		onExpandFilter: function (oEvevt) {
			var viewModel = this.getModel(CONST_VIEW_MODEL);
			var togglePanel = viewModel.getProperty('/filterPanelEnable');
			var togglePanel = !togglePanel;
			var filterButton = this.byId('filterButton');
			if (togglePanel) {
				filterButton.setIcon('sap-icon://collapse');
				viewModel.setProperty('/contHigh', "70%");
			} else {
				filterButton.setIcon('sap-icon://add-filter');
				viewModel.setProperty('/contHigh', "80%");
			}
			viewModel.setProperty('/filterPanelEnable', togglePanel);
		}
	});

});