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
					filterPanelEnable : false, 
					contHigh : "80%", 
					orders: [], 
					filters: this.getDefaultFilterValues()
				};
				var viewModel = new JSONModel();
				viewModel.setData(viewState);
				this.setModel(viewModel, CONST_VIEW_MODEL);


				this.checkDealerInfo();
				
			},
			
			getDefaultFilterValues : function(){
				return {
					partsStates:['ALL'],
					orderStates:['ALL'],
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

			getRunningDefaultFilterValues : function(){
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYYMMdd" }); 
				var appStateModel = this.getStateModel();
				var dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');
				var nowDate = new Date();
				var fromMonth = nowDate.getMonth() + 1 -3; // three months
				var fromYear = nowDate.getFullYear();
				if (fromMonth < 0){
					fromMonth = fromMonth + 12;
					fromYear = fromYear -1;
				}
				var fromDate = new Date(fromYear,fromMonth,nowDate.getDate());
				var fromDateStr = ''+fromYear+fromMonth+nowDate.getDate();
				return {
					partsStates:['ALL'],
					orderStates:['ALL'],
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

				var filterModel = this.getModel('filterModel');
				if (!!!filterModel){
					filterModel = this.getFilterSelectionModel();
					this.setModel(filterModel, 'filterModel');
				}
				var viewModel = this.getModel( CONST_VIEW_MODEL);
				viewModel.setProperty('/filters',this.getRunningDefaultFilterValues());

				this.refresh();
			},
			
			onMasterSelected : function(oEvent){
				MessageToast.show("select Haha");
			},
			
			onReset : function(oEvent){
				var viewModel = this.getModel( CONST_VIEW_MODEL);
				viewModel.setProperty('/filters',this.getRunningDefaultFilterValues());
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
					filter = new sap.ui.model.Filter("deliv_no_list", sap.ui.model.FilterOperator.Contains, sQuery);
					orFilters.push(filter);
					filter = new sap.ui.model.Filter("bill_no_list", sap.ui.model.FilterOperator.Contains, sQuery);
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
				conditions.bpCode = bpCode;
				var viewModel = this.getModel(CONST_VIEW_MODEL);
				var filters = viewModel.getProperty('/filters');
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
				}
				
					// partsStates:['ALL'],
					// orderStates:['ALL'],
				// if (!!query){
				// 	conditions = {'orderNumber' : query.trim()};
				// }
				

				this.searchPartsOrders(conditions, isSalesOrder, function(results){
				 	viewModel.setProperty('/orders', results);
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