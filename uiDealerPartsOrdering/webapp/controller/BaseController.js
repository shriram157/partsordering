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
		'sap/ui/model/json/JSONModel'
	], function (Controller, History, models, Device, MessagePopover, MessageItem, Link, Message , MessageType, JSONModel) {
		"use strict";
		
		var CONST_APP_STATE = "APP_STATE";
		var CONST_APP_ERROR = "APP_ERROR";

		return Controller.extend("tci.wave2.ui.parts.ordering.controller.BaseController", {

			/**
			 * Convenience method for accessing the router in every controller of the application.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return this.getOwnerComponent().getRouter();
			},

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},
			
			
			/**
			 * Event handler for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();
					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					// TODO
					this.getRouter().navTo("master", {}, true);
				}
			},
			
			/**
			 * user type 
			 */
			createUserTypeModel : function() {
			
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
					}]
				}; 
				var viewDataModel = new sap.ui.model.json.JSONModel();
				viewDataModel.setData(viewDatas);
				return viewDataModel;
			}, 
			
			
			getFilterSelectionModel : function(){
				var iDataMode = sap.ui.getCore().getModel("FilterSelectionModel");
				if (!!!iDataMode){
					var resourceBundle = this.getResourceBundle();				
					var iData = {
						 orderTypeList : [ {code : 1, name  : resourceBundle.getText('order.type.standard')},
										{code : 2, name  : resourceBundle.getText('order.type.rush')},
										{code : 3, name  : resourceBundle.getText('order.type.campaign')}
									  ],
						orderStatusList : [ {code : 'DF', name  : resourceBundle.getText('Order.Status.Draft')},
											{code : 'ST', name  : resourceBundle.getText('Order.Status.Submitted')}
										]				  
					};
					var iDataModel = new sap.ui.model.json.JSONModel();
					iDataModel.setData(iData);
					sap.ui.getCore().setModel(iDataModel, "FilterSelectionModel");
				}
				return iDataModel;
			}, 

			getUserTypeSelectionModel : function(){
				var dataModel = sap.ui.getCore().getModel("UserTypeSelectionModel");
				if (dataModel  === null || dataModel === undefined){
					dataModel = this.createUserTypeModel();
					sap.ui.getCore().setModel(dataModel, "UserTypeSelectionModel");
				}
				return dataModel;
			},

			setUserTypeSelectionModel : function(model){
				sap.ui.getCore().setModel(model, "UserTypeSelectionModel");
			},

			//error 
    		 _getMessagePopover : function () {
            	// create popover lazily (singleton)
            	if (!this._oMessagePopover) {
                	this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(),"tci.wave2.ui.parts.ordering.view.fragments.MessagePopover", this);
                	this.getView().addDependent(this._oMessagePopover);
            	}
            	return this._oMessagePopover;
        	},
			
			handleMessagePopoverPress: function (oEvent) {
            	//this._getMessagePopover().openBy(oEvent.getSource());
				this._getMessagePopover().toggle(oEvent.getSource());
			},

			handleLogout : function(oEvent){
				this.getRouter().navTo("Login", null, false);
				
			},

			///
			getHeaderMenuModel : function() {
				var dataModel = sap.ui.getCore().getModel("HeaderMenuModel");
				if (dataModel  === null || dataModel === undefined){
					var resourceBundle = this.getResourceBundle();
					var jsonData = {headeremuList : [
							{key : "001", name : resourceBundle.getText('headerMenu.CreateOrder')},
							{key : "001", name : resourceBundle.getText('headerMenu.FindOrder')},
							{key : "001", name : resourceBundle.getText('headerMenu.CheckOrderStatus')},
						]};
				
					dataModel = new sap.ui.model.json.JSONModel();
					dataModel.setData(jsonData);
					sap.ui.getCore().setModel(dataModel, "HeaderMenuModel");
				}
				return dataModel;
			}, 
			
			getStateModel : function(){
				var appState = models.getAppStateModel();
				return appState;
			},
			
			getInfoRecordModel : function(){
				return this.getOwnerComponent().getModel("MM_PUR_INFO_RECORDS_MANAGE_SRV");
			},

			getProductModel : function(){
				return this.getOwnerComponent().getModel("MD_PRODUCT_FS_SRV");
			},

			getZProductModel : function(){
				return this.getOwnerComponent().getModel("ZMD_PRODUCT_FS_SRV");
			},

			getApiProductModel : function(){
				return this.getOwnerComponent().getModel("API_PRODUCT_SRV");
			},
			
			getApiBPModel : function(){
				return this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");
			},

			getPurV2Model : function(){
				return this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");
			},
			
			
			onSelectTab: function (event) {
				var key = event.getParameter('item').getKey();
				var appState = models.getAppStateModel();
				
				switch (key){
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
			
			getBusinessPartnersByID : function(id, callback){
				var bModel = this.getApiBPModel();
				bModel.read("/A_BusinessPartner('"+id+"')",
					{ 
						// urlParameters: {
    		//  				"$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
						// },
						success:  function(oData, oResponse){
							if (!!oData && !!oData.results){
								callback(oData);
							}	
							// error handleing 
							callback(null);
						},
						error: function(err){
							// error handling here
							callback(null);
						}
					}
				);		
			},
			
			
			getBusinessPartnersByType : function(type, callBackFunction){
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, type );

				var bModel = this.getApiBPModel();
				var bpList= [];
				bModel.read("/A_BusinessPartner",
					{ 
						filters:  oFilter,
						urlParameters: {
    		 				"$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
						},
						success:  function(oData, oResponse){

							var iBP = null;
							if (!!oData && !!oData.results){
								for (var i = 0; i < oData.results.length; i++){
									iBP = {};
									iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
									iBP.BusinessPartner = oData.results[i].BusinessPartner; 
									iBP.Name = oData.results[i].BusinessPartnerName;
									iBP.Dealer = iBP.BusinessPartner.slice(-5);
									bpList.push(iBP);
								}
							}	
							callBackFunction(bpList);
						},
						error: function(err){
							callBackFunction(bpList);
						}
					}
				);		
			},
			
			getPriceInfoFromInfoRecord : function( infoRecord,purOrg,plant, callback){
				var bModel = 	this.getInfoRecordModel();	
//				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='"+plant+"')",
				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='')",
					{ 
						urlParameters: {
    		 				"$select": "NetPriceAmount,Currency,TaxCode"
						},
						success:  function(oData, oResponse){
							if(!!oData){
								callback(oData);
							} else {
								callback(null);
							}
						},
						error: function(err){
							// handle error?
							callback(null);
						}
					}
				);		
			},
		
			getzPriceInfoFromInfoRecord : function( infoRecord, callback){
				var bModel = 	this.getInfoRecordModel();	
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("PurchasingInfoRecord", sap.ui.model.FilterOperator.EQ, infoRecord );
				bModel.read("/I_PurgInfoRecdOrgPlantData",
					{ 
						filters:  oFilter,
						success:  function(oData, oResponse){
							if(!!oData){
								callback(oData);
							} else {
								callback(null);
							}
						},
						error: function(err){
							// handle error?
							callback(null);
						}
					}
				);		
			},			
			
			getCompanyCodeByVendor : function(vendor, callback){
				var bModel =  this.getInfoRecordModel();	
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, vendor );
				bModel.read("/C_MM_SupplierValueHelpType",
					{ 
						filters:  oFilter,
						success:  function(oData, oResponse){
							if(!!oData && !!oData.results && oData.results.length > 0){
								callback(oData.results[0]);
							} else {
								callback(null);
							}
						},
						
						error: function(err){
							// handle error?
							callback(null);
						}
					}
				);		
			}, 
			
			getPartsInfoById : function(id, callback){
				var bModel = this.getApiProductModel();
				bModel.read("/A_Product('"+id+"')", {
						urlParameters: {
    		  				"$select": "ItemCategoryGroup,to_SalesDelivery/ProductSalesOrg,to_SalesDelivery/ProductDistributionChnl",
    						"$expand": "to_SalesDelivery"    		
						},
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							}	
							callback(null);
						},
						error: function(err){
							callback(null);
						}
				});				
			},
			
			getRoundingprofileOFVendor : function(id, saleOrg, disChannel, callback){
				var bModel = this.getZProductModel();
				bModel.read("/zc_PriceSet(Customer='',DisChannel='"+disChannel+"',Division='',Matnr='"+id+"',SalesDocType='',SalesOrg='"+saleOrg+"',AddlData=true,LanguageKey='EN',Plant='')", 
				{
					urlParameters: {
   		  				"$select": "Item/Roundingprofile",
					},
					success:  function(oData, oResponse){
 						if (!!oData){
							callback(oData);
						}	
						callback(null);
					},
					error: function(err){
						callback(null);
					}
				});				
			},
			
			getZMaterialById : function(id, callback){
				var bModel = this.getZProductModel(); 
				var oFilter = new Array();
				bModel.read("/C_Product_Fs('"+id+"')", 
				{
					urlParameters: {
    		 			"$select": "Material,MaterialName,Division,to_PurchasingInfoRecord/PurchasingInfoRecord,to_PurchasingInfoRecord/Supplier,to_PurchasingInfoRecord/IsDeleted",
    					"$expand": "to_PurchasingInfoRecord"
					},
					success:  function(oData, oResponse){
	 					if (!!oData){
							callback(oData);
						}
						callback(oData);
					},
					error: function(err){
						callback(null);
					}
				});
			},
			
			getMaterialById : function(id, callback){
				var bModel = this.getProductModel(); 
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, id );
				bModel.read("/C_Product_Fs('"+id+"')", 
//				bModel.read("/C_Product_Fs", 
					{
						urlParameters: {
    						 "$expand": "to_Plant,to_PurchasingInfoRecord,to_Supplier"
						},
//				filters:  oFilter,
						success:  function(oData, oResponse){
						//	var bpList= [];
						//	var iBP = null;
//							if (!!oData && !!oData.results){
	 						if (!!oData){
								callback(oData);
								// for (var i = 0; i < oData.results.length; i++){
								// 	iBP = {};
								// 	iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
								// 	iBP.BusinessPartner = oData.results[i].BusinessPartner;
								// 	//iBP.Name = oData.results[i].OrganizationBPName1;
								// 	iBP.Name = oData.results[i].BusinessPartnerName;
								// 	iBP.Dealer = iBP.BusinessPartner.slice(-5);
								// 	bpList.push(iBP);
								// }
							}	
							// callBackFunction(bpList);
						},
						error: function(err){
							// error handling here
						}
					
				});
			},

			// for now, only the purchase order	
			searchPOrderByDealerCode : function(dealer, conditions, callback){
				var bModel = this.getPurV2Model();
				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = dealer;
				//var filterDraft = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				//var filterOrder = new sap.ui.model.Filter("SiblingEntity/IsActiveEntity", sap.ui.model.FilterOperator.EQ, null );
				
				//var filters1 = sap.ui.model.Filter( [filterDraft, filterOrder], false);

				// oFilter[0] =  new sap.ui.model.Filter({
				// 		filters: [filterDraft, filterOrder],
				// 		and : false
				// 	});
				oFilter[0] =  new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, true );
				oFilter[1] = new sap.ui.model.Filter("SiblingEntity/IsActiveEntity", sap.ui.model.FilterOperator.EQ, null );
				oFilter[2] = new sap.ui.model.Filter("ZZ1_DealerCode_PDH", sap.ui.model.FilterOperator.EQ, dealerCode );
				
				bModel.read('/C_PurchaseOrderTP', 
					{ 
						urlParameters: {
      		 				"$select": "PurchaseOrder,CompanyCode,PurchasingOrganization,PurchasingGroup,Supplier,DocumentCurrency,PurchaseOrderStatus,PurchaseOrderNetAmount,PurchaseOrderType,CreationDate,ZZ1_DealerCode_PDH,ZZ1_AppSource_PDH,ZZ1_DealerOrderNum_PDH,CreatedByUser",
      		 				"$orderby": "CreationDate"
						},
						filters:  oFilter,						
						success:  function(oData, oResponse){
							var orders = [];
							if (!!oData && !!oData.results ){
								var lv_order = null;
								var lv_aResult = null;
								var aOrderItem = null;
								var currentOrderNumber = null;
								for (var i=0; i < oData.results.length; i++  ){
									lv_aResult = oData.results[i];
									lv_order = {};
									
									lv_order.orderNumber= lv_aResult.ZZ1_DealerOrderNum_PDH;;
									lv_order.id= lv_aResult.PurchaseOrder;
									lv_order.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
									lv_order.createdOn = lv_aResult.CreationDate;
									lv_order.scOrderType = 1; // always standard as in front view 									
									orders.push(lv_order);
								}
							}
								
							callback(orders);
						},
						error: function(err){
							callback([]);
						}
					}
				);		
			},
	
	
		    getOrdersWithDealerCode : function(dealer, conditions, callback) {
		    	var that = this; 
		    	
		    	this.searchPOrderByDealerCode(dealer, conditions, function(orders){
			    	var orderList = orders;
		    		if (!!orders){
		    			//orderList.push(drafts);	//orderList.push()	
		    		}
		    		
		    		// do the search order
		    		callback(orders);
		    	});
		    	
		    },
		    
		    removeAllMessages : function(){
		    	sap.ui.getCore().getMessageManager().removeAllMessages();	
		    }, 
			// for now, only the purchase order	
			searchDraftByDealerCode : function(dealer, conditions, callback){
				var bModel = this.getPurV2Model();
				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = dealer;

				oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				oFilter[1] = new sap.ui.model.Filter("ZZ1_DealerCode_PDH", sap.ui.model.FilterOperator.EQ, dealerCode );
				
				bModel.read('/C_PurchaseOrderTP', 
					{ 
						urlParameters: {
      		 				"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime",
      		 				"$orderby": "ZZ1_DealerOrderNum_PDH,DraftEntityCreationDateTime"
						},
						filters:  oFilter,						
						success:  function(oData, oResponse){
							var sapMessage = null;
							var messageList =[];
							var messageItem = null;
							var uuid = null;
							var target = null;
							var index = 0;
							var mItem = null;
							if (!!oResponse && !!oResponse.headers['sap-message']){
								sapMessage = JSON.parse(oResponse.headers['sap-message']);
								if (!!sapMessage.target){
									index = sapMessage.target.search('guid');
									if (index > 0){
										uuid = sapMessage.target.substr(index + 5, 36);
										messageItem = { uuid : uuid, severity : sapMessage.severity, code : sapMessage.code, message : sapMessage.message};
										messageList[uuid] = messageItem;
									}
								}
								for (var x=0; x< sapMessage.details.length; x++){
									 mItem = sapMessage.details[x];
									 if (!!mItem && !!mItem.target){
										index = mItem.target.search('guid');
										if (index > 0){
											uuid = mItem.target.substr(index + 5, 36);
											messageItem = { uuid : uuid, severity : mItem.severity, code : mItem.code, message : mItem.message};
											messageList[uuid] = messageItem;
										}
									}
								}
							} 
							if (!!oData && !!oData.results ){
								var drafts = [];
								var lv_draft = null;
								var lv_aResult = null;
								var aDraftItem = null;
								var currentOrderNumber = null;
								for (var i=0; i < oData.results.length; i++  ){
									lv_aResult = oData.results[i];
									if (currentOrderNumber === null || currentOrderNumber !== lv_aResult.ZZ1_DealerOrderNum_PDH){
										//push eixtingto order list 
										if (lv_draft !== null){
											drafts.push(lv_draft);
										}
										
										lv_draft = {associatedDrafts:[]};
										currentOrderNumber = lv_aResult.ZZ1_DealerOrderNum_PDH;
										lv_draft.orderNumber= currentOrderNumber;

										lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
										lv_draft.createdOn = lv_aResult.DraftEntityCreationDateTime;
										lv_draft.modifiedOn = lv_aResult.DraftEntityLastChangeDateTime;
										lv_draft.scOrderType = 1; // always standard as in front view 
										lv_draft.scOrderStatus = 'DF'; // always standard as in front view
										
										// new
										aDraftItem ={};
										aDraftItem.purchaseOrg = lv_aResult.PurchasingOrganization;
										aDraftItem.purchaseGrp = lv_aResult.PurchasingGroup;
										aDraftItem.supplier = lv_aResult.Supplier;
										aDraftItem.orderType =	lv_aResult.PurchaseOrderType;
										aDraftItem.draftUUID = lv_aResult.DraftUUID;

										lv_draft.associatedDrafts.push(aDraftItem);
										
									} else {
										// addmore - just add
										if (lv_draft !== null){
											lv_draft.modifiedOn = lv_aResult.DraftEntityLastChangeDateTime;
											aDraftItem ={};
											aDraftItem.purchaseOrg = lv_aResult.PurchasingOrganization;
											aDraftItem.purchaseGrp = lv_aResult.PurchasingGroup;
											aDraftItem.supplier = lv_aResult.Supplier;
											aDraftItem.orderType =	lv_aResult.PurchaseOrderType;
											aDraftItem.draftUUID = lv_aResult.DraftUUID;

											lv_draft.associatedDrafts.push(aDraftItem);
											
										}
									}
									
									if (!!lv_draft && !!lv_draft.messages){
										lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
									}else {
										lv_draft.messages = [];
										lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
									}
								}
								if (!!lv_draft ){
									drafts.push(lv_draft);
									lv_draft = null;
								}
							}
 							callback(drafts);
						},
						error: function(err){
							var eee = err;
							// error handling here
						}
					}
				);		
			},
			
			checkDealerInfo : function(){
				var resourceBundle = this.getResourceBundle();
				var vModel = this.getModel(); // get the view model

				var dealerCode = vModel.getProperty('/selectedBP/dealerCode');
				var userType = vModel.getProperty('/userInfo/userType');

				var oMessage = null;
				var hasError = false;
				if (!!!userType){
    	        	oMessage = new Message({
                	message: resourceBundle.getText('Error.Login.noUserType'),
                	type: MessageType.Error
	            	});
    	    		sap.ui.getCore().getMessageManager().addMessages(oMessage);
					hasError = true;
				}

				if (!!!dealerCode){
    	        	oMessage = new Message({
                	message: resourceBundle.getText('Error.Login.noDealerCode'),
                	type: MessageType.Error
	            	});
    	    		sap.ui.getCore().getMessageManager().addMessages(oMessage);
				}
				if (hasError){
					sap.ui.getCore().getMessageManager().removeAllMessages();
					this.getRouter().navTo("Login", null, false);
					return false;
				} else {
					return true;
				}
			},
			
		    getDraftsWithDealerCode : function(dealer, conditions, callback) {
		    	var that = this; 
		    	
		    	this.searchDraftByDealerCode(dealer, conditions, function(drafts){
			    	var orderList =drafts;
		    		if (!!drafts){
		    			//orderList.push(drafts);	//orderList.push()	
		    		}
		    		
		    		// do the search order
		    		callback(orderList);
		    	});
		    },
		    
		    deleteDraft : function(uuid , callback){
		    	var that = this; 
				var bModel = this.getPurV2Model();
				bModel.remove("/C_PurchaseOrderTP(PurchaseOrder='',DraftUUID=guid'"+uuid+"',IsActiveEntity=false)", { 
					success :  function(oData, oResponse){
						// process sap-message?
						callback(uuid, true);
					},
					error	:  function(err){
						callback(uuid, false);
					},
					refreshAfterChange : false
				});
		    },
		    
		    loadDealerDraft : function(dealer, orderData, callback) {
		    	var that = this; 
		    	var lv_orderData =orderData;
		    	

				var bModel = this.getPurV2Model();
				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = dealer;

				oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				oFilter[1] = new sap.ui.model.Filter("ZZ1_DealerCode_PDH", sap.ui.model.FilterOperator.EQ, dealerCode );
				oFilter[1] = new sap.ui.model.Filter("ZZ1_DealerOrderNum_PDH", sap.ui.model.FilterOperator.EQ, orderData.tciOrderNumber );
				
				bModel.read('/C_PurchaseOrderTP', { 
					urlParameters: {
      		 			"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime,to_PurchaseOrderItemTP",
      		 			"$expand" : "to_PurchaseOrderItemTP",
      		 			"$orderby": "ZZ1_DealerOrderNum_PDH,DraftEntityCreationDateTime"
					},
					filters:  oFilter,						
					success:  function(oData, oResponse){
						var sapMessage = null;
						var messageList =[];
						var messageItem = null;
						var uuid = null;
						var target = null;
						var index = 0;
						var mItem = null;
						
						// get the list of message order by UUID
						if (!!oResponse && !!oResponse.headers['sap-message']){
							sapMessage = JSON.parse(oResponse.headers['sap-message']);
							if (!!sapMessage.target){
								index = sapMessage.target.search('guid');
								if (index > 0){
									uuid = sapMessage.target.substr(index + 5, 36);
									messageItem = { uuid : uuid, severity : sapMessage.severity, code : sapMessage.code, message : sapMessage.message};
									messageList[uuid] = messageItem;
								}
							}
							for (var x=0; x< sapMessage.details.length; x++){
								 mItem = sapMessage.details[x];
								 if (!!mItem && !!mItem.target){
									index = mItem.target.search('guid');
									if (index > 0){
										uuid = mItem.target.substr(index + 5, 36);
										messageItem = { uuid : uuid, severity : mItem.severity, code : mItem.code, message : mItem.message};
										messageList[uuid] = messageItem;
									}
								}
							}
						} 
						
						if (!!oData && !!oData.results ){

							var lv_aResult = null;
							var lv_aResultItem = null;
							var aDraftItem = null;
							var aDraftHeader = null;

							for (var x=0; x < oData.results.length; x++  ){
								lv_aResult = oData.results[x];
								
								// The main document
								// the first creation time 
								if (!!lv_orderData.createDate){
									if (lv_orderData.createDate > lv_aResult.DraftEntityCreationDateTime){
										lv_orderData.createDate = lv_aResult.DraftEntityCreationDateTime;
									}
								} else {
									lv_orderData.createDate = lv_aResult.DraftEntityCreationDateTime;
								}

								// the last last modification date/time
								if (!!lv_orderData.modifiedOn){
									if (lv_orderData.modifiedOn < lv_aResult.DraftEntityLastChangeDateTime){
										lv_orderData.modifiedOn = lv_aResult.DraftEntityLastChangeDateTime;
									}
								} else {
									lv_orderData.modifiedOn = lv_aResult.DraftEntityLastChangeDateTime;
								}
								
								// add the header to the document cache
								aDraftHeader = {};
								aDraftHeader.PurchasingOrganization = lv_aResult.PurchasingOrganization;
								aDraftHeader.PurchasingGroup = lv_aResult.PurchasingGroup;
								aDraftHeader.Supplier = lv_aResult.Supplier;
								aDraftHeader.PurchaseOrderType = lv_aResult.PurchaseOrderType;
								aDraftHeader.DraftUUID = lv_aResult.DraftUUID;
								aDraftHeader.Lines = 0;
								
								// process item level 
								if (!!lv_aResult.to_PurchaseOrderItemTP && !!lv_aResult.to_PurchaseOrderItemTP.results){
									aDraftHeader.Lines = lv_aResult.to_PurchaseOrderItemTP.results.length;
									for(var i=0; i < lv_aResult.to_PurchaseOrderItemTP.results.length; i++){
										lv_aResultItem = lv_aResult.to_PurchaseOrderItemTP.results[i];
										aDraftItem = {};
										aDraftItem.line = lv_aResultItem.PurchaseOrderItem;
										aDraftItem.partNumber = lv_aResultItem.Material;
										aDraftItem.partDesc =lv_aResultItem.PurchaseOrderItemText;
										aDraftItem.purInfoRecord = lv_aResultItem.PurchasingInfoRecord;
										aDraftItem.supplier = lv_aResultItem.Supplier;
										aDraftItem.qty = lv_aResultItem.OrderQuantity;
										aDraftItem.comment = lv_aResultItem.ZZ1_LongText_PDI;
										aDraftItem.companyCode = lv_aResultItem.CompanyCode;
										aDraftItem.purcahseOrg = lv_aResultItem.PurchasingOrganization;
										aDraftItem.uuid = lv_aResultItem.DraftUUID;
										aDraftItem.headerUuid = lv_aResultItem.ParentDraftUUID;
										//aDraftItem.spq = lv_aResultItem:'',

										// messages - item level messages
										if (!!aDraftItem && !!aDraftItem.messages){
											aDraftItem.messages.push(messageList[aDraftItem.draftUUID]);
										}else {
											aDraftItem.messages = [];
											aDraftItem.messages.push(messageList[aDraftItem.draftUUID]);
										}
										
										lv_orderData.items.push(aDraftItem);
									}
								}
								lv_orderData.associatedDrafts.push(aDraftHeader);
							}
						}
						
						lv_orderData.totalLines	= lv_orderData.items.length;
						callback(lv_orderData);
					},
					error: function(err){
						var eee = err;
						// error handling here
						lv_orderData.totalLines	= lv_orderData.items.length;
						callback(lv_orderData);
					}
		
				});
		    },
		    
		    getCompanyCodeByPurcahseOrg : function(purchaseOrg, callBack){
				var bModel = this.getInfoRecordModel();
				bModel.read("/C_PurchasingOrgValueHelp('"+purchaseOrg+"')",
					{ 
						urlParameters: {
						},
						success:  function(oData, oResponse){
							if (!!oData && !!oData.CompanyCode){
								callBack(oData.CompanyCode);
							}
							callBack(null);
						},
						error: function(err){
							callBack(null);
						}
					}
				);		
		    },
		    
			getSupplierCompanyCode : function(id, callBack){

				var bModel = this.getApiBPModel();
				bModel.read("/A_Customer('"+id+"')",
					{ 
						urlParameters: {
    		 				"$select": "to_CustomerCompany/CompanyCode",
    						"$expand": "to_CustomerCompany"
						},
						success:  function(oData, oResponse){
							callBack(oData);
						},
						
						error: function(err){
							// error handling here
							callBack(null);
						}
					}
				);		
			},

			
			getCustomerById : function(id, callBackFunction){

				var bModel = this.getApiBPModel();
				bModel.read("/A_Customer('"+id+"')",
					{ 
						urlParameters: {
    						 "$expand": "to_CustomerCompany,to_CustomerSalesArea"
						},
						success:  function(oData, oResponse){
							callBackFunction(oData);
						},
						
						error: function(err){
							// error handling here
						}
					}
				);		
			},

			getStorageInfo : function(vendor, callback){
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, vendor );
				var bModel = this.getOwnerComponent().getModel("ZC_STOR_LOCN_CDS");
				bModel.read("/ZC_STOR_LOCN",
					{ 
						filters:  oFilter,
						success:  function(oData, oResponse){
							if(!!oData && !!oData.results && oData.results.length > 0){
								callback(oData.results[0]);
							} else {
								// error
								callback(null);
							}
							
						},
						
						error: function(err){
							// handle error?
							callback(null);
						}
					}
				);		
				
			}, 
			
			getOrderTypeByCategoryGroup : function(cGroup, callback ){
				var bModel = this.getOwnerComponent().getModel("API_PRODUCT_SRV");
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("ItemCategoryGroup", sap.ui.model.FilterOperator.EQ, cGroup );
				
				bModel.read("/A_ProductSalesDeliveryType",
					{
						filters:  oFilter,
						success:  function(oData, oResponse){
							var bpList= [];
							var iBP = null;
							if (!!oData && !!oData.results){
								// for (var i = 0; i < oData.results.length; i++){
								// 	iBP = {};
								// 	iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
								// 	iBP.BusinessPartnerUUID = oData.results[i].BusinessPartnerUUID;
								// 	iBP.BusinessPartner = oData.results[i].BusinessPartner;
								// 	//iBP.Name = oData.results[i].OrganizationBPName1;
								// 	iBP.Name = oData.results[i].BusinessPartnerName;
								// 	iBP.Dealer = iBP.BusinessPartner.slice(-5);
								// 	bpList.push(iBP);
								// }
							}	
							// callBackFunction(bpList);
						},
						error: function(err){
							// error handling here
						}
					}
				);	
			},
			
			//deprecated 
			createOrderDraftItem : function(data, callback){
				var that = this;
				var localData = data;

				if (!!localData.associatedDrafts && localData.associatedDrafts.length >0){
					localData.newline[0].parentUuid = localData.associatedDrafts[0].uuid;
					this._addOrderDraftItem(localData, callback);
				} else {
					this.createOrderDraft(data, function(oData){
						localData.associatedDrafts.push(oData.draftUuid);
						localData.newline[0].parentUuid = oData.draftUuid;
						that._addOrderDraftItem(localData, callback);		
					});
				}
			}, 
			
			// [uuid, line] as key 
			updateOrderDraftItem : function(keys, valueObj, callback){
				var bModel = this.getPurV2Model();
				var key = bModel.createKey('C_PurchaseOrderItemTP', {
					'PurchaseOrder' : '',
					'DraftUUID' : keys[0],
					'PurchaseOrderItem' : keys[1],
					'IsActiveEntity' : false
				});
				
				bModel.update("/"+key, valueObj, {
					success : function( oData, response){
						//sap-message TODO
						callback(oData);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				} );
			},			

			//// only failed record will be returning message. message of good one will be ignored
			deleteOrderDraftItemOld : function(keys, callback){
				var rStructure = { keys : keys};
				
				var bModel = this.getPurV2Model();
				var key = bModel.createKey('C_PurchaseOrderItemTP', {
					'PurchaseOrder' : '',
					'DraftUUID' : keys[0],
					'PurchaseOrderItem' : keys[1],
					'IsActiveEntity' : false
				});
				bModel.remove("/" + key, {
					success : function( oData, response){
						//sap-message TODO
						callback(keys, true, []);
					}, 
					error :  function(oError){
						var err = oError;
						callback(keys, true, []);
					} 					
				});	
			},
			
			//// only failed record will be returning message. message of good one will be ignored
			deleteOrderDraftItem : function(keys, callback){
				var rStructure = { keys : keys};
				
				var bModel = this.getPurV2Model();
				// var key = bModel.createKey('C_PurchaseOrderItemTP', {
				// 	'PurchaseOrder' : '',
				// 	'DraftUUID' : keys[0],
				// 	'PurchaseOrderItem' : keys[1],
				// 	'IsActiveEntity' : false
				// });
				bModel.callFunction("/POItemDelete", {
					method : 'POST',
					urlParameters : {
						'DraftUUID' : keys[0]
						
					},
					success : function( oData, response){
						//sap-message TODO
						callback(keys, true, []);
					}, 
					error :  function(oError){
						var err = oError;
						callback(keys, false, []);
					} 					
				});	
			},
			_addOrderDraftItem : function(pUuid, data, callback){
				var bModel = this.getPurV2Model();
				var entry = bModel.createEntry('/C_PurchaseOrderItemTP', {});
				
				// item level data
				var obj = entry.getObject();
				obj.OrderQuantity = data.newline[0].qty;                //*
				obj.Material = data.newline[0].partNumber;              //*  
				obj.PurchasingInfoRecord=data.newline[0].purInfoRecord;
				obj.ZZ1_LongText_PDI = 	data.newline[0].comment;				
  
				obj.Plant = data.revPlant;          
				obj.StorageLocation = data.SLoc;

//				obj.NetPriceAmount = data.newline.netPriceAmount;
//				obj.DocumentCurrency= data.newline[0].currency;
//				obj.TaxCode = data.newline.taxCode;
          						
				bModel.create("/C_PurchaseOrderTP(PurchaseOrder='',DraftUUID=guid'"+ pUuid + "',IsActiveEntity=false)/to_PurchaseOrderItemTP", obj, {
					success : function( oData, response){
						//sap-message TODO
						data.newline[0].uuid = oData.DraftUUID;    
						data.newline[0].headerUuid = oData.ParentDraftUUID;
						data.newline[0].line = oData.PurchaseOrderItem;
						callback(data.newline[0]);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				});
			}, 
			
			getRealOrderTypeByItemCategoryGroup : function(itemCG){
				if ('NORM' === itemCG){
					return 'NB';
				} else if ('BANS' === itemCG){
					 return 'UB';
				} else {
					return 'NB'; // default
				}
				
			},
			
			createOrderDraft : function (data, callback){
				var that = this;
				
				var lv_orderType = this.getRealOrderTypeByItemCategoryGroup(data.newline[0].itemCategoryGroup);
				var lv_supplier = data.newline[0].supplier;
				
				var aDraft = null;
				//first of all, let us find the existing order header, 
				for(var x1 = 0 ; x1 < data.associatedDrafts.length; x1++){
					aDraft = data.associatedDrafts[x1];
					if( data.purchaseOrg === aDraft.PurchasingOrganization &&
						data.purchasingGroup === aDraft.PurchasingGroup &&
						lv_supplier === aDraft.Supplier &&
						lv_orderType === aDraft.PurchaseOrderType
					) {
						break;
					} else {
						aDraft = null;
					}
				}
				
				if (!!aDraft){
					that._addOrderDraftItem(aDraft.DraftUUID, data, function(rItem){
						if(!!rItem){
							data.items.push(rItem);
							aDraft.Lines = aDraft.Lines +1;
							callback(data, true);
						} else {
							callback(data, false);
						}
					});
				} else {
					//for now, only create purchase order, will be an condition here for sales order
					var bModel = this.getPurV2Model();;
					var entry = bModel.createEntry('/C_PurchaseOrderTP', {});
					var obj = entry.getObject();
					obj.ZZ1_AppSource_PDH = 'A';
					obj.PurchasingOrganization = data.purchaseOrg;
					obj.PurchasingGroup = data.purchasingGroup;

					obj.ZZ1_DealerCode_PDH = data.dealerCode;
					obj.ZZ1_DealerOrderNum_PDH = data.tciOrderNumber;
					obj.Supplier = lv_supplier;
	
					obj.DocumentCurrency =  data.newline[0].currency;
					obj.CompanyCode = data.newline[0].companyCode;  
					//obj.DocumentCurrency = 'CAD';
					//obj.CompanyCode = '2014';
					obj.PurchaseOrderType = lv_orderType;

					bModel.create('/C_PurchaseOrderTP', obj, {
						success : function( oData, response){
							// prepare aDraft
							aDraft = {};
							aDraft.PurchasingOrganization = oData.PurchasingOrganization;
							aDraft.PurchasingGroup = oData.PurchasingGroup;
							aDraft.Supplier = oData.Supplier;
							aDraft.PurchaseOrderType = oData.PurchaseOrderType;
							aDraft.DraftUUID = oData.DraftUUID;
							aDraft.Lines = 0;

							that._addOrderDraftItem(aDraft.DraftUUID, data, function(rItem){
								if(!!rItem){
									data.items.push(rItem);
									aDraft.Lines = aDraft.Lines +1;
									data.associatedDrafts.push(aDraft);
									callback(data, true);
								} else {
									data.associatedDrafts.push(aDraft);
									callback(data, false);
								}
							});
						}, 
						error :  function(oError){
							var err = oError;
							callback(data, false);
						} 
					});
				} 
			},

			activateDraft : function(iData, callBack){
				if (!!iData.associatedDrafts && !!iData.associatedDrafts[0]){
					var bModel = this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");

					bModel.callFunction('/C_PurchaseOrderTPActivation', {
						method : "POST",
						urlParameters: {
                	    	PurchaseOrder: '',
                    		DraftUUID: iData.associatedDrafts[0].uuid,
                    		IsActiveEntity: false
                    	},					
						success : function( oData, response){
							//orderDraft.draftUuid = oData.DraftUUID;                         
							callBack(oData);
						}, 
						error :  function(oError){
							var err = oError;
							callBack(null);
						} 
					});
				}
			}, 
			
			getOrderTypeName : function(id){
				var resourceBundle = this.getResourceBundle();
				switch(id){
					case '1': 
  					  return resourceBundle.getText('order.type.standard');
					case '2': 
  					  return resourceBundle.getText('order.type.rush');
					case '3': 
					  return resourceBundle.getText('order.type.campaign');	
					default : 
					  return "";
				}	
			}
			

		});

	}
);