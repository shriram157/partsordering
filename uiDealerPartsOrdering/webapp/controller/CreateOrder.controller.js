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
	var CONST_VIEW_MODEL = 'viewModel';
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
	
				//view model 
				var viewState = { filterPanelEnable : false, contHigh : "60%"};
				var viewModel = new JSONModel();
				viewModel.setData(viewState);
				this.setModel(viewModel, CONST_VIEW_MODEL);

				this.draftInd = this.byId('draftInd');
				this.itemTable = this.byId('idProductsTable');
				// make sure the dealer information is there
				this.checkDealerInfo();
			},
			
			
			_onObjectMatched: function (oEvent) {
				// clear all the other message 
				var that = this;

				sap.ui.getCore().getMessageManager().removeAllMessages();
				if(!this.checkDealerInfo()){
					return;
				}
				
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');

				// load the model ... 
				var orderType = oEvent.getParameter("arguments").orderType;
				var orderNum = oEvent.getParameter("arguments").orderNum;

				var orderData = this.initLocalModels(orderType, orderNum.trim());	
				var model = new sap.ui.model.json.JSONModel();
				model.setData(orderData);
				this.setModel(model,CONT_ORDER_MODEL );

				// start show busy
				sap.ui.core.BusyIndicator.show(0);				
				var infoRecordModel = this.getProductModel();
				this.setModel(infoRecordModel, CONT_INFOREC_MODEL);

				// get the company code for the default purcahse org
				this.getCompanyCodeByPurcahseOrg(orderData.purchaseOrg, function(companyCode){
					orderData.companyCode = companyCode;
				});
				
				this.getStorageInfo(orderData.purBpCode, function(data){
					// populate the rest of field
					if (!!data && !!orderData.purBpCode){
						orderData.sloc = data.SLoc;
						orderData.revPlant = data.Plant;
					}
				
					that.loadDealerDraft(orderData.dealerCode , orderData, function(rData){
						for (var x = 0; x < rData.items.length; x++){
							rData.items[x].colorCode = that.getMessageColor(rData.items[x].messages); 
							rData.items[x].iconUrl = 'sap-icon://delete';
							rData.items[x].messageLevel = that.getMessageLevel(rData.items[x].messages); 
						}

						model.setData(rData);
						that.setModel(model,CONT_ORDER_MODEL );
						sap.ui.core.BusyIndicator.hide();
					});
				});               
			}, 

			initLocalModels : function(orderType, orderNum){
				// default mode
				var appStateModel = this.getStateModel();

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
				
				//default
				orderData.purchasingGroup = '150';
				orderData.purchaseOrg = '7019';

				orderData.associatedDrafts = [];
				orderData.items = [];

				// calculated filed
				orderData.totalLines = 0;
				return orderData;
			},


			_getNewLine : function(){
				return {
					selected : false,
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
				that.getInfoFromPart(sValue, model.getProperty('/revPlant'), function(item1Data){
					if (!!item1Data){
						newline[0].itemCategoryGroup = item1Data.itemCategoryGroup;
						newline[0].division = item1Data.division;
						newline[0].partDesc = item1Data.partDesc;
						newline[0].supplier = item1Data.supplier;
						newline[0].purInfoRecord = item1Data.purInfoRecord;
						newline[0].companyCode = item1Data.companyCode;
						newline[0].currency = item1Data.currency;
						newline[0].netPriceAmount = item1Data.netPriceAmount;
						newline[0].taxCode = item1Data.taxCode;
						newline[0].spq = item1Data.spq;
					} else {
						newline[0].itemCategoryGroup = "";
						newline[0].division = "";
						newline[0].partDesc = "";
						newline[0].supplier = "";
						newline[0].purInfoRecord = "";
						newline[0].companyCode = "";
						newline[0].currency = 'CAD';
						newline[0].netPriceAmount = "";
						newline[0].taxCode = "";
						newline[0].spq = "";
					}
					model.setProperty('/newline',newline);
				});
				
            },

            handleProductChangeX : function(oEvent){
            	var that = this;
                var sValue = oEvent.getParameter("newValue"); 
            	var model = this.getModel(CONT_ORDER_MODEL );
            	var newline = model.getProperty('/newline');


            	// step A1
				that.getPartsInfoById(sValue, function(item1Data){
					if(!!item1Data){
						newline[0].itemCategoryGroup = item1Data.ItemCategoryGroup;
						if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length >0 ){
							for(var x1 = 0; x1 < item1Data.to_SalesDelivery.results.length; x1++ ){
								// rounding profile  -- get the first one then			            	
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
				
            	this.getZMaterialById(sValue, function(data){
            		if (!!data){
						newline[0].division = data.Division ;
						newline[0].partDesc = data.MaterialName ;
						model.setProperty('/newline',newline);
						
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
		        	    	newline[0].supplier = lv_supplier;
							newline[0].purInfoRecord = lvPurchasingInfoRecord; 
							model.setProperty('/newline',newline);
							
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
            
 			handleAddPart : function(oEvent){
				var that  = this;
				var model = this.getModel(CONT_ORDER_MODEL);
				var iData = model.getData();
				
				// TODO-- check the values, warning message..
				var resourceBundle = this.getResourceBundle();				
				var failedtext = resourceBundle.getText('Message.Failed.Add.Part');
				sap.ui.core.BusyIndicator.show(0);				
				this.draftInd.showDraftSaving();
				this.createOrderDraft(iData,  function(rData, isOk){
					if(isOk){
						// this step, all good, move the new line to to items
						rData.newline = [that._getNewLine()];
						rData.totalLines = rData.items.length;
						// ---to save some newwork traffic
						rData.modifiedOn = new Date();
						model.setData(rData);
						that.draftInd.showDraftSaved();
					} else { 
						MessageBox.error(failedtext,  {
							onClose: function(sAction){
								//TODO??
							}
						});
					}
 					sap.ui.core.BusyIndicator.hide();
				});
			},
			
			toggleSelect : function(oEvent){
				var that = this;
    			var isSelected = oEvent.getParameters("Selected").selected; 
    			var model = this.getModel(CONT_ORDER_MODEL);
    			var data = model.getData();
    			for (var i = 0; i < data.items.length; i++){
    				data.items[i].selected =isSelected;
    			}
    			model.setData(data);
			},
			
			toggleRowSelect : function(oEvent){
				var that = this;
    			var model = this.getModel(CONT_ORDER_MODEL);
        		var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
    			var obj = model.getProperty(path);		
    			var isSelected = oEvent.getParameters("Selected").selected; 
    			var row = oEvent.getSource().getParent();
    			var table = oEvent.getSource().getParent().getTable();
    			if (isSelected){
    				table.setSelectedItem(row, true);
    			} else {
    				table.setSelectedItem(row, false);
    			}
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
				this.draftInd.showDraftSaving();
        		this.activateDraft(model.getData(), function(rData, messageList){
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
					sDetails,
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
			
			onQtyChange : function(oEvent){
				var that = this;
    			var model = this.getModel(CONT_ORDER_MODEL);
        		var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
    			var obj = model.getProperty(path);		
    			var newValue = oEvent.getParameter("newValue"); 
    			
				this.draftInd.showDraftSaving();

    			this.updateOrderDraftItem([obj.uuid, obj.line], {'OrderQuantity' : newValue}, function(data, messageList){
    				obj.messages = messageList;
    				obj.colorCode = that.getMessageColor(messageList);
    				obj.iconUrl = 'sap-icon://e-care';
  					obj.messageLevel = that.getMessageLevel(messageList);   				
    				model.setProperty(path, obj);
    				that.draftInd.showDraftSaved();
    			});             
				
			},
			
			onCommentChange : function(oEvent){
				var that = this;
    			var model = this.getModel(CONT_ORDER_MODEL);
        		var path = oEvent.getSource().getBindingContext(CONT_ORDER_MODEL).getPath();
    			var obj = model.getProperty(path);				
    			var newValue = oEvent.getParameter("newValue"); 
				this.draftInd.showDraftSaving();
    			this.updateOrderDraftItem([obj.uuid, obj.line], {'ZZ1_LongText_PDI' : newValue}, function(data, messageList){
    				obj.messages = messageList;
    				obj.colorCode = that.getMessageColor(messageList);
    	    		obj.iconUrl = 'sap-icon://e-care';			
  					obj.messageLevel = that.getMessageLevel(messageList);   				
    				model.setProperty(path, obj);
    				that.draftInd.showDraftSaved();
    			});             
				
			},
			
			handleDeletePart : function(oEvent){
				var that = this;
    			var model = this.getModel(CONT_ORDER_MODEL);
    			
    			var todoList = [];
    			var deletedList ={};
    			deletedList.count = 0;
    			var failedList = {};
    			failedList.count = 0;
    			
    			var rData = model.getData();
    			var items = rData.items;
    			var newItems = [];
    			
    			if (!!items && items.length >0){
    			
	    			//sap.ui.core.BusyIndicator.show(0);				
					this.draftInd.showDraftSaving();
    				for (var i=0; i < items.length; i++ ){
    					if (items[i].selected){
    						todoList.push(items[i].uuid);
    						this.deleteOrderDraftItem([items[i].uuid, items[i].line], function(keys, isOk, messages){
    							// only failed record will be returning message. message of good one will be ignored
    							if(isOk){
    								deletedList[keys[0]] = keys;
    								deletedList.count = deletedList.count +1;
    							} else {
    								failedList[keys[0]] = messages;				
    								failedList.count = failedList.count +1;
    							}
    							
    							if (todoList.length <= (deletedList.count + failedList.count) ){
    								// create new items 
	    							for(var y = 0; y < items.length; y++){
	    								if(!!deletedList[items[y].uuid]){
	    									// n	
	    								} else {
	    									newItems.push(items[y]);
	    								}
	    							}	
	    							for(var z = 0; z < newItems.length; z++){
	    								if(!!failedList[newItems[z].uuid]){
	    									newItems[z].messages = newItems[z].messages.concat(newItems[z].messages);
	    								}
	    							}
	    							rData.items = items;
	    							rData.totalLines = rData.items.length;
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

			onBack : function(oEvent){
				var that = this;
				this.draftInd.clearDraftState();
				that.getRouter().navTo("FindOrder", null, false);
			}			
		});
		
	}
);