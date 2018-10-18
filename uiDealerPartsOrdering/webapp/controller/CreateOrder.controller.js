sap.ui.define([
	"tci/wave2/ui/parts/ordering/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	"tci/wave2/ui/parts/ordering/model/formatter"	
], function(BaseController, MessagePopover, MessageItem, Link, JSONModel, formatter) {
	"use strict";
	var CONT_ORDER_MODEL = "orderModel";	
	var CONT_INFOREC_MODEL = "infoRecordModel";
	return BaseController.extend("tci.wave2.ui.parts.ordering.controller.CreateOrder", {

			formatter: formatter,
			
			onInit : function () {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("CreateOrder").attachPatternMatched(this._onObjectMatched, this);
				
				this.oSF = this.byId("productInput");

			},
			
			
			_getNewLine : function(){
				return {
					partNumber:'',
					partDesc:"",
					spq:'',
					qty:0,
					fillBo: 0,
					comment :""
				};
			},
			
			_onObjectMatched: function (oEvent) {
				var appStateModel = this.getStateModel();
				appStateModel.setProperty('/tabKey', 'CO');
				this.initLocalModels();	
				//var oItem = this.byId('iconTabHeader');
			}, 
			
			handleSuggest: function(oEvent) {
                        var sTerm = oEvent.getParameter("suggestValue");
                        var aFilters = [];
                        if (sTerm) {
                            aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.StartsWith, sTerm));
                        }
                        // this.getModel(CONT_INFOREC_MODEL).filter(aFilters);
                        //oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
                    	oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
                        //this.oSF.getBinding("suggestionItems").filter(aFilters);
            },
            
            handleProductChange : function(oEvent){
            	var that = this;
                var sValue = oEvent.getParameter("newValue");
            	
            	var model = this.getModel(CONT_ORDER_MODEL );
				model.setProperty('/newline/companyCode', "");
				model.setProperty('/newline/purcahseOrg', ""); 
            	
            	// step a1
				that.getPartsInfoById(sValue, function(item1Data){
					if(!!item1Data){
						model.setProperty('/newline/itemCategoryGroup',item1Data.ItemCategoryGroup );
						if (!!item1Data.to_SalesDelivery.results && item1Data.to_SalesDelivery.results.length >0 ){
							// take the first one
							// rounding profile  ??			            	
        			    	that.getRoundingprofileOFVendor(sValue, 
        			    		item1Data.to_SalesDelivery.results[0].ProductSalesOrg,
        			    		item1Data.to_SalesDelivery.results[0].ProductDistributionChnl,
        			    		function(item2Data){
								if(!!item2Data){
								}
							});
						}
					}
				});
				
				
            	//this.getPartsInfoById(sValue, function(data){
            	this.getZMaterialById(sValue, function(data){
            		if (!!data){
    	       			model.setProperty('/newline/division',data.Division );           			
        	   			model.setProperty('/newline/partDesc',data.MaterialName );


	            		if (!!data.to_PurchasingInfoRecord.results && data.to_PurchasingInfoRecord.results.length > 0) {
	            			// get the first record only. 
		        	    	var lv_supplier = data.to_PurchasingInfoRecord.results[0].Supplier;
        		    		model.setProperty('/newline/supplier', lv_supplier);
            				that.getSupplierCompanyCode(lv_supplier, function(o1Data){
            					if (!!o1Data && !!o1Data.to_CustomerCompany &&!!lv_supplier){
            						model.setProperty('/newline/companyCode', o1Data.to_CustomerCompany.CompanyCode);
            					} 
            				});
            				var lvPurchasingInfoRecord = data.to_PurchasingInfoRecord.results[0].PurchasingInfoRecord;
            				that.getPriceInfoFromInfoRecord(lvPurchasingInfoRecord, 
            												"7019",
            												model.getProperty('/revPlant'),
            					function(cData){
            					if (!!cData && !!lvPurchasingInfoRecord){
            						model.setProperty('/newline/currency', cData.Currency);
            						model.setProperty('/newline/netPriceAmount', cData.NetPriceAmount);
            						model.setProperty('/newline/taxCode', cData.TaxCode);
            					} 
            				});
								
							// for (var i=0;i < data.to_PurchasingInfoRecord.results.length; i++){
							// 	if (i === 0){
									
							// 	} 
								
							// }
            				
            				
            				
            			}
            			
            		}
            		

            	});
            }, 
            
            activateOrder : function(oEvent){
            	var model = this.getModel(CONT_ORDER_MODEL );
        		this.activateDraft(model.getData(), function(rData){
        			var lv_data = rData;
        		});
            },
            
 			handleAddPart : function(oEvent){
				var that  = this;
				var model = this.getModel(CONT_ORDER_MODEL);
				var iData = model.getData();
				this.createOrderDraftItem(iData,  function(rData){
					// this step, all good, move the new line to to items
					iData.items.push(iData.newline);
					iData.totalLines = iData.items.length;
					iData.newline = that._getNewLine();
					
					model.setData(iData);
				});
			},
			
			_setVaulesBasedonProduct : function(newValue){
				
			},  
			
			initLocalModels : function(){
				var that = this;
				// default mode
				var appStateModel = this.getStateModel();
				this.getView().setModel(appStateModel);

				//var infoRecordModel = this.getInfoRecordModel();
				var infoRecordModel = this.getProductModel();
				this.setModel(infoRecordModel, CONT_INFOREC_MODEL);
				//this.setModel(infoRecordModel);
				
				var orderData = {};
				orderData.orderTypeId =  appStateModel.getProperty('/selectedOrderMeta/order_type');
				orderData.orderTypeName =  this.getOrderTypeName(orderData.orderTypeId);
				orderData.tciOrderNumber = appStateModel.getProperty('/selectedOrderMeta/order_id');
				orderData.createDate = new Date();
				orderData.submittedDate = null;
				orderData.totalLines = 0;
				orderData.statusCode = 'DF';
				orderData.documentCurrency = 'CAD';
				orderData.purchasingGroup = '150';
				orderData.purBpCode = appStateModel.getProperty('/selectedBP/bpNumber');
				orderData.dealerCode = appStateModel.getProperty('/selectedBP/dealerCode');

				orderData.includedDraftHeads = [];
				orderData.includedOrderHeads = [];

				orderData.newline = this._getNewLine();

				orderData.items = [];
				
				this.getStorageInfo(orderData.purBpCode, function(data){
					// populate the rest of field
					if (!!data && !!orderData.purBpCode){
						orderData.sloc = data.SLoc;
						orderData.revPlant = data.Plant;
					}
				
					var model = new sap.ui.model.json.JSONModel();
					model.setData(orderData);
					that.setModel(model,CONT_ORDER_MODEL );
					
				});               
				

			},
			
			onBack : function(event){
				var that = this;
				// check the information entered here
				
//				that.getRouter().navTo("CreateOrder", draftData, false);
				that.getRouter().navTo("StartOrdering", null, false);
				var validator = new Validator();

        // Validate input fields against root page with id ‘somePage’

        if (validator.validate(this.getView())) {

            // perform the actual form submit here

        }
				// var vModel = this.getView().getModel();
				// this.createOrderDraft(vModel.getData(), function(draftData){
				// 	that.getRouter().navTo("CreateOrder", draftData, false);
				// });
			}			
		});
		
	}
);