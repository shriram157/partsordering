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

		var CONST_PARTS_CACHE = "PARTS_CACHE";

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
			
			
			getOrderTypeByCode : function(code, dealerType){
				var resourceBundle = this.getResourceBundle();
				switch(code){
					case 'ZOR':
						return {code : 1, name  : resourceBundle.getText('order.type.standard'), zcode : code};
					case 'ZRO':
						return {code : 2, name  : resourceBundle.getText('order.type.rush'), zcode : code};
					case 'ZCO':
						if ('04' === dealerType){
							return null; //dis-allowed for Land Rover dealer
						} else {
							return {code : 3, name  : resourceBundle.getText('order.type.campaign'), zcode : code};
						}
					default : 
						return null;
				};	
			},
			getFilterSelectionModel : function(){
				var iDataMode = sap.ui.getCore().getModel("FilterSelectionModel");
				if (!!!iDataMode){
					var resourceBundle = this.getResourceBundle();				
					var iData = {
						 orderTypeList : [ 
						 				{code : 'ALL', name  : resourceBundle.getText('order.type.all')},
						 				{code : 'ZOR', name  : resourceBundle.getText('order.type.standard')},
										{code : 'ZRO', name  : resourceBundle.getText('order.type.rush')},
										{code : 'ZCO', name  : resourceBundle.getText('order.type.campaign')}
									  ],
						orderStatusList : [ {code : 'DF', name  : resourceBundle.getText('Order.Status.Draft')},
											{code : 'ST', name  : resourceBundle.getText('Order.Status.Submitted')}
										],				  
						partsStateList : [ 
											{code : 'ALL', name  : resourceBundle.getText('Parts.Status.All')},
											{code : 'IP', name  : resourceBundle.getText('Parts.Status.InProcess')},
											{code : 'PR', name  : resourceBundle.getText('Parts.Status.Processed')},
											{code : 'CL', name  : resourceBundle.getText('Parts.Status.Cancelled')},
											{code : 'BK', name  : resourceBundle.getText('Parts.Status.BackOrdered')}
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

			getSalesOrderModel : function(){
				return this.getOwnerComponent().getModel("ZC_CREATE_SO_SRV");
			},

			// parts section 
			getPartCacheData : function(){
				var model = this.getOwnerComponent().getModel(CONST_PARTS_CACHE);
				if (!!model){
					return model.getData();
				} else {
					return null;
				}	
			},
			
			setPartCacheData : function(data){
				if (!!data){
					var model = new sap.ui.model.json.JSONModel();
					model.setData(data);
					this.getOwnerComponent().setModel(model, CONST_PARTS_CACHE);
				}
			},

			getPartsInfoById : function(id, callback){
				var bModel = this.getApiProductModel();
				var key = bModel.createKey('/A_Product',{'Product': id});				
//				bModel.read("/A_Product('"+id+"')", {
				bModel.read(key, {
						urlParameters: {
    		  			//	"$select": "ItemCategoryGroup,to_SalesDelivery/ProductSalesOrg,to_SalesDelivery/ProductDistributionChnl",
    						"$expand": "to_SalesDelivery"    		
						},
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							} else {
								callback(null);
							}	
						},
						error: function(err){
							callback(null);
						}
				});				
			},
			
			getRoundingprofileOFVendor : function(id, saleOrg, disChannel, callback){
				var bModel = this.getZProductModel();
				var key = bModel.createKey('/zc_PriceSet', {
					'Customer' : '',
					'DisChannel' : disChannel,
					'Division' : '',
					'Matnr' : id,
					'SalesDocType' : '',
					'SalesOrg' : saleOrg,
					'AddlData' : true,
					'LanguageKey' : 'EN',
					'Plant' : ''
				});
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("DisChannel", sap.ui.model.FilterOperator.EQ, disChannel );
				oFilter[1] = new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, id );
				oFilter[2] = new sap.ui.model.Filter("SalesOrg", sap.ui.model.FilterOperator.EQ, saleOrg );
				oFilter[3] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, 'EN' );
				oFilter[4] = new sap.ui.model.Filter("AddlData", sap.ui.model.FilterOperator.EQ, true );

				bModel.read("/zc_PriceSet(Customer='',DisChannel='"+disChannel+"',Division='',Matnr='"+id+"',SalesDocType='',SalesOrg='"+saleOrg+"',AddlData=true,LanguageKey='EN',Plant='')", 
//				bModel.read(key,
//				bModel.read("/zc_PriceSet",
				{
					// urlParameters: {
   		//   				"$select": "Item/Roundingprofile",
					// },
//					filters:  oFilter,
					success:  function(oData, oResponse){
 						if (!!oData){
							callback(oData);
						} else {
							callback(null);
						}	
					},
					error: function(err){
						callback(null);
					}
				});				
			},

			getPriceInfoFromInfoRecord : function( infoRecord,purOrg,callback){
				var bModel = 	this.getInfoRecordModel();	
				var key = bModel.createKey('/I_PurgInfoRecdOrgPlantData', {
					'PurchasingInfoRecord' : infoRecord,
					'PurchasingOrganization' : purOrg,
					'PurchasingInfoRecordCategory' : '0',
					'Plant' : ''
				});
//				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='"+plant+"')",
//				bModel.read("/I_PurgInfoRecdOrgPlantData(PurchasingInfoRecord='"+infoRecord+"',PurchasingOrganization='"+purOrg+"',PurchasingInfoRecordCategory='0',Plant='')",
				bModel.read( key, 
					{ 
						urlParameters: {
    		 			//	"$select": "NetPriceAmount,Currency,TaxCode"
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
				bModel.read("/C_MM_SupplierValueHelp",
					{ 
						filters:  oFilter,
						urlParameters: {
    		 		//		"$select": "CompanyCode,Country,SupplierAccountGroup"
						},
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
			
			
			getZMaterialById : function(id, callback){
				var bModel = this.getZProductModel(); 
				var oFilter = new Array();
				var key = bModel.createKey('/C_Product_Fs',{'Material': id});				
//				bModel.read("/C_Product_Fs('"+id+"')", 
				bModel.read(key, 
				{
					urlParameters: {
    		 		//	"$select": "Material,MaterialName,Division,to_PurchasingInfoRecord/PurchasingInfoRecord,to_PurchasingInfoRecord/Supplier,to_PurchasingInfoRecord/IsDeleted",
    					"$expand": "to_PurchasingInfoRecord"
					},
					success:  function(oData, oResponse){
	 					if (!!oData){
							callback(oData);
						} else {
							callback(null);
						}
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
				var key = bModel.createKey('/C_Product_Fs',{'Material': id});

				// bModel.read("/C_Product_Fs('"+id+"')", 
				bModel.read(key, 
					{
						urlParameters: {
    						 "$expand": "to_Plant,to_PurchasingInfoRecord,to_Supplier"
						},
//				filters:  oFilter,
						success:  function(oData, oResponse){
	 						if (!!oData){
								callback(oData);
							} else {
								callback(null);
							}	
						},
						error: function(err){
							// error handling here
							callback(null);
						}
					
				});
			},

			
			/// only for Z004/Z005 
			getInfoFromPart : function(partNum, bpVendor, callback){
            	var that = this;
				var cacheData = this.getPartCacheData();
				var cacheDataItem = null; 
				var lv_supplier = bpVendor;
				var hasError = false;
				// step control in the async mode 				
				var stepsContorl = [false, false, false, false, false, false ];
				
				// var isFinished = false;
				function isFinished(){
					if (stepsContorl[0] && stepsContorl[1] && stepsContorl[2] && stepsContorl[3] && stepsContorl[4] && stepsContorl[5]){
						return true;
					}
					return false;
				}
				
				if (!!cacheData && !!cacheData[partNum]){
					// if already has, return cache version
					callback(cacheData[partNum]);
					return;
				} else {
					if (!!partNum){
						if (!!!cacheData ){
							cacheData = []; 
						} 
						
						if (!!!cacheDataItem){
							cacheDataItem ={};
						}

		            	// get the item group and so 
						that.getPartsInfoById(partNum, function(item1Data){
	   						stepsContorl[0] = true;
							if(!!item1Data){
								if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length >0 ){
									var finishedCount = 0;
									for(var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++ ){
										// rounding profile  -- get the first one then			            	
    		    					   	that.getRoundingprofileOFVendor(partNum, 
        						 			item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
        					   				item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl, function(item2Data){
        					   					
        					   				finishedCount = finishedCount + 1;
											if(!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile){
							   					stepsContorl[1] = true;
												cacheDataItem.spq = item2Data.Item.Roundingprofile;
											} else if (finishedCount >= item1Data.to_SalesDelivery.results.length){
						   						stepsContorl[1] = true;
												// can not find anything
											} 
		    	      						// return is all finished 
		    	      						if(isFinished()){
		    	      							if(hasError){
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
				            		if(isFinished()){
			    	      				callback(null);
		    	      				}			
								}	

								cacheDataItem.itemCategoryGroup = item1Data.ItemCategoryGroup;
								var lv_orderType = that.getRealOrderTypeByItemCategoryGroup(item1Data.ItemCategoryGroup, false, null);
								
				            	that.getZMaterialById(partNum, function(data){
			            		// step one if finished 
				            		stepsContorl[2] = true;
    			        			if (!!data){
										cacheDataItem.partDesc = data.MaterialName ;
										
										if('NB' === lv_orderType){
											var infoRecord = null;
	    	    		    				if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
												for (var i=0;i < data.to_PurchasingInfoRecord.results.length; i++){
													infoRecord = data.to_PurchasingInfoRecord.results[i];
													if ( infoRecord.IsDeleted){
														infoRecord = null;
													} else {
							 							// only the none deleted infoRecord will survive
							 							break;
							 						}
												}						
											}
											
											if(!!infoRecord && !infoRecord.IsDeleted){
		        	    						// get the first record only. 
			        		    				lv_supplier = infoRecord.Supplier;
            									var lvPurchasingInfoRecord = infoRecord.PurchasingInfoRecord;
		        		    					cacheDataItem.supplier = lv_supplier;
												cacheDataItem.purInfoRecord = lvPurchasingInfoRecord; 
									
												// the following is almost in para, don't know which one will be return first 
												// get the company code 
            									that.getCompanyCodeByVendor(lv_supplier, function(o1Data){
            										stepsContorl[3] = true;
        			   								if (!!o1Data && !!o1Data.CompanyCode &&!!lv_supplier){
        			   									cacheDataItem.companyCode =o1Data.CompanyCode;
		    	      								} 
		    	      								// return is all finished 
		    	      								if(isFinished()){
		    	      									if(hasError){
			    	      									callback(null);
		    	      									} else {
			    	      									cacheData.push(cacheDataItem);
			    	      									callback(cacheDataItem);
		    	      									}
		    	      								}
            									});
            				
			    								that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord, 
            												"7019", function(cData){
            										stepsContorl[4] = true;
		            								if (!!cData && !!lvPurchasingInfoRecord){
        		    									cacheDataItem.currency =cData.Currency;
            											cacheDataItem.netPriceAmount = cData.NetPriceAmount;
            											cacheDataItem.taxCode = cData.TaxCode;
            										} 
		    	      								// return is all finished 
		    	      								if(isFinished()){
		    	      									if(hasError){
			    	      									callback(null);
		    	      									} else {
			    	      									cacheData.push(cacheDataItem);
			    	      									callback(cacheDataItem);
		    	      									}
		    	      								}
            									});

												// find the infoReord
												that.getStorageInfo(lv_supplier, function(data){
				    			        			stepsContorl[5] = true;
													// populate the rest of field
													if (!!data && !!lv_supplier){
														cacheDataItem.sloc = data.SLoc;
														cacheDataItem.revPlant = data.Plant;
													}
												});     											
											} else {
						            			stepsContorl[3] = true;
						            			stepsContorl[4] = true;
						            			stepsContorl[5] = true;
			    			        			hasError = true;
		    	    	  						if(isFinished()){
		    	      								callback(null);
												}
											}
										} else if ('UB' === lv_orderType) {
											
											// bypass all those steps
					            			stepsContorl[3] = true;
					            			stepsContorl[4] = true;
					            			stepsContorl[5] = true;
		    	      						if(isFinished()){
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
		    	      						if(isFinished()){
		    	      							callback(null);
	    	      							}			            			
										}

		           					}else {
					            		// call bacl null, as serious error
		        		    			stepsContorl[3] = true;
		        		    			stepsContorl[4] = true;
		        		    			stepsContorl[5] = true;
			            				hasError = true;
			            				if(isFinished()){
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

			getInfoFromPartx : function(partNum, revPlant, callback){
            	var that = this;
				var cacheData = this.getPartCacheData();
				var cacheDataItem = null; 
	
				var hasError = false;
				// step control in the async mode 				
				var stepsContorl = [false, false, false, false, false ];
				
				// var isFinished = false;
				function isFinished(){
					if (stepsContorl[0] && stepsContorl[1] && stepsContorl[2] && stepsContorl[3] && stepsContorl[4]){
						return true;
					}
					return false;
				}
				
				if (!!cacheData && !!cacheData[partNum]){
					// if already has, return cache version
					callback(cacheData[partNum]);
					return;
				} else {
					if (!!partNum){
						if (!!!cacheData ){
							cacheData = []; 
						} 
						
						if (!!!cacheDataItem){
							cacheDataItem ={};
						}
						
						// first step, get the infoRecord
		            	that.getZMaterialById(partNum, function(data){
		            		// step one if finished 
		            		stepsContorl[0] = true;
    	        			if (!!data){
								cacheDataItem.division = data.Division ;
								cacheDataItem.partDesc = data.MaterialName ;

								// find the infoReord
								var infoRecord = null;
	    	        			if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
									for (var i=0;i < data.to_PurchasingInfoRecord.results.length; i++){
										infoRecord = data.to_PurchasingInfoRecord.results[i];
										if ( infoRecord.IsDeleted){
											infoRecord = null;
										} else {
							 				// only the none deleted infoRecord will survive
							 				break;
							 			}
									}						
								}
						
								if(!!infoRecord && !infoRecord.IsDeleted){
	        	    				// get the first record only. 
		        		    		var lv_supplier = infoRecord.Supplier;
            						var lvPurchasingInfoRecord = infoRecord.PurchasingInfoRecord;
		        	    			cacheDataItem.supplier = lv_supplier;
									cacheDataItem.purInfoRecord = lvPurchasingInfoRecord; 
									
									// the following is almost in para, don't know which one will be return first 
									// get the company code 
            						that.getCompanyCodeByVendor(lv_supplier, function(o1Data){
            							stepsContorl[1] = true;
        			   					if (!!o1Data && !!o1Data.CompanyCode &&!!lv_supplier){
        			   						cacheDataItem.companyCode =o1Data.CompanyCode;
		    	      					} 
		    	      					// return is all finished 
		    	      					if(isFinished()){
		    	      						if(hasError){
			    	      						callback(null);
		    	      						} else {
			    	      						cacheData.push(cacheDataItem);
			    	      						callback(cacheDataItem);
		    	      						}
		    	      					}
            						});
            				
			    					that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord, 
            												"7019", function(cData){
            							stepsContorl[2] = true;
		            					if (!!cData && !!lvPurchasingInfoRecord){
        		    						cacheDataItem.currency =cData.Currency;
            								cacheDataItem.netPriceAmount = cData.NetPriceAmount;
            								cacheDataItem.taxCode = cData.TaxCode;
            							} 
		    	      					// return is all finished 
		    	      					if(isFinished()){
		    	      						if(hasError){
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
		    	      				if(isFinished()){
		    	      					callback(null);
	    	      					}			            			
		           				} 
		           				
		           				
		           			}else {
			            		// call bacl null, as serious error
		            			stepsContorl[1] = true;
		            			stepsContorl[2] = true;
			            		hasError = true;
			            		if(isFinished()){
		    	      				callback(null);
	    	      				}				            			
		           			}
		            	});	
		            	
		            	// get the item group and so 
						that.getPartsInfoById(partNum, function(item1Data){
	   						stepsContorl[3] = true;
							if(!!item1Data){
								cacheDataItem.itemCategoryGroup = item1Data.ItemCategoryGroup;
								if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length >0 ){
									var finishedCount = 0;
									for(var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++ ){
										// rounding profile  -- get the first one then			            	
    		    					   	that.getRoundingprofileOFVendor(partNum, 
        						 			item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
        					   				item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl, function(item2Data){
        					   					
        					   				finishedCount = finishedCount + 1;
											if(!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile){
							   					stepsContorl[4] = true;
												cacheDataItem.spq = item2Data.Item.Roundingprofile;
											} else if (finishedCount >= item1Data.to_SalesDelivery.results.length){
						   						stepsContorl[4] = true;
												// can not find anything
											} 
		    	      						// return is all finished 
		    	      						if(isFinished()){
		    	      							if(hasError){
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
				            		if(isFinished()){
			    	      				callback(null);
		    	      				}			
								}	
							} else {
		            			stepsContorl[4] = true;
			            		hasError = true;
			            		if(isFinished()){
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

			getSalesDocTypeByBPCode : function(id, dealerType, callback){
				var that = this;
				var bModel = this.getApiBPModel();
				var key = bModel.createKey('/Sales_DocTypeSet',{'Customer':id});				
				bModel.read(key,
					{ 
						urlParameters: {
    		 				// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
    		 				//"$expand" : "to_Customer"
						},
						success:  function(oData, oResponse){
							if (!!oData ){
								var typeList = [];
								var index = 0;
								var typeItem = that.getOrderTypeByCode(oData.Zauart1, dealerType);
								if (!!typeItem){
									typeList[index++] = typeItem;
								}
								typeItem = that.getOrderTypeByCode(oData.Zauart2, dealerType);
								if (!!typeItem){
									typeList[index++] = typeItem;
								}
								typeItem = that.getOrderTypeByCode(oData.Zauart3, dealerType);
								if (!!typeItem){
									typeList[index++] = typeItem;
								}
								callback(typeList);
							} else {
								// error handleing 
								callback(null);
							}	
						},
						error: function(err){
							// error handling here
							callback(null);
						}
					}
				);		
				
			},
			
			getBusinessPartnersByID : function(id, callback){
				var bModel = this.getApiBPModel();
				var key = bModel.createKey('/A_BusinessPartner',{'BusinessPartner':id});				
//				bModel.read("/A_BusinessPartner('"+id+"')",
				bModel.read(key,
					{ 
						urlParameters: {
    		 				// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
    		 				"$expand" : "to_Customer"
						},
						success:  function(oData, oResponse){
							if (!!oData ){
								callback(oData);
							} else {
								// error handleing 
								callback(null);
							}	
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
    		 		//		"$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
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
			
				if (!!conditions){
					if(!!conditions.orderNumber){
						oFilter[3] = new sap.ui.model.Filter("ZZ1_DealerOrderNum_PDH", sap.ui.model.FilterOperator.Contains, conditions.orderNumber );
					}
				}				

				bModel.read('/C_PurchaseOrderTP', 
					{ 
						urlParameters: {
      		 		//		"$select": "PurchaseOrder,CompanyCode,PurchasingOrganization,PurchasingGroup,Supplier,DocumentCurrency,PurchaseOrderStatus,PurchaseOrderNetAmount,PurchaseOrderType,CreationDate,ZZ1_DealerCode_PDH,ZZ1_AppSource_PDH,ZZ1_DealerOrderNum_PDH,CreatedByUser",
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
		  
			isSalesOrderAssociated : function(bpType){
		    	if (!!bpType && 'Z001' === bpType){
		    		return true;
		    	}
				return false;
			},
			
		    searchDraftByDealerCode : function(dealer, bpNumber, bpType, conditions, callback){
		    	if (this.isSalesOrderAssociated(bpType)){
		    		return this.searchSalesOrdDraftByDealerCode(bpNumber, conditions, callback);
		    	} else {
		    		return this.searchPurOrdDraftByDealerCode(dealer, conditions, callback);
		    	}
		    },
			
			// not support the split operation, keep it simple 	
			searchSalesOrdDraftByDealerCode : function(bpNumber, conditions, callback){	
				var that = this;
				var bModel = this.getSalesOrderModel();
				var oFilter = new Array();
				//oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				oFilter[0] = new sap.ui.model.Filter("SoldtoParty", sap.ui.model.FilterOperator.EQ, bpNumber );
				if (!!conditions){
					if(!!conditions.orderNumber){
						oFilter[1] = new sap.ui.model.Filter("PurchNoC", sap.ui.model.FilterOperator.Contains, conditions.orderNumber );
					}
				}

				bModel.read('/draft_soHeaderSet', 
					{ 
						urlParameters: {
      		 			//	"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime",
      		 			//	"$orderby": "ZZ1_DealerOrderNum_PDH,DraftEntityCreationDateTime"
      		 				$expand : "headerToItemDraft"
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
									lv_draft = {associatedDrafts:[]};
									currentOrderNumber = lv_aResult.PurchNoC;
									lv_draft.orderNumber= currentOrderNumber;

									//lv_draft.dealerCode = lv_aResult.ZZ1_DealerCode_PDH;
									lv_draft.bpCode = lv_aResult.SoldtoParty;
									lv_draft.uuid = lv_aResult.HeaderDraftUUID;	
									lv_draft.createdOn = lv_aResult.CreationTimestamp;
									lv_draft.modifiedOn = lv_aResult.CreationTimestamp;
									lv_draft.zOrderType = lv_aResult.DocType;
									lv_draft.isSalesOrder = true;
									lv_draft.scOrderType = that.getInnerOrderTypeByZOrderType(lv_draft.zOrderType);
									lv_draft.scOrderStatus = 'DF'; // always standard as in front view
										
									// new
									aDraftItem ={};

									aDraftItem.Division = lv_aResult.Division;
									aDraftItem.SalesOrganization = lv_aResult.SalesOrg;
									aDraftItem.DistributionChannel = lv_aResult.DistrChan;
									aDraftItem.orderType =	lv_aResult.DocType;
									aDraftItem.draftUUID = lv_aResult.HeaderDraftUUID;

									lv_draft.associatedDrafts.push(aDraftItem);

									if (!!lv_draft && !!lv_draft.messages){
										lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
									}else {
										lv_draft.messages = [];
										lv_draft.messages.push(messageList[aDraftItem.draftUUID]);
									}

									//push eixting to order list 
									if (lv_draft !== null){
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
						error: function(err){
							var eee = err;
							// error handling here
						}
					}
				);		
				
			},
			searchPurOrdDraftByDealerCode : function(dealer, conditions, callback){
				var bModel = this.getPurV2Model();
				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = dealer;
				

				oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				oFilter[1] = new sap.ui.model.Filter("ZZ1_DealerCode_PDH", sap.ui.model.FilterOperator.EQ, dealerCode );
				if (!!conditions){
					if(!!conditions.orderNumber){
						oFilter[2] = new sap.ui.model.Filter("ZZ1_DealerOrderNum_PDH", sap.ui.model.FilterOperator.Contains, conditions.orderNumber );
					}
				}
				
				bModel.read('/C_PurchaseOrderTP', 
					{ 
						urlParameters: {
      		 			//	"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime",
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
										lv_draft.scOrderType = "1"; // always standard as in front view 
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
		    
		    deleteDraft : function(uuid , isSalesOrder, callback){
		    	var that = this; 
				var bModel = null;
				var key = null;
				if (!!isSalesOrder){
					bModel = this.getSalesOrderModel();
					key = bModel.createKey('/draft_soHeaderSet', {
						'HeaderDraftUUID' : uuid,
						'IsActiveEntity' : false
					});
					bModel.remove(key, { 
						success :  function(oData, oResponse){
								// process sap-message?
								callback(uuid, true);
							},
						error	:  function(err){
								callback(uuid, false);
							},
						refreshAfterChange : false
					});
				} else {
					bModel = this.getPurV2Model();
					key = bModel.createKey('/C_PurchaseOrderTP', {
						'PurchaseOrder' : '',
						'DraftUUID' : uuid,
						'IsActiveEntity' : false
					});
					bModel.remove(key, { 
						success :  function(oData, oResponse){
							// process sap-message?
							callback(uuid, true);
						},
						error	:  function(err){
							callback(uuid, false);
						},
						refreshAfterChange : false
					});
				}
		    },
		    
		    _convertSeverty2Type : function(severty){
		    	switch(severty){
		    		case 'error':
		    			return 'Error';
		    		case 'warning':
		    			return 'Warning';
		    		case 'info':
		    			return 'Information';
		    		default :
		    			return 'None';
		    		
		    	}
		    	
		    },
		    
		    _extractSapMessage : function(oResponse){
		    	var that = this;
				var sapMessage = null;
				var messageList =[];
				var messageItem = null;
				var uuid = null;
				var index = 0;
				var mItem = null;
		    	
		    	// get the list of message order by UUID
				if (!!oResponse && !!oResponse.headers['sap-message']){
					sapMessage = JSON.parse(oResponse.headers['sap-message']);
					if (!!sapMessage.target){
						index = sapMessage.target.search('guid');
						if (index > 0){
							uuid = sapMessage.target.substr(index + 5, 36);
							messageItem = { uuid : uuid, type : that._convertSeverty2Type(sapMessage.severity), severity : sapMessage.severity, code : sapMessage.code, message : sapMessage.message};
							if (!!!messageList[uuid]){
								messageList[uuid] = [];
							}
							messageList[uuid].push(messageItem);
						}
					}
					for (var x=0; x< sapMessage.details.length; x++){
						 mItem = sapMessage.details[x];
						if (!!mItem && !!mItem.target){
							index = mItem.target.search('guid');
							if (index > 0){
								uuid = mItem.target.substr(index + 5, 36);
								messageItem = { uuid : uuid, type : that._convertSeverty2Type(mItem.severity),  severity : mItem.severity, code : mItem.code, message : mItem.message};
								if (!!!messageList[uuid]){
									messageList[uuid] = [];
								}
								messageList[uuid].push(messageItem);
							}
						}
					}
				} 
				return messageList;
		    },

		    loadDealerDraft : function(dealer, orderData, callback) {
		    	var that = this;
		    	if(!!orderData.isSalesOrder){
		    		if (!!orderData.DraftUUID){
		    			return that.loadSalesDraft(orderData.DraftUUID, orderData, callback);
		    		} else {
		    			callback(orderData);
		    		}
		    	} else {
		    		return  this.loadPurDealerDraft(dealer, orderData, callback);	
		    	}
		    },
		    
		    searchPartsOrders : function(conditions, isSalesOrder, callback){
		    	var that = this;
		    	if (!!isSalesOrder){
		    		that._seacrhPartsSalesOrder(conditions, function(oList){
		    			if (!!oList && oList.length > 0 ){
		    				var finalList = [];
		    				var currentItem = null;
		    				var currentKey = {};
		    				currentKey.TCI_order_no = null;
		    				currentKey.TCI_itemNo = null;
		    				
		    				for (var i = 0; i < oList.length; i++){
		    					currentItem = oList[i];
		    					if (currentKey.TCI_order_no === currentItem.TCI_order_no && currentKey.TCI_itemNo === currentItem.TCI_itemNo){

		    					} else {
		    						currentKey.TCI_order_no = currentItem.TCI_order_no;
		    						currentKey.TCI_itemNo = currentItem.TCI_itemNo;
		    						finalList.push(currentItem);
		    					}
	    						currentItem = null; 
		    				}
		    				callback(finalList);	
		    				
		    			} else {
		    				callback([]);	
		    			}
		    		} );
		    	} else {
		    		
		    	}
		    	
		    },
		    
		    _seacrhPartsSalesOrder : function(conditions, callback){
		    	var that = this;
				var bModel = this.getSalesOrderModel();

				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = conditions.bpCode;

				oFilter[0] = new sap.ui.model.Filter("dealer_code", sap.ui.model.FilterOperator.EQ, dealerCode );
				oFilter[1] = new sap.ui.model.Filter("erdat", sap.ui.model.FilterOperator.BT, conditions.fromOrderDate, conditions.toOrderDate );
				
				var aFilter = null;
				if (!!conditions.partNumber ){
					aFilter = new sap.ui.model.Filter("part_no", sap.ui.model.FilterOperator.Contains, conditions.partNumber );
					oFilter.push(aFilter);
				}
				if (!!conditions.deleveryNumber ){
					aFilter = new sap.ui.model.Filter("deliv_no", sap.ui.model.FilterOperator.Contains, conditions.deleveryNumber );
					oFilter.push(aFilter);
				}
				if (!!conditions.fiNumber ){
					aFilter = new sap.ui.model.Filter("bill_no", sap.ui.model.FilterOperator.Contains, conditions.fiNumber );
					oFilter.push(aFilter);
				}
				if (!!conditions.orderNumber ){
					aFilter = new sap.ui.model.Filter("dealer_orderNo", sap.ui.model.FilterOperator.Contains, conditions.orderNumber );
					oFilter.push(aFilter);
				}
				if (!!conditions.tciOrderNumber ){
					aFilter = new sap.ui.model.Filter("TCI_order_no", sap.ui.model.FilterOperator.Contains, conditions.tciOrderNumber );
					oFilter.push(aFilter);
				}

				bModel.read('/find_soSet', {
					urlParameters: {
 //     		 			"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime,to_PurchaseOrderItemTP",
      		 		//	"$expand" : "to_PurchaseOrderItemTP",
      		 			"$orderby": "TCI_order_no,TCI_itemNo"
					},
					filters:  oFilter,						
					success:  function(oData, oResponse){
						if (!!oData && !!oData.results){
							callback(oData.results);
						}
					},
					error: function(err){
						var eee = err;
						// error handling here
						callback(null);
					}
				});

		    	
		    }, 
		    
		    loadSalesDraft : function(uuid, orderData, callback){
		    	var that = this;
		    	var lv_orderData =orderData;
				var bModel = this.getSalesOrderModel();
				var key = bModel.createKey('/draft_soHeaderSet',{'HeaderDraftUUID':uuid, 'IsActiveEntity':'false'});				
				bModel.read(key,
					{ 
						urlParameters: {
    		 				// "$select": "BusinessPartnerType,BusinessPartner,BusinessPartnerName"
    		 				"$expand" : "headerToItemDraft"
						},
						success:  function(oData, oResponse){
							var messageList = that._extractSapMessage(oResponse);
							
							var lv_aResultItem = null;
							var aDraftHeader = null;
							var aDraftItem = null;
							
							if (!!oData ){
								lv_orderData.createDate = oData.CreationTimestamp;//oData.CreatedOn;
								lv_orderData.modifiedOn = oData.CreationTimestamp;

								lv_orderData.zOrderType = oData.DocType;
								lv_orderData.isSalesOrder = true;
								lv_orderData.orderTypeId =  that.getInnerOrderTypeByZOrderType(lv_orderData.zOrderType);
								lv_orderData.orderTypeName =  that.getOrderTypeName(orderData.orderTypeId);
								lv_orderData.tciOrderNumber= oData.PurchNoC;

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

								if (!!oData.headerToItemDraft && !!oData.headerToItemDraft.results){
									for(var i=0; i < oData.headerToItemDraft.results.length; i++){
										lv_aResultItem = oData.headerToItemDraft.results[i];
										aDraftItem = {};
										aDraftItem.line = lv_aResultItem.ItmNumber;
										aDraftItem.partNumber = lv_aResultItem.Material;
										aDraftItem.partDesc = ''; //lv_aResultItem.PurchaseOrderItemText;
										aDraftItem.qty = lv_aResultItem.TargetQty;
										aDraftItem.comment = lv_aResultItem.Comments;
										aDraftItem.uuid = lv_aResultItem.ItemDraftUUID;
										aDraftItem.parentUuid = lv_aResultItem.HeaderDraftUUID;
										aDraftItem.campainNum = lv_aResultItem.Zzcampaign;
										aDraftItem.opCode = lv_aResultItem.Zzopcode;
										aDraftItem.vin = lv_aResultItem.VIN_no;
										aDraftItem.contractNum = lv_aResultItem.RefDoc;
										aDraftItem.contractLine = lv_aResultItem.RefDocItemNo;
										//aDraftItem.spq = lv_aResultItem:'',

										// messages - item level messages
										if (!!aDraftItem && !!aDraftItem.messages){
											aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
										}else {
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
						error: function(err){
							// error handling here
							callback(lv_orderData);
						}
					}
				);		
		    },
		    
		    loadPurDealerDraft : function(dealer, orderData, callback) {
		    	var that = this; 
		    	var lv_orderData =orderData;
		    	

				var bModel = this.getPurV2Model();
				var oFilter = new Array();
				//var dealerCode = conditions.dealerCode;
				var dealerCode = dealer;

				oFilter[0] = new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false );
				oFilter[1] = new sap.ui.model.Filter("ZZ1_DealerCode_PDH", sap.ui.model.FilterOperator.EQ, dealerCode );
				oFilter[2] = new sap.ui.model.Filter("ZZ1_DealerOrderNum_PDH", sap.ui.model.FilterOperator.EQ, orderData.tciOrderNumber );
				
				bModel.read('/C_PurchaseOrderTP', { 
					urlParameters: {
 //     		 			"$select": "PurchasingOrganization,PurchasingGroup,Supplier,PurchaseOrderType,ZZ1_DealerCode_PDH,ZZ1_DealerOrderNum_PDH,DraftUUID,DraftEntityCreationDateTime,DraftEntityLastChangeDateTime,to_PurchaseOrderItemTP",
      		 			"$expand" : "to_PurchaseOrderItemTP",
      		 			"$orderby": "ZZ1_DealerOrderNum_PDH,DraftEntityCreationDateTime"
					},
					filters:  oFilter,						
					success:  function(oData, oResponse){

						var messageList = that._extractSapMessage(oResponse);

						if (!!oData && !!oData.results ){

							var lv_aResult = null;
							var lv_aResultItem = null;
							var aDraftItem = null;
							var aDraftHeader = null;
							var messageItem = null;

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
								aDraftHeader.OrderType = lv_aResult.PurchaseOrderType;
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
										aDraftItem.parentUuid = lv_aResultItem.ParentDraftUUID;
										//aDraftItem.spq = lv_aResultItem:'',

										// messages - item level messages
										if (!!aDraftItem && !!aDraftItem.messages){
											aDraftItem.messages = aDraftItem.messages.concat(messageList[aDraftItem.uuid]);
										}else {
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
				var key = bModel.createKey('/C_PurchasingOrgValueHelp',{'PurchasingOrganization': purchaseOrg});
//				bModel.read("/C_PurchasingOrgValueHelp('"+purchaseOrg+"')",
				bModel.read(key,
					{ 
						urlParameters: {
						},
						success:  function(oData, oResponse){
							if (!!oData && !!oData.CompanyCode){
								callBack(oData.CompanyCode);
							} else {
								callBack(null);
							}
						},
						error: function(err){
							callBack(null);
						}
					}
				);		
		    },


			getSupplierInfo : function(id, callBack){

				var bModel = this.getApiBPModel();
				var key = bModel.createKey('/A_Supplier',{'Supplier' : id});
				bModel.read(key,
					{ 
						urlParameters: {
    		 			//	"$select": "to_CustomerCompany/CompanyCode",
    						"$expand": "to_SupplierCompany"
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
		    
			getSupplierCompanyCode : function(id, callBack){

				var bModel = this.getApiBPModel();
				var key = bModel.createKey('/A_Customer',{'Customer' : id});
//				bModel.read("/A_Customer('"+id+"')",
				bModel.read(key,
					{ 
						urlParameters: {
    		 			//	"$select": "to_CustomerCompany/CompanyCode",
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
				var key = bModel.createKey('/A_Customer', {'Customer' : id});
				
				// bModel.read("/A_Customer('"+id+"')",
				bModel.read(key,
					{ 
						urlParameters: {
    						 "$expand": "to_CustomerCompany,to_CustomerSalesArea"
						},
						success:  function(oData, oResponse){
							callBackFunction(oData);
						},
						
						error: function(err){
							callBackFunction(null);
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
			
			
			_extractSapItemMessages: function(oResponse){
				var that = this; 

				var sapMessage = null;
				var mItem = null;
				var messageItem = null;
				var messageList = [];
				if (!!oResponse && !!oResponse.headers['sap-message']){
					sapMessage = JSON.parse(oResponse.headers['sap-message']);
//					if (!!sapMessage.target && sapMessage.target ==='PurchaseOrderItem'){					
					if (!!sapMessage.target){
						messageItem = { type : that._convertSeverty2Type(sapMessage.severity), severity : sapMessage.severity, code : sapMessage.code, message : sapMessage.message};
						messageList.push(messageItem);
						for (var x=0; x < sapMessage.details.length; x++){
							 mItem = sapMessage.details[x];
//							 if (!!mItem && !!mItem.target && mItem.target ==='PurchaseOrderItem'){
							 if (!!mItem && !!mItem.target){
								messageItem = {type : that._convertSeverty2Type(mItem.severity), severity : mItem.severity, code : mItem.code, message : mItem.message};
								messageList.push(messageItem);
							}
						}
					}
				}
				return messageList;
			},
			
			// [uuid, line] as key 
			updateOrderDraftItem : function(keys, valueObj, callback){
				var that = this;
				var bModel = this.getPurV2Model();
				var key = bModel.createKey('/C_PurchaseOrderItemTP', {
					'PurchaseOrder' : '',
					'DraftUUID' : keys[0],
					'PurchaseOrderItem' : keys[1],
					'IsActiveEntity' : false
				});
				
				bModel.update(key, valueObj, {
					success : function( oData, oResponse){
						var messageList = that._extractSapItemMessages(oResponse);
						callback(oData, messageList);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				} );
			},			

			// [uuid, puuid] as key 
			updateSalesDraftItem : function(keys, valueObj, callback){
				var that = this;
				var bModel = this.getSalesOrderModel();

				var key = bModel.createKey('/draft_soItemSet', {
					'HeaderDraftUUID' : keys[1],
					'ItemDraftUUID' : keys[0],
					'IsActiveEntity' : false
				});
				
				bModel.update(key, valueObj, {
					success : function( oData, oResponse){
						var messageList = that._extractSapItemMessages(oResponse);
						callback(oData, messageList);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				} );
			},			

			//// only failed record will be returning message. message of good one will be ignored
			deleteOrderDraftItem : function(keys, isSalesOrder, callback){
				var that = this;
				var rStructure = { keys : keys};
				
				var bModel = null;
				var key = null;
				if(!!isSalesOrder){
					bModel = this.getSalesOrderModel();
					key = bModel.createKey('/draft_soItemSet', {
						'ItemDraftUUID' : keys[0],
						'HeaderDraftUUID' : keys[2],
						'IsActiveEntity' : false
					});
					bModel.remove(key, {
						success : function( oData, oResponse){
							var messageList = that._extractSapItemMessages(oResponse);
							callback(keys, true, messageList);
						}, 
						error :  function(oError){
							var err = oError;
							callback(keys, true, []);
						} 					
					});	
					
				} else {
					bModel = this.getPurV2Model();
					bModel.callFunction("/POItemDelete", {
						method : 'POST',
						refreshAfterChange : false,
						urlParameters : {
							'DraftUUID' : keys[0]
						},
						success : function( oData, oResponse){
							var messageList = that._extractSapItemMessages(oResponse);
							callback(keys, true, messageList);
						}, 
						error :  function(oError){
							var err = oError;
							callback(keys, false, []);
						} 					
					});	

				}
				
			},
			
			//// only failed record will be returning message. message of good one will be ignored
			deleteOrderDraftItemOld : function(keys, callback){
				var that = this;				
				var rStructure = { keys : keys};

					// key = bModel.createKey('/C_PurchaseOrderItemTP', {
					// 	'PurchaseOrder' : '',
					// 	'DraftUUID' : keys[0],
					// 	'PurchaseOrderItem' : keys[1],
					// 	'IsActiveEntity' : false
					// });
					// bModel.remove(key, {
					// 	success : function( oData, oResponse){
					// 		var messageList = that._extractSapItemMessages(oResponse);
					// 		callback(keys, true, messageList);
					// 	}, 
					// 	error :  function(oError){
					// 		var err = oError;
					// 		callback(keys, true, []);
					// 	} 					
					// });	
				
				var bModel = this.getPurV2Model();
				bModel.callFunction("/POItemDelete", {
					method : 'POST',
					refreshAfterChange : false,
					urlParameters : {
						'DraftUUID' : keys[0]
					},
					success : function( oData, oResponse){
						var messageList = that._extractSapItemMessages(oResponse);
						callback(keys, true, messageList);
					}, 
					error :  function(oError){
						var err = oError;
						callback(keys, false, []);
					} 					
				});	
			},
			
			validateContractNumber : function(bpCode, contract, part, callback){
				var that = this;
				var bModel = this.getSalesOrderModel();

				var key = bModel.createKey('/contractNo_validationSet', {
					'camp_no' : contract,
					'dealer_code' : bpCode,
					'part_no' : part
				});
				bModel.read(key, {
					success : function( oData, oResponse){
						var messageList = that._extractSapItemMessages(oResponse);
						callback(oData, true, messageList);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null, false, []);
					} 					
				});	
			},
			
			_addSalesDraftItem : function(pUuid, data, orderType, callback){
				var that = this;
				var bModel = this.getSalesOrderModel();
				var entry = bModel.createEntry('/draft_soItemSet', {});

				// item level data
				var obj = entry.getObject();
				obj.HeaderDraftUUID = pUuid;
				
				//obj.TargetQty = data.newline[0].qty.toString();                //*
				obj.TargetQty = data.newline[0].qty.toString();                //*
				obj.Material = data.newline[0].partNumber;              //*  
				obj.Comments = data.newline[0].comment;
				if (!!data.typeD){ // Campiagn
					obj.Zzcampaign = data.newline[0].campainNum;
					obj.Zzopcode = data.newline[0].opCode;
					obj.VIN_no = data.newline[0].vin;
				} else if (!!data.typeB){
					obj.RefDoc = data.newline[0].contractNum;
					obj.RefDocItemNo = data.newline[0].contractLine;                
				}
				
				bModel.create('/draft_soItemSet', obj, {
					success : function( oData, oResponse){
						//TODO
						var messageList = that._extractSapItemMessages(oResponse);
						data.newline[0].uuid = oData.ItemDraftUUID;    
						data.newline[0].parentUuid = oData.HeaderDraftUUID;
						data.newline[0].line = oData.ItmNumber;
						data.newline[0].messageLevel = that.getMessageLevel(messageList); 
						data.newline[0].messages = messageList;
						callback(data.newline[0]);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				});

			},
			
			_addOrderDraftItem : function(pUuid, data, orderType, callback){
				var that = this;
				var bModel = this.getPurV2Model();
				var entry = bModel.createEntry('/C_PurchaseOrderItemTP', {});
				
				// item level data
				var obj = entry.getObject();
				obj.OrderQuantity = data.newline[0].qty;                //*
				obj.Material = data.newline[0].partNumber;              //*  
				obj.ZZ1_LongText_PDI = 	data.newline[0].comment;
				
				if ('UB' === orderType ){
					obj.Plant = data.revPlant;          
					obj.StorageLocation = data.sloc;
					obj.DocumentCurrency= "CAD";
					obj.NetPriceAmount = '1';
				//	obj.InvoiceIsExpected = false;
				//	obj.GoodsReceiptIsExpected = false;	
					obj.PurchaseOrderItemCategory = '7';
					obj.PurOrdExternalItemCategory = 'U';
				} else if ('NB' === orderType){
					obj.PurchasingInfoRecord=data.newline[0].purInfoRecord;
				}
				
				//obj.NetPriceAmount = '2';

				// obj.NetPriceAmount = data.newline.netPriceAmount;
//				obj.DocumentCurrency= data.newline[0].currency;
//				obj.TaxCode = data.newline.taxCode;
				//obj.TaxCode = 'P0';

				var key = bModel.createKey('/C_PurchaseOrderTP', {
					'PurchaseOrder' : '',
					'DraftUUID' : pUuid,
					'IsActiveEntity' : false
				});
          						
				bModel.create(key + "/to_PurchaseOrderItemTP", obj, {
					success : function( oData, oResponse){
						var messageList = that._extractSapItemMessages(oResponse);
						data.newline[0].uuid = oData.DraftUUID;    
						data.newline[0].parentUuid = oData.ParentDraftUUID;
						data.newline[0].line = oData.PurchaseOrderItem;
						data.newline[0].messageLevel = that.getMessageLevel(messageList); 
						data.newline[0].messages = messageList;
						callback(data.newline[0]);
					}, 
					error :  function(oError){
						var err = oError;
						callback(null);
					} 
				});
			}, 
			
			getInnerOrderTypeByZOrderType : function(orderType){
				switch(orderType){
					case 'ZOR':
						return '1';
					case 'ZRO':
						return '2' ;
					case 'ZCO':
						return '3';
					default:
						return '1'; // as the default? 
				}	
			},
			
			getRealOrderTypeByItemCategoryGroup : function(itemCG, isSalesOrder, orderType ){
				if (!!isSalesOrder){
					switch(orderType){
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
					if ('NORM' === itemCG){
						return 'NB';
					} else if ('BANS' === itemCG){
						 return 'UB';
					} else {
						return 'NB'; // default
					}
				}
			},

			createOrderDraft : function (data, callback){
				if (!!data && !!data.isSalesOrder){
					return this._createSalesOrderDraft(data, callback);
				} else {
					// treated as purchase order 
					return this._createPurchaseOrderDraft(data, callback);
				}
			},
			
			_createSalesOrderDraft : function(data, callback){
				var that = this;
				var lv_orderType = this.getRealOrderTypeByItemCategoryGroup( data.newline[0].itemCategoryGroup , data.isSalesOrder, data.orderTypeId );
				
				var aDraft = null;
				//first of all, let us find the existing order header, 
				for(var x1 = 0 ; x1 < data.associatedDrafts.length; x1++){
					aDraft = data.associatedDrafts[x1];
					if( data.Division === aDraft.Division &&
						data.DistributionChannel === aDraft.DistributionChannel &&
						data.SalesOrganization === aDraft.SalesOrganization &&
						lv_orderType === aDraft.OrderType
					) {
						break;
					} else {
						aDraft = null;
					}
				}

				if (!!aDraft){
					that._addSalesDraftItem(aDraft.DraftUUID, data, lv_orderType, function(rItem){
						if(!!rItem){
							data.items.push(rItem);
							aDraft.Lines = aDraft.Lines +1;
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
					
					// if (!!data.newline[0].contractNum){
					// 	obj.ContractNumber = data.newline[0].contractNum;
					// 	obj.ContractNumber ="1";
					// } else {
					// 	obj.ContractNumber ="1";
					// }
	
					bModel.create('/draft_soHeaderSet', obj, {
						success : function( oData, response){
							// prepare aDraft
							aDraft = {};
							aDraft.SalesOrganization = oData.SalesOrg;
							aDraft.DistributionChannel = oData.DistrChan;
							aDraft.Division = oData.Division;
							aDraft.OrderType = oData.DocType;
							aDraft.DraftUUID = oData.HeaderDraftUUID;
							aDraft.Lines = 0;

							that._addSalesDraftItem(aDraft.DraftUUID, data, lv_orderType, function(rItem){
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

			_createPurchaseOrderDraft : function (data, callback){
				var that = this;
				
				var lv_orderType = this.getRealOrderTypeByItemCategoryGroup( data.newline[0].itemCategoryGroup , data.isSalesOrder, data.orderTypeId );

				var aDraft = null;
				//first of all, let us find the existing order header, 
				for(var x1 = 0 ; x1 < data.associatedDrafts.length; x1++){
					aDraft = data.associatedDrafts[x1];
					if( data.purchaseOrg === aDraft.PurchasingOrganization &&
						data.purchasingGroup === aDraft.PurchasingGroup &&
						lv_supplier === aDraft.Supplier &&
						lv_orderType === aDraft.OrderType
					) {
						break;
					} else {
						aDraft = null;
					}
				}
				
				var lv_supplier = null;
				if ('UB' === lv_orderType ){
					lv_supplier = data.purBpCode;
				} else if ('NB' === lv_orderType){
					lv_supplier = data.newline[0].supplier;
				}

				var aDraft = null;
				//first of all, let us find the existing order header, 
				for(var x1 = 0 ; x1 < data.associatedDrafts.length; x1++){
					aDraft = data.associatedDrafts[x1];
					if( data.purchaseOrg === aDraft.PurchasingOrganization &&
						data.purchasingGroup === aDraft.PurchasingGroup &&
						lv_supplier === aDraft.Supplier &&
						lv_orderType === aDraft.OrderType
					) {
						break;
					} else {
						aDraft = null;
					}
				}
				
				if (!!aDraft){
					that._addOrderDraftItem(aDraft.DraftUUID, data, lv_orderType, function(rItem){
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
					obj.PurchasingOrganization = data.purchaseOrg;
					obj.PurchasingGroup = data.purchasingGroup;

					obj.ZZ1_DealerCode_PDH = data.dealerCode;
					obj.ZZ1_DealerOrderNum_PDH = data.tciOrderNumber;
					obj.PurchaseOrderType = lv_orderType;

					if ('UB' === lv_orderType ){
						obj.ZZ1_AppSource_PDH = 'B';
//				obj.Supplier = data.revPlant;
						obj.ZZ1_SupplyPlant_PDH ='7300';
						obj.CompanyCode = data.newline[0].companyCode;  
						obj.DocumentCurrency= "CAD";

//						obj.Supplier = '7300';
					} else if ('NB' === lv_orderType){
						obj.ZZ1_AppSource_PDH = 'A';
						obj.Supplier = lv_supplier;
						obj.CompanyCode = data.newline[0].companyCode;  
						obj.DocumentCurrency= "CAD";
					}
		
					// obj.DocumentCurrency =  data.newline[0].currency;
					//obj.DocumentCurrency = 'CAD'; //
					//obj.CompanyCode = '2014';

					bModel.create('/C_PurchaseOrderTP', obj, {
						success : function( oData, response){
							// prepare aDraft
							aDraft = {};
							aDraft.PurchasingOrganization = oData.PurchasingOrganization;
							aDraft.PurchasingGroup = oData.PurchasingGroup;
							aDraft.Supplier = oData.Supplier;
							aDraft.OrderType = oData.PurchaseOrderType;
							aDraft.DraftUUID = oData.DraftUUID;
							aDraft.Lines = 0;

							that._addOrderDraftItem(aDraft.DraftUUID, data, lv_orderType, function(rItem){
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
			
			getMessageColor : function(messages){
				var messageLevel = 0; // non
				var meesageItem = null;
				if(!!messages && !!messages.length){
					for(var i = 1; i < messages.length; i++){
						if (!!meesageItem){
							meesageItem = messages[i];
							switch (meesageItem.severity){
								case 'error':
									messageLevel = 3;
									break;
								case 'warning':
									if(messageLevel < 2){
										messageLevel =2;
									}
									break;
								default : 
									if(messageLevel < 1){
										messageLevel = 1 ;
									}								
									break;
							}
						}
					}
				}
				
				switch(messageLevel){
					case 3:
						return "#FC0519";
					case 2:
						return "#FFDAB9";
					default:
						return "#2DFA06";
				}
			},
			
			getMessageLevel : function(messages){
				var messageLevel = 1; // non
				var meesageItem = null;
				if(!!messages && !!messages.length){
					for(var i = 0; i < messages.length; i++){
						meesageItem = messages[i];
						if (!!meesageItem){
							switch (meesageItem.severity){
								case 'error':
									messageLevel = 3;
									break;
								case 'warning':
									if(messageLevel < 2){
										messageLevel =2;
									}
									break;
								default : 
									if(messageLevel < 1){
										messageLevel = 1 ;
									}								
									break;
							}
						}
					}
				}
				return messageLevel;
			},
			
			_extractSapErrorMessage: function(error){
				// sap-message
				var sapMessage = null;
				var mItem = null;
				var messageItem = null;
				var messageList = [];
				if (!!error && !!error.responseText){
					sapMessage = JSON.parse(error.responseText);
					if(!!sapMessage.error && !!sapMessage.error.innererror && !!sapMessage.error.innererror.errordetails ){
						for (var x=0; x < sapMessage.error.innererror.errordetails.length; x++){
							 mItem = sapMessage.error.innererror.errordetails[x];
							 if (!!mItem ){
								messageItem = {severity : mItem.severity, code : mItem.code, message : mItem.message};
								messageList.push(messageItem);
							}
						}
					}
				}
				return messageList;
			},
			
			activateDraft : function(uuid, index, isSalesOrder, callBack){
				var that = this;
				var bModel = null;
				if (!!uuid){
					if(!!isSalesOrder){

						bModel = this.getSalesOrderModel();  //TODORY
						bModel.callFunction('/DraftToSO', {
							method : "GET",
							urlParameters: {
                		    	TestRun: false,
                    			HeaderDraftUUID: uuid,
                    			IsActiveEntity: true
                    		},					
							success : function( oData, oResponse){
								var messageList = that._extractSapItemMessages(oResponse);
								//var hasError = that._hasError(messageList);
								//orderDraft.draftUuid = oData.DraftUUID;                         
								var orderNumber = null;
								
								if (!!isSalesOrder){
									orderNumber = oData.vbeln; //sales order
									var addiMesssage = oData.message;
								} else {
									orderNumber = oData.PurchaseOrder; //Purchase Order 
								}
								callBack(orderNumber, index,  messageList );
							}, 
							error :  function(oError){
								var messageList = that._extractSapErrorMessage(oError);
								callBack(null, index, messageList);
							} 
						});

					} else {
						bModel = this.getPurV2Model();

						bModel.callFunction('/C_PurchaseOrderTPActivation', {
							method : "POST",
							urlParameters: {
                		    	PurchaseOrder: '',
                    			DraftUUID: uuid,
                    			IsActiveEntity: false
                    		},					
							success : function( oData, oResponse){
								var messageList = that._extractSapItemMessages(oResponse);
								//var hasError = that._hasError(messageList);
								//orderDraft.draftUuid = oData.DraftUUID;                         
								callBack(oData.PurchaseOrder, index,  messageList );
							}, 
							error :  function(oError){
								var messageList = that._extractSapErrorMessage(oError);
								callBack(null, index, messageList);
							} 
						});
					}
				}
			}, 

			activateDraftXXO : function(uuid, index, isSalesOrder, callBack){
				var that = this;
				var bModel = null;
				if (!!uuid){
					if(!!isSalesOrder){
						bModel = this.getSalesOrderModel();  //TODORY
						// var key = bModel.createKey('/draft_soHeaderSet', {
						// 	'HeaderDraftUUID' : uuid,
						// 	'IsActiveEntity' : true
						// });
						// var entry = bModel.createEntry(key, {
						// 	'HeaderDraftUUID' : uuid,
						// 	'IsActiveEntity' : true
						// });
						// //var obj = entry.getObject();
						var obj = {   "d":
							{	'HeaderDraftUUID' : uuid,
								'IsActiveEntity' : true,
								'headerToItemDraft' : {
    								'results' : [
    									 {
        								}
    								]
    							}
							}
						};

						bModel.create('/draft_soHeaderSet', obj, {
							success : function( oData, response){
								// prepare aDraft
								var aDraft = {};
								// aDraft.SalesOrganization = oData.SalesOrg;
								// aDraft.DistrChan = oData.DistributionChannel;
								// aDraft.Division = oData.Division;
								// aDraft.OrderType = oData.DocType;
								// aDraft.DraftUUID = oData.HeaderDraftUUID;
								// aDraft.Lines = 0;
							}, 
							error :  function(oError){
								var err = oError;
								// callback(data, false);
							} 
						});
					} else {
						bModel = this.getPurV2Model();

						bModel.callFunction('/C_PurchaseOrderTPActivation', {
							method : "POST",
							urlParameters: {
                		    	PurchaseOrder: '',
                    			DraftUUID: uuid,
                    			IsActiveEntity: false
                    		},					
							success : function( oData, oResponse){
								var messageList = that._extractSapItemMessages(oResponse);
								//var hasError = that._hasError(messageList);
								//orderDraft.draftUuid = oData.DraftUUID;                         
								callBack(oData.PurchaseOrder, index,  messageList );
							}, 
							error :  function(oError){
								var messageList = that._extractSapErrorMessage(oError);
								callBack(null, index, messageList);
							} 
						});
					}
				}
			}, 
			
			activateDraftOrder : function(iData, callBack){
				var that = this;
				var lv_hasError = false;
				var resourceBundle = this.getResourceBundle();

				var drafts = null;
				function isFinished() {
					var isFinished = true;
					if (!!drafts && drafts.length){
						for (var i1 = 0; i1 < drafts.length; i1++){
							if (!!!drafts[i1].pEnded){
								isFinished = false;
								return isFinished;
							}
						}		
					}
					return isFinished;
				}

				if (!!iData.associatedDrafts && iData.associatedDrafts.length > 0){
					drafts = iData.associatedDrafts;
					for (var i0 = 0; i0 < drafts.length; i0++){
						drafts[i0].pEnded = false;
						drafts[i0].hasError = false;
						drafts[i0].orderNumber = null;
						
						
						this.activateDraft(	drafts[i0].DraftUUID, i0, iData.isSalesOrder, function(orderNumber, index, messages){
							drafts[index].pEnded = true;
							if (!!orderNumber){
								drafts[index].orderNumber = orderNumber;
							} else {
								lv_hasError = true;
								drafts[index].hasError = true;
							}
							drafts[index].messages = messages;
							
							if(isFinished()){
								callBack(iData, lv_hasError );
							}
						});
					}
				}
			},
			
			validateDraftOrder : function(iData, callBack){
				var that = this;
				var lv_hasError = false;
				var resourceBundle = this.getResourceBundle();
 
				var drafts = null;
				function isFinished() {
					var isFinished = true;
					if (!!drafts && drafts.length){
						for (var i1 = 0; i1 < drafts.length; i1++){
							if (!!!drafts[i1].pEnded){
								isFinished = false;
								return isFinished;
							}
						}		
					}
					return isFinished;
				}
				
				if (!!iData.associatedDrafts && iData.associatedDrafts.length > 0){
					drafts = iData.associatedDrafts;
					for (var i0 = 0; i0 < drafts.length; i0++){
						drafts[i0].pEnded = false;
						drafts[i0].hasError = false;
						drafts[i0].messages = null;
						that.validateDraft(drafts[i0].DraftUUID, i0, function(hasError, index, messages){
							drafts[index].pEnded = true;
							drafts[index].hasError = hasError;
							if (!!hasError){
								lv_hasError = true;
							} else {
								if (drafts[index].Lines < 1 ){
									lv_hasError = true;
									if(!!!messages){
										messages = [];
									}
									messages.push({
										code : 'F001',
										message : resourceBundle.getText('Message.Failed.EmptyLine.Draft', [drafts[index].DraftUUID] ),			
										severity :  'error'
									});
								}
							}
							
							drafts[index].messages = messages;
							if(isFinished()){
								callBack(iData, lv_hasError );
							}
						});
					}
				} 
			},
			
			_hasError : function(messageList){
				var hasError = false;
				if(!!messageList && messageList.length > 0){
					for (var i = 0; i < messageList.length; i++){
						if (messageList[i].severity === 'error'){
							hasError = true;
							return hasError;
						}
					}
				}
				return hasError;				
			},
			
			validateDraft : function(uuid, index, callBack){
				var that = this;
				
				if (!!uuid){
					var bModel = this.getPurV2Model();

					bModel.callFunction('/C_PurchaseOrderTPValidation', {
						method : "GET",
						urlParameters: {
                	    	PurchaseOrder: '',
                    		DraftUUID: uuid,
                    		IsActiveEntity: false
                    	},					
						success : function( oData, oResponse){
							var messageList = that._extractSapItemMessages(oResponse);
							var hasError = that._hasError(messageList);
							//orderDraft.draftUuid = oData.DraftUUID;                         
							callBack(hasError,index, messageList );
						}, 
						error :  function(oError){
						//	var messageList = that._extractSapItemMessages(oResponse);
							var err = oError;
							callBack(true,index,null);
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