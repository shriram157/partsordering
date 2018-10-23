sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",	
	"tci/wave2/ui/parts/ordering/model/formatter"	
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel, MessageBox, formatter) {
	"use strict";
	var CONT_ORDER_MODEL = "orderModel";	
	var CONT_INFOREC_MODEL = "infoRecordModel";
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CreateOrder", {

			formatter: formatter,
			
			onInit : function () {

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
	
				// initial view model later on 	
	
				// make sure the dealer information is there
				this.checkDealerInfo();
			},
			
			
			_onObjectMatched: function (oEvent) {
				// clear all the other message 
				sap.ui.getCore().getMessageManager().removeAllMessages();
				if(!this.checkDealerInfo()){
					return;
				}
				
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');
				
				// load the model ... 
				var orderType = oEvent.getParameter("arguments").orderType;
				var orderNum = oEvent.getParameter("arguments").orderNum;
				
				this.initLocalModels(orderType, orderNum.trim());	
			}, 

			initLocalModels : function(orderType, orderNum){
				var that = this;
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);

				//var infoRecordModel = this.getInfoRecordModel();
				var infoRecordModel = this.getProductModel();
				this.setModel(infoRecordModel, CONT_INFOREC_MODEL);
				//this.setModel(infoRecordModel);
				
				var orderData = {};

				// main section for the order - will not affect by record in the system
				orderData.orderTypeId =  orderType;
				orderData.orderTypeName =  this.getOrderTypeName(orderData.orderTypeId);
				orderData.tciOrderNumber = orderNum;
				orderData.purBpCode = appStateModel.getProperty('/selectedBP/bpNumber');
				orderData.dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');

				orderData.newline = [this._getNewLine()];
				
				orderData.createDate = new Date();
				orderData.modifiedOn = new Date();

	
				// maybe deleted
				orderData.submittedDate = null;
				orderData.statusCode = 'DF';
				orderData.documentCurrency = 'CAD';
				orderData.purchasingGroup = '150';

				orderData.associatedDrafts = [];
				orderData.items = [];

				// calculated filed
				orderData.totalLines = 0;

				this.getStorageInfo(orderData.purBpCode, function(data){
					// populate the rest of field
					if (!!data && !!orderData.purBpCode){
						orderData.sloc = data.SLoc;
						orderData.revPlant = data.Plant;
					}
				
					that.loadDealerDraft(orderData.dealerCode , orderData, function(rData){
						var model = new sap.ui.model.json.JSONModel();
						model.setData(rData);
						that.setModel(model,CONT_ORDER_MODEL );
						
					});

				
					
				});               
			},
		
			_getNewLine : function(){
				return {
					line : '',
					partNumber:'',
					partDesc:"",
					spq:'',
					qty:0,
					fillBo: 0,
					comment :"",
					companyCode : "",
					purcahseOrg : "",
					itemCategoryGroup :''
				};
			},
						
			handleSuggest: function(oEvent) {
                        var sTerm = oEvent.getParameter("suggestValue");
                        var aFilters = [];
                        if (sTerm) {
                            aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.StartsWith, sTerm));
                        }
                    	oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            },
            
            handleProductChange : function(oEvent){
            	var that = this;
                var sValue = oEvent.getParameter("newValue"); 
            	var model = this.getModel(CONT_ORDER_MODEL );
            	var newline = model.getProperty('/newline');

            	// step a1
				that.getPartsInfoById(sValue, function(item1Data){
					if(!!item1Data){
						newline[0].itemCategoryGroup = item1Data.ItemCategoryGroup;
						if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length >0 ){
							for(var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++ ){
								// rounding profile  ??			            	
    	    			    	that.getRoundingprofileOFVendor(sValue, 
        				    		item1Data.to_SalesDelivery.results[x1].ProductSalesOrg,
        				    		item1Data.to_SalesDelivery.results[x1].ProductDistributionChnl,
        				    		function(item2Data){
										if(!!item2Data && !!item2Data.Item && !!item2Data.Item.Roundingprofile){
											newline[0].spq = item2Data.Item.Roundingprofile;
											model.setProperty('/newline',newline);
										}
								});
							}
						}
					}
				});
				
				
            	//this.getPartsInfoById(sValue, function(data){
            	this.getZMaterialById(sValue, function(data){
            		if (!!data){
						newline[0].division = data.Division ;
						newline[0].partDesc = data.MaterialName ;
						model.setProperty('/newline',newline);
						
						var infoRecord = null;
						// find the infoReord
	            		if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
							for (var i=0;i < data.to_PurchasingInfoRecord.results.length; i++){
								infoRecord = data.to_PurchasingInfoRecord.results[i];
								if ( infoRecord.IsDeleted){
									infoRecord = null;
							 	} else {
							 		break;
							 	}
							}						
						}
						
						
//	            		if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
						if(!!infoRecord && !infoRecord.IsDeleted){
	            			// get the first record only. 
		        	    	var lv_supplier = infoRecord.Supplier;
            				var lvPurchasingInfoRecord = infoRecord.PurchasingInfoRecord;
		        	    	newline[0].supplier = lv_supplier;
							newline[0].purInfoRecord = lvPurchasingInfoRecord; 
							model.setProperty('/newline',newline);
            				that.getSupplierCompanyCode(lv_supplier, function(o1Data){
            					if (!!o1Data && !!o1Data.to_CustomerCompany &&!!lv_supplier){
            						newline[0].companyCode =o1Data.to_CustomerCompany.CompanyCode;
									model.setProperty('/newline',newline);
            					} 
            				});
            				that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord, 
            												"7019",
            												model.getProperty('/revPlant'),
            					function(cData){
            					if (!!cData && !!lvPurchasingInfoRecord){
            						newline[0].currency =cData.Currency;
            						newline[0].netPriceAmount = cData.NetPriceAmount;
            						newline[0].taxCode = cData.TaxCode;
									model.setProperty('/newline',newline);

            					} 
            				});
								
            				
           			}
            			
            		}

            	});
            }, 
            
 			handleAddPart : function(oEvent){
				var that  = this;
				var model = this.getModel(CONT_ORDER_MODEL);
				var iData = model.getData();
				this.createOrderDraftItem(iData,  function(rData){
					// this step, all good, move the new line to to items
					iData.items.push(iData.newline[0]);
					iData.totalLines = iData.items.length;
					iData.newline = [that._getNewLine()];
					
					model.setData(iData);
				});
			},
			
			onDelete : function(oEvent){
            	var that = this;
            	var orderModel = this.getModel(CONT_ORDER_MODEL );
            	var orderData = orderModel.getData();

				// prepare the to do list
				var todoList = [];
				if (!!orderData.associatedDrafts && orderData.associatedDrafts.length > 0){
					for (var y = 0; y < orderData.associatedDrafts.length; y++ ){
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
					onClose: function(sAction) {
						if(sap.m.MessageBox.Action.OK === sAction){
							if (!!todoList && !!todoList.length && todoList.length > 0){
								sap.ui.core.BusyIndicator.show(0);
								for (var i = 0; i < todoList.length; i++){
									that.deleteDraft(todoList[i], function(uuid, status){
										if (status){
											processedList.push(uuid);
											successList.push(uuid);
										} else {
											processedList.push(uuid);
											failedList.push(uuid);
										}
										
										// all the draft deleted 
										if (todoList.length <=processedList.length ){
											if (failedList.length > 0){
												MessageBox.error(failedtext,  {
													onClose: function(sAction){
														sap.ui.core.BusyIndicator.hide();
														
													}
												});
											} else {
												//we are Ok, then move to add order
												MessageBox.success(successtext,  {
													onClose: function(sAction){
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
			
			onActivate : function(oEvent){
            	var that = this;
            	var model = this.getModel(CONT_ORDER_MODEL );
        		this.activateDraft(model.getData(), function(rData){
        			if (!!rData ){
    	    			var lv_data = rData;
	        			var orderNNumber = lv_data.PurchaseOrder;
        				var messsage = "Order " + orderNNumber + "created";
        				that._showActivationOk(messsage);
        			}
        		});
            },

			_showActivationOk : function (sDetails) {
				var that = this;
				MessageBox.success(
					this._sErrorText,
					{
						id : "okMessageBox",
						details : sDetails,
						styleClass : this.getOwnerComponent().getContentDensityClass(),
						actions : [MessageBox.Action.CLOSE],
						onClose : function (sAction) {
							that.getRouter().navTo("StartOrdering", null, false);
						}.bind(this)
					}
				);
			},
			
			_setVaulesBasedonProduct : function(newValue){
				
			},  


			

			onBack : function(event){
				var that = this;
				that.getRouter().navTo("FindOrder", null, false);
			}			
		});
		
	}
);