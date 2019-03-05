sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/MessageToast',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"tci/wave2/ui/parts/ordering/model/formatter"		
], function(BaseController, MessagePopover, MessageItem, MessageToast, Link, JSONModel, formatter) {
	"use strict";

	var CONT_OTLISTMODEL = "orderTypeListModel";	
	var CONST_VIEW_MODEL = 'viewModel';
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CheckOrderStatus", {

			formatter: formatter,
			
			onInit : function () {
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

				var viewState = { 
					filteredItems : 0,
					filterPanelEnable : true, 
					contHigh : "40%", 
					sortDescending : false,
					sortKey : 'TCI_order_no',			 	
					orders: [], 
					filters: this.getDefaultFilterValues(),
					filterAll : true,
					filterAllx : true
				};
				var viewModel = new JSONModel();
				viewModel.setData(viewState);
				this.setModel(viewModel, CONST_VIEW_MODEL);
				
				this._oList = this.byId('idProductsTable');
				this._oFilterTciOrderNumber = this.byId('tciOrderNumberFilter');
				this._oFilterDeleveryNumber = this.byId('deleveryNumberFilter');
				this._oFilterFiNumber = this.byId('fiNumberFilter');

				this.checkDealerInfo();
				
			},
			
			onFilterChange : function (oEvent){
				var shouldExclude = false;
				var lc_value = this._oFilterTciOrderNumber.getValue().trim();
				if (!!lc_value){
					shouldExclude  = true;
				}
				
				lc_value = this._oFilterDeleveryNumber.getValue().trim();
				if (!!lc_value){
					shouldExclude  = true;
				}

				lc_value = this._oFilterFiNumber.getValue().trim();
				if (!!lc_value){
					shouldExclude  = true;
				}
				
				var viewModel = this.getModel( CONST_VIEW_MODEL);
				if (!!shouldExclude) {
					viewModel.setProperty('/filterAll', false) ;
				} else {
					viewModel.setProperty('/filterAll', true) ;
				}
			},
			
			getDefaultFilterValues : function(){
				return {
					partsStates:['ALL'],
					orderStates:[0],
					partNumber: '',
					deleveryNumber: '',
					fiNumber: '',
					dealer: '',
					superUsrer:"false",
					orderNumber:'',
					tciOrderNumber:'',
					fromOrderDate :'',
					toOrderDate :''
				};
			},
			
			onConfirmViewSettingsDialog : function(oEvent){
				var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];				
				sPath = mParams.sortItem.getKey();
				bDescending = mParams.sortDescending;
				aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
				this._oList.getBinding("items").sort(aSorters);	
			},
			
			onSetting : function(oEvent){
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.CosViewSettingsDialog", this);
					this.getView().addDependent(this._oDialog);
				}
				this._oDialog.setModel(this.getView().getModel());
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
				this._oDialog.open();	
			},
			
			onDialogClose : function(oEvent){
				if(!!this._oDetailDialog ){
					this._oDetailDialog.close();
				}
			},
			
			afterDialogOpen : function(oEvent){
				if(!!this._oDetailDialog ){
					sap.ui.getCore().byId('topPageHeader').focus();
				}
			}, 			
			
			onSelectChangeOT : function(oEvent){
				var currentKey = oEvent.getParameters('changedItem').changedItem.getKey();
				var state = oEvent.getParameters('changedItem').selected;
				if (!!state){ // only for the selected

					if('0' ===  currentKey){ 
						oEvent.getSource().setSelectedKeys(['0']);
					} else {
						var keys = oEvent.getSource().getSelectedKeys();
						var index = keys.indexOf('0');
						if (index >=0){
							keys = keys.splice(index+1);
							oEvent.getSource().setSelectedKeys(keys);
						}
					}
				}
			},

			onSelectChangeOS : function(oEvent){
				var currentKey = oEvent.getParameters('changedItem').changedItem.getKey();
				var state = oEvent.getParameters('changedItem').selected;
				if (!!state){ // only for the selected

					if('ALL' ===  currentKey){ 
						oEvent.getSource().setSelectedKeys(['ALL']);
					} else {
						var keys = oEvent.getSource().getSelectedKeys();
						var index = keys.indexOf('ALL');
						if (index >=0){
							keys = keys.splice(index+1);
							oEvent.getSource().setSelectedKeys(keys);
						}
					}
				}
			},
			
			getRunningDefaultFilterValues : function(){
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYYMMdd" }); 
				var appStateModel = this.getStateModel();
				var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
				var nowDate = new Date();
// //				var fromMonth = nowDate.getMonth() + 1 -3; // three months
// 				var fromYear = nowDate.getFullYear();
// 				if (fromMonth < 0){
// 					fromMonth = fromMonth + 12;
// 					fromYear = fromYear -1;
// 				}
// 				var fromDate = new Date(fromYear,fromMonth,nowDate.getDate());
				var timelong  = nowDate.getTime() - (15*1000 * 60 * 60 * 24);
				var fromDate = new Date(timelong);
				//var fromDateStr = ''+fromYear+fromMonth+nowDate.getDate();
				return {
					partsStates:['ALL'],
					orderStates:[0],
					partNumber: '',
					deleveryNumber: '',
					fiNumber: '',
					dealer: dealerCode,
					superUsrer:"false",
					orderNumber:'',
					tciOrderNumber:'',
					fromOrderDate : dateFormat.format(fromDate),
					toOrderDate : dateFormat.format(nowDate)
				};
			},
		
			_onObjectMatched: function (oEvent) {
				// first, clean the message
				sap.ui.getCore().getMessageManager().removeAllMessages();
				if(!this.checkDealerInfo()){
					return;
				}

				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CS');

				// dynamic the type list 
				var filterModel = this.getModel('filterModel');
				if (!!!filterModel){
					filterModel = this.getFilterSelectionModel();
					this.setModel(filterModel, 'filterModel');
				} 
				var otList = this.getCurrentOrderTypeList().getData();
				var resourceBundle = this.getResourceBundle();					
				var newList = [{code : 0, name  : resourceBundle.getText('Parts.Status.All')}];
				newList = newList.concat(otList.typeList);
				filterModel.setProperty('/orderTypeList', newList);
				
				var viewModel = this.getModel( CONST_VIEW_MODEL);
				viewModel.setProperty('/filters',this.getRunningDefaultFilterValues());

				this.refresh();
			},
			
			onMasterSelected : function(oEvent){
				var that = this;
				var sPath = null;
				if (!this._oDetailDialog) {
					this._oDetailDialog = sap.ui.xmlfragment("tci.wave2.ui.parts.ordering.view.fragments.CosDetails", this);
					this.getView().addDependent(this._oDetailDialog);
				}
				var sPathList = oEvent.getSource().getSelectedContextPaths();
				if (!!sPathList && sPathList.length > 0){
					sPath = sPathList[0];
				}
				var theData = this.getModel(CONST_VIEW_MODEL).getProperty(sPath);
				
				//this._oDetailDialog.bindElement("viewModel>" +sPath);
				var aModel = new JSONModel();
				aModel.setData(theData);
				// call a server to get the desc
				
				this.getMaterialDesc(theData.part_no, 0, function(index, desc){
					theData.partdesc = desc;
					that._oDetailDialog.setModel(aModel);
					// toggle compact style
					jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), that._oDetailDialog);
					that._oDetailDialog.open();	
				});			
				

			},
			
			cleanUpDialog : function(oEvent){
				this.byId('idProductsTable').removeSelections(true);
			},

			onReset : function(oEvent){
				var viewModel = this.getModel( CONST_VIEW_MODEL);
				viewModel.setProperty('/filters',this.getRunningDefaultFilterValues());
				viewModel.setProperty('/filterAll', true) ;				
			}, 
			
			onSearch : function(oEvent){
				var query = oEvent.getParameters('query').query;
				
				this.refresh(query);
			},
			
			onLiveChange : function(oEvent){
				var sQuery = oEvent.getSource().getValue();
				
				var aFilters = [];
				var orFilters = [];
				var filter = null;
				if (!!sQuery && sQuery.length > 0){
					filter = new sap.ui.model.Filter("part_no", sap.ui.model.FilterOperator.Contains, sQuery);
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.Contains, sQuery);
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("deliv_no_str", sap.ui.model.FilterOperator.Contains, sQuery);
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("bill_no_str", sap.ui.model.FilterOperator.Contains, sQuery);
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("dealer_orderNo", sap.ui.model.FilterOperator.Contains, sQuery);	
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("ship_from", sap.ui.model.FilterOperator.Contains, sQuery);	
					orFilters.push(filter);

					filter = new sap.ui.model.Filter({ filters: orFilters, and: false});
					aFilters.push(filter);
				} else {
					//TODO
				}

				// update list binding
				var list = this.byId("idProductsTable");
				var binding = list.getBinding("items");
				binding.filter(aFilters, "Application");

				var viewModel = this.getModel( CONST_VIEW_MODEL);
				viewModel.setProperty('/filteredItems',binding.getLength());
				
			},
			
			refresh : function(query){
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
				if (!!isSalesOrder){
					conditions.bpCode = bpCode;
				} else {
					conditions.bpCode = dealerCode;
				}
				
				var viewModel = this.getModel(CONST_VIEW_MODEL);
				var filters = viewModel.getProperty('/filters');
				var filterAll  = viewModel.getProperty('/filterAll');
				var lc_index = -1;
				var exactMode = !filterAll;
				if (!!filters){
					if (!!filters.partNumber && filters.partNumber.trim().length >0){
						conditions.partNumber = filters.partNumber.trim();
					}
					if (!!filters.deleveryNumber && filters.deleveryNumber.trim().length >0){
						conditions.deleveryNumber = filters.deleveryNumber.trim();
					}
					if (!!filters.fiNumber && filters.fiNumber.trim().length >0){
						conditions.fiNumber = filters.fiNumber.trim();
					}
					if (!!filters.orderNumber && filters.orderNumber.trim().length >0){
						conditions.orderNumber = filters.orderNumber.trim();
					}
					if (!!filters.tciOrderNumber && filters.tciOrderNumber.trim().length >0){
						conditions.tciOrderNumber = filters.tciOrderNumber.trim();
					}
					conditions.fromOrderDate = filters.fromOrderDate;
					conditions.toOrderDate = filters.toOrderDate;

					// the ALL will not put new condition to the search query
					if (!!filters.partsStates){
						lc_index = filters.partsStates.indexOf('ALL');
						if(lc_index < 0){ // can not find
							conditions.partsStates = filters.partsStates;
						}
					}
					if (!!filters.orderStates){
						lc_index = filters.orderStates.indexOf('0');
						if(lc_index < 0){ // can not find
							conditions.orderStates = filters.orderStates;
						}
					}
				}
				
				this.searchPartsOrders(exactMode, conditions, isSalesOrder, function(results){
				 	viewModel.setProperty('/orders', results);

					var list = that.byId("idProductsTable");
					var binding = list.getBinding("items");

					viewModel.setProperty('/filteredItems',binding.getLength());
				 	
				 	sap.ui.core.BusyIndicator.hide();
				});				

			},
			
			onExpandFilter: function(oEvevt){
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
				
			}

		});
	}
);