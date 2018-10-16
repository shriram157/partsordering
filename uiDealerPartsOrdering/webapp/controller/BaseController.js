/*global history */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"tci/wave2/ui/parts/ordering/model/models",
		"sap/ui/Device",
		'sap/m/MessagePopover',
		'sap/m/MessageItem',
		'sap/m/Link',
		'sap/ui/model/json/JSONModel'
	], function (Controller, History, models, Device, MessagePopover, MessageItem, Link, JSONModel) {
		"use strict";
		
		var CONST_APP_STATE = "APP_STATE";
		
		var CONST_APP_ERROR = "APP_ERROR";
		
		// this section is sample
		var oLink = new Link({
			text: "Show more information",
			href: "", //  
			target: "_blank"
		});

		var oMessageTemplate = new MessageItem({
			type: '{type}',
			title: '{title}',
			description: '{description}',
			subtitle: '{subtitle}',
			counter: '{counter}',
			link: oLink
		});

		var oMessagePopover = new MessagePopover({
			items: {
				path: '/',
				template: oMessageTemplate
			}
		});
		
		
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

			getErrorModel : function(){
				var dataModel = sap.ui.getCore().getModel(CONST_APP_ERROR);
				if (dataModel === null || dataModel === undefined) {
					//mock data
					var sErrorDescription = 'First Error message description. \n' +
						'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' +
						'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,' +
						'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo' +
						'consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse' +
						'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non' +
						'proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

					var aMockMessages = [{
						type: 'Error',
						title: 'Error message',
						description: sErrorDescription,
						subtitle: 'Example of subtitle',
						counter: 1
						}, {
						type: 'Warning',
						title: 'Warning without description',
						description: ''
						}, {
						type: 'Success',
						title: 'Success message',
						description: 'First Success message description',
						subtitle: 'Example of subtitle',
						counter: 1
						}, {
						type: 'Error',
						title: 'Error message',
						description: 'Second Error message description',
						subtitle: 'Example of subtitle',
						counter: 2
						}, {
						type: 'Information',
						title: 'Information message',
						description: 'First Information message description',
						subtitle: 'Example of subtitle',
						counter: 1
					}];

					dataModel = new JSONModel();
					dataModel.setData(aMockMessages);
					sap.ui.getCore().setModel(dataModel, CONST_APP_ERROR);
				}
				
				var appState = models.getAppStateModel();
				appState.setProperty('/messageListLength', aMockMessages.length + "");
				return dataModel;
			},

			initMessageHover : function(){
				var oModel = this.getErrorModel();
				oMessagePopover.setModel(oModel);
			},
			
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

				//var bModel = models.createBusinessPartnerModel();
				var bModel = this.getApiBPModel();
				bModel.read("/A_BusinessPartner",
					{ 
						filters:  oFilter,
						urlParameters: {
    		 				"$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
						},
						success:  function(oData, oResponse){
							var bpList= [];
							var iBP = null;
							if (!!oData && !!oData.results){
								for (var i = 0; i < oData.results.length; i++){
									iBP = {};
									iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
									//iBP.BusinessPartnerUUID = oData.results[i].BusinessPartnerUUID;
									iBP.BusinessPartner = oData.results[i].BusinessPartner; // customer Id 
									//iBP.Customer = oData.results[i].to_Customer.Customer;
									//iBP.Name = oData.results[i].OrganizationBPName1;
									iBP.Name = oData.results[i].BusinessPartnerName;
									iBP.Dealer = iBP.BusinessPartner.slice(-5);
									bpList.push(iBP);
								}
							}	
							callBackFunction(bpList);
						},
						error: function(err){
							// error handling here
						}
					}
				);		
			},
			
			getPriceInfoFromInfoRecord : function( infoRecord, callback){
				var bModel = 	this.getInfoRecordModel();	
				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='7019',PurchasingInfoRecordCategory='0',Plant='')",
					{ 
						urlParameters: {
    		 				"$select": "MaterialRoundingProfile,NetPriceAmount,Currency,TaxCode"
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
				var bModel = 	this.getInfoRecordModel();	
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, vendor );
				bModel.read("/C_MM_SupplierValueHelpType",
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
			
			getPartsInfoById : function(id, callback){
				var bModel = this.getApiProductModel();
				bModel.read("/A_Product('"+id+"')", 
					{
						urlParameters: {
    		 				"$select": "ItemCategoryGroup"
						},
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							}	
							// handle the error
							callback(null);
						},
						error: function(err){
							// error handling here
							callback(null);
						}
					});				
			},
			
			getRoundingprofileOFVendor : function(id, callback){
				var bModel = this.getZProductModel();
				bModel.read("/zc_PriceSet  (Customer='',DisChannel='',Division='',Matnr='"+id+"',SalesDocType='',SalesOrg='',AddlData=true,LanguageKey='EN',Plant='')", 
					{
						// urlParameters: 
    		//  				"$select": "ItemCategoryGroup"
						// },
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							}	
							// handle the error
							callback(null);
						},
						error: function(err){
							// error handling here
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
    		 				"$select": "Material,MaterialName,Division,to_PurchasingInfoRecord/PurchasingInfoRecord,to_PurchasingInfoRecord/Supplier",
    						"$expand": "to_PurchasingInfoRecord"
						},
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							}
							// error handling
							callback(oData);
							
						},
						error: function(err){
							// error handling
							callback(oData);
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

			getSupplierCompanyCode : function(id, callBack){

				//var bModel = models.createBusinessPartnerModel();
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

				//var bModel = models.createBusinessPartnerModel();
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

			createOrderDraftItem : function(data, callback){
				var that = this;
				var localData = data;

				if (!!localData.includedDraftHeads && localData.includedDraftHeads.length >0){
					localData.newline.parentUuid = localData.includedDraftHeads[0];
					this._addOrderDraftItem(localData, callback);
				} else {
					this.createOrderDraft(data, function(oData){
						localData.includedDraftHeads.push(oData.draftUuid);
						localData.newline.parentUuid = oData.draftUuid;
						
						that._addOrderDraftItem(localData, callback);		
					});
				}
			}, 
			
			_addOrderDraftItem : function(data, callback){
				var bModel = this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");
				var entry = bModel.createEntry('/C_PurchaseOrderItemTP', {});
				var obj = entry.getObject();
				// put in the data

				obj.OrderQuantity = data.newline.qty;                
				//obj.OrderQuantity = '2';                

				obj.Material = data.newline.partNumber;                
				//obj.Material = '0027135892CA';                
				//obj.Material = 'PU55008151';                

				//obj.PurchasingInfoRecord='5300000122';

//				obj.Plant = '6000';          
//				obj.StorageLocation = '6100';
				obj.Plant = data.revPlant;          
				obj.StorageLocation = data.SLoc;
//				obj.NetPriceAmount = '1';
				obj.NetPriceAmount = data.newline.netPriceAmount;
//				obj.DocumentCurrency='CAD';
				obj.DocumentCurrency= data.newline.currency;
//				obj.TaxCode = 'P0';
				obj.TaxCode = data.newline.taxCode;
			
            						
				bModel.create("/C_PurchaseOrderTP(PurchaseOrder='',DraftUUID=guid'"+ data.newline.parentUuid + "',IsActiveEntity=false)/to_PurchaseOrderItemTP", obj, {
					success : function( oData, response){
						data.newline.draftUuid = oData.DraftUUID;    
						data.newline.line = oData.PurchaseOrderItem;
						callback(data);
					}, 
					error :  function(oError){
						var err = oError;
					} 
				});
				
			}, 
			
			createOrderDraft : function (data, callback){
				var that = this;		
				// if it is purchase order
				var orderDraft = {};
			//	orderDraft.businessPartnerType = data.userInfo.code;
			//	orderDraft.businessPartner = data.selectedBP.bpNumber;
				//orderDraft.customer = data.selectedBP.customer;
				
				// that.getCustomerById('2400042176', function(){
					
				// });
				
				// var orderType = null;
				// // get the order type.
				// this.getOrderTypeByCategoryGroup(data.userInfo.code, function(typeData){
				// 	var typeData = typeData;
				// });
				
				//for now, only create purchase order, will be an condition here for sales order
				var bModel = this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");
				var entry = bModel.createEntry('/C_PurchaseOrderTP', {});
				var obj = entry.getObject();
				// the default values
				obj.PurchasingOrganization = '7019';
				obj.PurchasingGroup = '150';
				obj.ZZ1_AppSource_PDH = 'A';
				
				// dynamic 
				obj.ZZ1_DealerCode_PDH = data.dealerCode;
				obj.ZZ1_DealerOrderNum_PDH = data.tciOrderNumber;
				
				//obj.Supplier = 'T22BK';
				//obj.Supplier = '2400100405';
				obj.Supplier = data.newline.supplier;
				// for now, defualt NB
				obj.PurchaseOrderType = 'NB';
				if ('NORM' === data.newline.itemCategoryGroup){
					obj.PurchaseOrderType = 'NB';
				} else if ('BANS' === data.newline.itemCategoryGroup){
					obj.PurchaseOrderType = 'UB';
				}
				
				obj.DocumentCurrency =  data.newline.currency;
				obj.CompanyCode = data.newline.companyCode;  
				//obj.DocumentCurrency = 'CAD';
				//obj.CompanyCode = '2014';
				
				//obj.CorrespncExternalReference = data.tciOrderNumber;
				bModel.create('/C_PurchaseOrderTP', obj, {
					success : function( oData, response){
						orderDraft.draftUuid = oData.DraftUUID;                         
						callback(orderDraft);
					}, 
					error :  function(oError){
						var err = oError;
					} 
				});			},
			
			activateDraft : function(iData, callBack){
				if (!!iData.includedDraftHeads && !!iData.includedDraftHeads[0]){
					var bModel = this.getOwnerComponent().getModel("MM_PUR_PO_MAINT_V2_SRV");

					bModel.callFunction('/C_PurchaseOrderTPActivation', {
						method : "POST",
						urlParameters: {
                	    	PurchaseOrder: '',
                    		DraftUUID: iData.includedDraftHeads[0],
                    		IsActiveEntity: false
                    	},					
						success : function( oData, response){
							//orderDraft.draftUuid = oData.DraftUUID;                         
							callBack(oData);
						}, 
						error :  function(oError){
							var err = oError;
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
			}, 
			
			handleMessagePopoverPress: function (oEvent) {
				oMessagePopover.toggle(oEvent.getSource());
			}
		});

	}
);