sap.ui.define([], function () {
	"use strict";

	var _baseController = null;
	var _ownerComponent = null;
	var _resourceBundle = null;
	var _productModel = null;
	var _zproductModel = null;
	var _apiproductModel = null;
	var _inforecordModel = null;
	var _zmaterialModel = null;
	var _zcstoragelocModel = null;
	var _purchaseorderModel = null;
	var _zpurev2Model = null;
	var _partdescModel = null;
	var _sLang = null;
	var _cachedProductObj = {};
	var _orderData = null;
	var _salesorderModel = null;
	var _aSuppliersZloc = [];
	var _aCreateUB = [];
	//var _oBusyDialog = null;
	//var _bDraftUB = false;
	//_cachedMObj.exist = true;

	return {
		init: function (oBaseController, oOwnerComponent, oresourceBundle, sLang) {
			//_modelBase = oDataModel;
			//_modelBase.setCountSupported(false);
			_baseController = oBaseController;
			_ownerComponent = oOwnerComponent;
			_resourceBundle = oresourceBundle;
			_sLang = sLang;
		},

		setOrderData: function (oOrderData) {
			_orderData = oOrderData;
		},

		getOrderData: function () {
			return _orderData;
		},

		getProductModel: function () {
			return _ownerComponent.getModel("MD_PRODUCT_OP_SRV");
		},

		getZProductModel: function () {
			return _ownerComponent.getModel("ZMD_PRODUCT_FS_V2_SRV");
		},

		getApiProductModel: function () {
			return _ownerComponent.getModel("API_PRODUCT_SRV");
		},

		getInfoRecordModel: function () {
			return _ownerComponent.getModel("MM_PUR_INFO_RECORDS_MANAGE_SRV");
		},

		getZCStorLocationModel: function () {
			return _ownerComponent.getModel("ZC_STOR_LOCN_CDS");
		},

		//BP Model 	
		getApiBPModel: function () {
			return _ownerComponent.getModel("API_BUSINESS_PARTNER");
		},

		// Sale Order model 
		getSalesOrderModel: function () {
			_salesorderModel = _ownerComponent.getModel("ZC_CREATE_SO_SRV");
		},

		// PO related	
		getPurV2Model: function () {
			return _ownerComponent.getModel("MM_PUR_PO_MAINT_V2_SRV");
		},

		// new PO Model
		getPurchaseOrderModel: function () {
			_purchaseorderModel = _ownerComponent.getModel("API_PURCHASEORDER_PROCESS_SRV");
		},

		getZCMATERIALModel: function () {
			_partdescModel = _ownerComponent.getModel("Z_SEARCH_HELPS_SRV");
		},

		setCachedProductObj: function (productNumber, productObj) {
			_cachedProductObj[productNumber] = productObj;
		},

		getCachedProductObj: function (productNumber) {
			return _cachedProductObj[productNumber];
		},

		getMaterialById: function (id, callback) {
			var bModel = this.getProductModel();
			var DraftId="00000000-0000-0000-0000-000000000000"; // added by ReddyVi - defect #17564
			var key = bModel.createKey('/C_Product', {
				'Product': id,
				"DraftUUID": DraftId,
				"IsActiveEntity":true
			});
			bModel.read(key, {
				urlParameters: {
					"$expand": "to_Plant,to_PurchasingInfoRecord,to_Supplier"
				},
				success: function (oData, oResponse) {
					if (!!oData) {
						callback(oData);
					} else {
						callback(null);
					}
				},
				error: function (err) {
					// error handling here
					callback(null);
				}
			});
		},

		getPartDescSPQForPart: function (sValue, oItem, callbackFn) {
			var that = this;
			var oItemData = this.getCachedProductObj(sValue);
			if (oItemData) {
				callbackFn(oItemData, oItem);
			} else {

				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("MaterialNumber", sap.ui.model.FilterOperator.EQ, sValue);
				oFilter[1] = new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, _orderData.SalesOrganization || '7000');
				oFilter[2] = new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, _orderData.DistributionChannel || '10');
				//oFilter[3] = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, stoSupplyingPlant);
				oFilter[3] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, _sLang);

				if (!_partdescModel) {
					this.getZCMATERIALModel();
				}
				_partdescModel.read("/ZC_MATERIAL_SPQ", {
					filters: new Array(new sap.ui.model.Filter({
						filters: oFilter,
						and: true
					})),
					success: function (oData, oResponse) {
						if (!!oData && !!oData.results && oData.results.length > 0) {
							that.setCachedProductObj(sValue, oData.results);
							callbackFn(oData.results, oItem);
						} else {
							callbackFn(null, oItem);
							// return error or no data ? 

						}

					},
					error: function (err) {

						var errorResponse = JSON.parse(err.responseText);
						var errMessage = errorResponse.error.message.value;
						callbackFn(err, "SalesHeaderCreate", -1, false, errMessage);

					}
				});

			}

		}, //getPartDescSPQ End

		saveDraftSalesOrder: function (t, aCreateItems, aUpdateItems, callbackFn) {
			if (aCreateItems.length > 0 && aCreateItems.length !== 0) {
				this._createSalesOrder(t, aCreateItems, callbackFn);
			}
			if (aUpdateItems.length > 0 && aUpdateItems.length !== 0) {
				this._updateSalesOrder(t, aUpdateItems, callbackFn);

			}
		},

		_createSalesOrder: function (t, aCreateItems, callbackFn) {
			var that = this;
			//var lv_orderType = this.getRealOrderTypeByItemCategoryGroup( items[0].itemCategoryGroup , data.isSalesOrder, data.orderTypeId );
			var aDraft = null;
			//first of all, let us find the existing order header, 
			//Sales Order will have only one associated Draft

			if (_orderData.associatedDrafts && _orderData.associatedDrafts.length === 1) {
				aDraft = _orderData.associatedDrafts[0];
			} else {
				aDraft = null;
				if (!_salesorderModel) {
					this.getSalesOrderModel();
				}
				var entry = _salesorderModel.createEntry('/draft_soHeaderSet', {});
				var obj = entry.getObject();

				// populate the values
				//var division = jQuery.sap.getUriParameters().get('Division');
				obj.Division = _orderData.Division;
				obj.SalesOrg = _orderData.SalesOrganization;
				obj.DistrChan = _orderData.DistributionChannel;
				var dealerCode = t.getStateModel().getProperty('/userProfile').dealerCode;

				t.getBusinessPartnersByDealerCode(dealerCode, function (sData) {
					obj.SoldtoParty = sData.BusinessPartner;
					obj.PurchNoC = _orderData.tciOrderNumber;
					obj.DocType = _orderData.items[1].OrderType;
					console.log({"payload" : obj});
					console.table(obj);
					_salesorderModel.create('/draft_soHeaderSet', obj, {
						success: function (oData, response) {
							console.log({"Data after save draft" : oData});
							console.log({"Response after save draft" : response});
							// prepare aDraft
							aDraft = {};
							aDraft.SalesOrganization = oData.SalesOrg;
							aDraft.DistributionChannel = oData.DistrChan;
							aDraft.Division = oData.Division;
							aDraft.OrderType = oData.DocType;
							aDraft.DraftUUID = oData.HeaderDraftUUID;
							aDraft.Lines = 0;
							_orderData.associatedDrafts.push(aDraft);
							that._createSalesOrder(t, aCreateItems, callbackFn);
							//Callback This function
						},
						error: function (oError) {
							var errorResponse = JSON.parse(oError.responseText);
							var errMessage = errorResponse.error.message.value;
							callbackFn(aCreateItems[0], "Create", -1, false, errMessage);
						}
					});
				});
			}
			//Header Draft Available
			if (!!aDraft) {
				var IIndex = 0;
				var getCreateItemIndex = function () {
					return IIndex;
				};

				if (!_salesorderModel) {
					this.getSalesOrderModel();
					//_salesorderModel.setUseBatch(false);
				}

				for (var itemNo = 0; itemNo < aCreateItems.length; itemNo++) {

					// check if its a Update or New 
					var salesItem = JSON.parse(JSON.stringify(aCreateItems[itemNo]));
					//else if (salesItem.ItemStatus = 'unSaved' && (!salesItem.uuid) //undefined/null true ) {
					//Create	

					var entry = _salesorderModel.createEntry('/draft_soItemSet', {});

					// item level data
					var obj = entry.getObject();
					obj.HeaderDraftUUID = aDraft.DraftUUID;

					//obj.TargetQty = items[0].qty.toString();                //*
					obj.TargetQty = salesItem.qty.toString() || "0"; //*
					obj.Material = salesItem.partNumber; //*  
					obj.Comments = salesItem.comment;
					obj.MatDesc = salesItem.partDesc;
					if (!!_orderData.typeD) { // Campiagn
						obj.Zzcampaign = salesItem.campaignNum || "";
						obj.Zzopcode = salesItem.opCode || "";
						obj.VIN_no = salesItem.vin || "";
					} else if (!!_orderData.typeB) {
						if (salesItem.contractNum) {
							obj.RefDoc = salesItem.contractNum.toString() || "";
							obj.RefDocItemNo = salesItem.contractLine || "";
						} else {
							obj.RefDoc = "";
							obj.RefDocItemNo = "";
						}
					} else if(_orderData.orderTypeId !="3"  && !!sap.ui.getCore().getModel("CPORCBModel").getData()){
						obj.Zzcampaign = salesItem.campaignNum || "";
					//	obj.Zzopcode = salesItem.opCode || "";
						obj.VIN_no = salesItem.vin || "";
					} else {
						obj.Zzcampaign = salesItem.campaignNum || "";
						obj.Zzopcode = salesItem.opCode || "";
						obj.VIN_no = salesItem.vin || "";
					}

					console.log({"payload for draft soItem" : obj});
					console.table(obj);

					_salesorderModel.create('/draft_soItemSet', obj, {
						success: function (oData, oResponse) {
							console.log({"after Success draft soItem data" : oData});
							console.log({"after Success draft soItem Response" : oResponse});
							aCreateItems[0]["uuid"] = oData.ItemDraftUUID;
							aCreateItems[0]["parentUuid"] = oData.HeaderDraftUUID;
							aCreateItems[0]["ItmNumber"] = oData.ItmNumber;
							callbackFn(aCreateItems[0], "Create", 0, true);
						},
						error: function (oError) {
							var errorResponse = JSON.parse(oError.responseText);
							var errMessage = errorResponse.error.message.value;
							callbackFn(aCreateItems[0], "Create", 0, false, errMessage);
						}
					});

				}
			} //for end	
		},

		_updateSalesOrder: function (t, aUpdateItems, callbackFn) {
			var IIndex = 0;
			var getUpdateItemIndex = function () {
				return IIndex;
			};
			if (!_salesorderModel) {
				this.getSalesOrderModel();
				//_salesorderModel.setUseBatch(false);
			}
			// check if its a Update or New 
			for (var itemNo = 0; itemNo < aUpdateItems.length; itemNo++) {
				//Update	
				var salesItem = JSON.parse(JSON.stringify(aUpdateItems[itemNo]));
				var key = _salesorderModel.createKey('/draft_soItemSet', {
					'HeaderDraftUUID': salesItem.parentUuid,
					'ItemDraftUUID': salesItem.uuid,
					'IsActiveEntity': false
				});
				var updateObj = {};
				updateObj["HeaderDraftUUID"] = salesItem.parentUuid;
				updateObj["ItemDraftUUID"] = salesItem.uuid;
				updateObj["IsActiveEntity"] = false;
				updateObj["Material"] = salesItem.partNumber;
				updateObj["SalesUnit"] = "EA";
				//obj.TargetQty = items[0].qty.toString();                //*
				updateObj["TargetQty"] = salesItem.qty.toString() || ""; //*
				//obj.Material = salesItem.partNumber; //*  
				updateObj["Comments"] = salesItem.comment;
				//obj.MatDesc = salesItem.partDesc;
				if (!!_orderData.typeD) { // Campiagn
					updateObj["Zzcampaign"] = salesItem.campaignNum || "";
					updateObj["Zzopcode"] = salesItem.opCode || "";
					updateObj["VIN_no"] = salesItem.vin || "";
				} else if (!!_orderData.typeB) {
					updateObj["RefDoc"] = salesItem.contractNum.toString() || "";
					updateObj["RefDocItemNo"] = salesItem.contractLine || "";
				}

				_salesorderModel.update(key, updateObj, {
					success: function (oData, oResponse) {

						callbackFn(aUpdateItems[0], "Update", 0, true);
					},
					error: function (oError) {
						var errorResponse = JSON.parse(oError.responseText);
						var errMessage = errorResponse.error.message.value;
						callbackFn(aUpdateItems[0], "Update", 0, false, errMessage);
					}
				});

			} // for End
		},

		activateSalesDraftOrder: function (oOrderData, callBack) {
			var that = this;
			var lv_hasError = false;

			var drafts = null;
			var IIndex = 0;
			var getItemIndex = function () {
				return IIndex++;
			};
			if (!_salesorderModel) {
				this.getSalesOrderModel();
				//this.getSalesOrderModel.setUseBatch(false);
			}

			_salesorderModel.setUseBatch(false);

			drafts = _orderData.associatedDrafts[0];
			
			// console.log(drafts);

			_salesorderModel.callFunction('/DraftToSO', {
				method: "GET",
				urlParameters: {
					TestRun: false,
					HeaderDraftUUID: drafts.DraftUUID,
					IsActiveEntity: true
				},
				success: function (oData, oResponse) {
					console.table(oData);
					console.log(oData);
					var messageList = null;
					if (!!oData.results) {
						messageList = oData.results;
					}
					var orderNumber = null;

					orderNumber = oData.vbeln;
					// Based on the language,  the message has to hardcoded for french or english
					var lang = sap.ui.getCore().getConfiguration().getLanguage().toUpperCase().substring(0, 2);
					if (lang == "FR") {

						for (var i = 0; i < oData.results.length; i++) {
							var messageTemp = oData.results[i].message;
							if (messageTemp.includes("Discountinued, Part cannot be substituted") == true) {
								oData.results[i].message = "Remise, la pièce ne peut être remplacée";
							} else if (messageTemp.includes("Error in SALES_ITEM_IN") == true) {
								var newFrstring = messageTemp.replace(/Error in/, 'Erreur dans');
								oData.results[i].message = newFrstring;
							} else if (messageTemp.includes("does not exist") == true) {
								var newFrstring1 = messageTemp.replace(/Item/, 'Article');
								var tempvar = "n 'existe pas"
								var newFrString2 = newFrstring1.replace(/does not exist/, tempvar);
								oData.results[i].message = newFrString2;
							} else if (messageTemp.includes("Sales document  was not changed") == true) {
								oData.results[i].message = "Le document de vente n'a pas été changé";

							} else if (messageTemp.includes("does not allow external procurement") == true) {
								var newFrstring1 = messageTemp.replace(/Status "Obsolete" of material/, 'Statut "Obsolète" du matériel');
								var newFrString2 = newFrstring1.replace(/does not allow external procurement/, 'ne permet pas les achats externes');
								oData.results[i].message = newFrString2;
								oData.results[i].Material = newFrString2.substring(40, 30);
							} else if (messageTemp.includes("The sales document is not yet complete: Edit data") == true) {
								oData.results[i].message = "Le document de vente n'est pas encore complet: Modifier les données";
							} else if (messageTemp.includes("is not listed and therefore not allowed") == true) {
								var newFrstring1 = messageTemp.replace(/Material/, 'matériel');
								var tempVar = "n'est pas répertorié et donc pas autorisé";
								var newFrString2 = newFrstring1.replace(/is not listed and therefore not allowed/, tempVar);
								oData.results[i].message = newFrString2;

							} else if (messageTemp.includes("has been excluded") == true) {
								var newFrstring1 = messageTemp.replace(/Material/, 'matériel');
								var tempVar = "a été exclu"
								var newFrString2 = newFrstring1.replace(/has been excluded/, tempVar);
								oData.results[i].message = newFrString2;
							}
						}

					} else {
						// even for english need to push marerial #
						for (var i = 0; i < oData.results.length; i++) {
							var messageTemp = oData.results[i].message;
							if (messageTemp.includes("does not allow external procurement") == true) {
								if (oData.results[i].Material == "") {
									oData.results[i].Material = messageTemp.substring(40, 30);
								}
							}

						}

					}

					callBack(oData, orderNumber, messageList);
				},
				error: function (oError) {
					var messageList = that._extractSapErrorMessage(oError);
					callBack(null, null, messageList);
				}
			});

		},

		activatePurchaseDraftOrder: function (callbackFn) {
			var that = this;
			var IIndex = 0;
			var hasError = false;
			var getItemIndex = function () {
				return IIndex++;
			};

			if (!_purchaseorderModel) {
				this.getPurchaseOrderModel();
				//_salesorderModel.setUseBatch(false);
			}

			var drafts = _orderData.associatedDrafts;
			for (var i0 = 0; i0 < drafts.length; i0++) {
				drafts[i0].pEnded = false;
				drafts[i0].hasError = false;
				drafts[i0].orderNumber = null;

				_purchaseorderModel.callFunction('/DraftToPO', {
					method: "GET",
					urlParameters: {
						TestRun: false,
						HeaderDraftUUID: drafts[i0].DraftUUID,
						IsActiveEntity: true
					},
					success: function (oData, oResponse) {

						var Index = getItemIndex();
						var orderNumber = null;
						orderNumber = oData.results[0].ebeln;
						//var addiMesssage = oData.message;
						drafts[Index].pEnded = true;
						drafts[Index].ActivationResults = oData.results;

						if (!!orderNumber) {
							drafts[Index].orderNumber = orderNumber;
						} else {
							drafts[Index].hasError = true;
							hasError = true;
						}
						if (Index === (drafts.length - 1)) {
							callbackFn(oData, orderNumber, hasError, drafts);
						}
					},
					error: function (oError) {
						var Index = getItemIndex();
						var messageList = that._extractSapErrorMessage(oError);
						drafts[Index].hasError = true;
						drafts[Index].messages = messageList;
						hasError = true;
						//callBack(orderNumber, index, messageList);

						//callBack(null, Index, messageList);
						if (Index === (drafts.length - 1)) {
							callbackFn(oError, null, hasError);
						}
					}
				});

			}

		},

		validateContractNumber: function (bpCode, contract, part, callbackFn) {
			var that = this;
			if (!_salesorderModel) {
				this.getSalesOrderModel();
				_salesorderModel.setUseBatch(false);
			}

			var key = _salesorderModel.createKey('/contractNo_validationSet', {
				'contract_no': contract,
				'dealer_code': bpCode,
				'part_no': part
			});
			_salesorderModel.read(key, {
				success: function (oData, oResponse) {
					var messageList = that._extractSapItemMessages(oResponse);
					callbackFn(oData, true, messageList);
				},
				error: function (oError) {
					var errorResponse = JSON.parse(oError.responseText);
					var errMessage = errorResponse.error.message.value;
					callbackFn(errMessage, false);
				}
			});
		},

		_convertSeverty2Type: function (severty) {
			switch (severty) {
			case 'error':
				return 'Error';
			case 'warning':
				return 'Warning';
			case 'info':
				return 'Information';
			default:
				return 'None';

			}
		},

		_extractSapMessage: function (oResponse) {
			var that = this;
			var sapMessage = null;
			var messageList = [];
			var messageItem = null;
			var uuid = null;
			var index = 0;
			var mItem = null;

			// get the list of message order by UUID
			if (!!oResponse && !!oResponse.headers['sap-message']) {
				sapMessage = JSON.parse(oResponse.headers['sap-message']);
				if (!!sapMessage.target) {
					index = sapMessage.target.search('guid');
					if (index > 0) {
						uuid = sapMessage.target.substr(index + 5, 36);
						messageItem = {
							uuid: uuid,
							type: that._convertSeverty2Type(sapMessage.severity),
							severity: sapMessage.severity,
							code: sapMessage.code,
							message: sapMessage.message
						};
						if (!!!messageList[uuid]) {
							messageList[uuid] = [];
						}
						messageList[uuid].push(messageItem);
					}
				}
				for (var x = 0; x < sapMessage.details.length; x++) {
					mItem = sapMessage.details[x];
					if (!!mItem && !!mItem.target) {
						index = mItem.target.search('guid');
						if (index > 0) {
							uuid = mItem.target.substr(index + 5, 36);
							messageItem = {
								uuid: uuid,
								type: that._convertSeverty2Type(mItem.severity),
								severity: mItem.severity,
								code: mItem.code,
								message: mItem.message
							};
							if (!!!messageList[uuid]) {
								messageList[uuid] = [];
							}
							messageList[uuid].push(messageItem);
						}
					}
				}
			}
			return messageList;
		},

		_extractSapErrorMessage: function (error) {
			// sap-message
			var sapMessage = null;
			var mItem = null;
			var messageItem = null;
			var messageList = [];
			if (!!error && !!error.responseText) {
				if (error.statusCode == 504) {
					messageList.push(error.statusCode);
				} else {
					sapMessage = JSON.parse(error.responseText);

					if (!!sapMessage.error && !!sapMessage.error.innererror && !!sapMessage.error.innererror.errordetails) {
						for (var x = 0; x < sapMessage.error.innererror.errordetails.length; x++) {
							mItem = sapMessage.error.innererror.errordetails[x];
							if (!!mItem) {
								messageItem = {
									severity: mItem.severity,
									code: mItem.code,
									message: mItem.message
								};
								messageList.push(messageItem);
							}
						}
					}
				}
			}
			return messageList;
		},

		_extractSapItemMessages: function (oResponse) {
			var that = this;

			var sapMessage = null;
			var mItem = null;
			var messageItem = null;
			var messageList = [];
			if (!!oResponse && !!oResponse.headers['sap-message']) {
				sapMessage = JSON.parse(oResponse.headers['sap-message']);
				//					if (!!sapMessage.target && sapMessage.target ==='PurchaseOrderItem'){					
				if (!!sapMessage.target) {
					messageItem = {
						type: that._convertSeverty2Type(sapMessage.severity),
						severity: sapMessage.severity,
						code: sapMessage.code,
						message: sapMessage.message
					};
					messageList.push(messageItem);
					for (var x = 0; x < sapMessage.details.length; x++) {
						mItem = sapMessage.details[x];
						//							 if (!!mItem && !!mItem.target && mItem.target ==='PurchaseOrderItem'){
						if (!!mItem && !!mItem.target) {
							messageItem = {
								type: that._convertSeverty2Type(mItem.severity),
								severity: mItem.severity,
								code: mItem.code,
								message: mItem.message
							};
							messageList.push(messageItem);
						}
					}
				}
			}
			return messageList;
		},

		// /**** For Purchase Order  *** / 

		//getInfoForPart: function (oItem, iData, bpVendor, dealerCode, stoSupplyingPlant, callbackFn) {
		getInfoForPart: function (oItem, callbackFn) {
			var that = this;
			var lv_supplier = bpVendor;
			var hasError = false;
			var lv_orderType = null;
			var partNum = oItem.partNumber;

			//'/A_Product'				
			that.getPartsInfoById(partNum, function (item1Data) {
				var lv_orderType = that.getRealOrderTypeByItemCategoryGroup(item1Data.ItemCategoryGroup, iData.isSalesOrder, null);

				if (lv_orderType === 'ZLOC') {
					that.getSupplierForPart(oItem, stoSupplyingPlant, function (data) {
						if (!!data && !!data[0]) {
							//oItem["supplier"] = data[0].VendorAccountNumber;
							_orderData["supplier"] = data[0].VendorAccountNumber;
							//oItem["sloc"] = data.SLoc;
							oItem["revPlant"] = data[0].Plant;
						}
						//iData.items[0] = oItem;
						callbackFn(iData);
					});

				} else {

					callbackFn(iData);
				}

			});

		},

		saveDraftPurchaseOrder: function (aCreateItems, aUpdateItems, callbackFn) {
			if (aCreateItems.length > 0 && aCreateItems.length !== 0) {
				this._createPurchaseOrder(aCreateItems, callbackFn);
			}
			if (aUpdateItems.length > 0 && aUpdateItems.length !== 0) {
				this._updatePurchaseOrder(aUpdateItems, callbackFn);

			}
		},

		getSupplierForPart: function (oItem, stoSupplyingPlant, callback) {
			var that = this;
			//var oItemIndex = oltem[i];
			var oFilter = new Array();
			oFilter[0] = new sap.ui.model.Filter("MaterialNumber", sap.ui.model.FilterOperator.EQ, oItem.partNumber);
			//oFilter[1] = new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, sSalesOrganization);
			//oFilter[2] = new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, sDistributionChannel);
			oFilter[1] = new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, stoSupplyingPlant);
			//oFilter[2] = new sap.ui.model.Filter("LanguageKey", sap.ui.model.FilterOperator.EQ, that.slang);
			if (!this._partdescModel) {
				this.getZCMATERIALModel();
			}

			_partdescModel.read("/ZC_Purchasing_info", {
				filters: new Array(new sap.ui.model.Filter({
					filters: oFilter,
					and: true
				})),
				success: function (oData, oResponse) {
					if (!!oData && !!oData.results && oData.results.length > 0) {
						callback(oData.results);
					} else {
						// error
						callback(null);
					}

				},

				error: function (err) {
					// handle error?
					callback(null);
				}
			});

		},

		_createPurchaseOrder: function (aCreateItems, callbackFn) {
			var that = this;
			var IIndex = 0;
			_aCreateUB = [];
			var _aSuppliers = [];
			_aSuppliersZloc = [];
			var _aCreateZLOC = [];
			var getItemIndex = function () {
				return IIndex++;
			};

			for (var i = 0; i < aCreateItems.length; i++) {

				var purchaseItem = JSON.parse(JSON.stringify(aCreateItems[i]));
				var lv_orderType = purchaseItem.OrderType;
				var aDraft = null;

				if (lv_orderType === 'ZLOC') {
					_aCreateZLOC.push(purchaseItem);
					var Index = 0
					that.getSupplierForPart(purchaseItem, _orderData.stoSupplyingPlant, function (data) {
						if (!!data && !!data[0]) {
							//oItem["supplier"] = data[0].VendorAccountNumber;
							if (!_aSuppliers.includes(data[0].VendorAccountNumber)) {
								_aSuppliers.push(data[0].VendorAccountNumber.toString());
								_aSuppliersZloc["_" + data[0].VendorAccountNumber.toString()] = [];
							}
							Index = getItemIndex();
							var oPurchaseItem = _aCreateZLOC[Index];
							_orderData["supplier"] = data[0].VendorAccountNumber;
							oPurchaseItem["revPlant"] = data[0].Plant;
							oPurchaseItem["supplier"] = data[0].VendorAccountNumber;
							_aSuppliersZloc["_" + data[0].VendorAccountNumber.toString()].push(oPurchaseItem);
						} else { // !1data && !!data[0]
							//error handing TODO 
							// Error No Supplier found 
							Index = getItemIndex();
							var oPurchaseItem = _aCreateZLOC[Index];
							oPurchaseItem.hasError = true;
							callbackFn(oPurchaseItem, "Invalid", 0, false);

						}
						if (Index === (_aCreateZLOC.length - 1)) {
							for (var s = 0; s < _aSuppliers.length; s++) {

								//for (var i = 0; i < _aSuppliersZloc.length; i++) {
								var supplier = "_" + _aSuppliers[s];
								if (_aSuppliersZloc[supplier].length > 0) {
									var aPOItems = _aSuppliersZloc[supplier];
									that._createPurchaseOrderHeader(aPOItems, callbackFn);
								}
							}
						}
					});
				} else if (lv_orderType === "UB") { //  (UB)
					_aCreateUB.push(purchaseItem);
				} else {
					callbackFn(purchaseItem, "Invalid", 0, false);
				}
			} // for end	
			if (_aCreateUB.length > 0) {
				this._createPurchaseOrderHeader(_aCreateUB, callbackFn)
			}

		},

		_createPurchaseOrderHeader: function (aPOItems, callbackFn) {
			var purchaseItem = JSON.parse(JSON.stringify(aPOItems[0]));
			var lv_orderType = purchaseItem.OrderType;
			var that = this;
			for (var x1 = 0; x1 < _orderData.associatedDrafts.length; x1++) {
				aDraft = _orderData.associatedDrafts[x1];
				if (lv_orderType === "UB" && lv_orderType === aDraft.OrderType) {
					break;
				} else if (lv_orderType === "ZLOC" &&
					purchaseItem.supplier === aDraft.Supplier &&
					lv_orderType === aDraft.OrderType
				) {
					break;
				} else {
					aDraft = null;

				}
			}
			if (!aDraft) {
				if (!_purchaseorderModel) {
					this.getPurchaseOrderModel();
					//_salesorderModel.setUseBatch(false);
				}
				//Get the order type
				//var lv_orderType = this._cntrlrInst.getRealOrderTypeByItemCategoryGroup(oPurItem.itemCategoryGroup, false, _orderData.orderTypeId);

				//CreatePurchaseOrderHeader 
				var obj = {};

				var aDraft = null;

				obj.Purch_Org = _orderData.purchaseOrg;
				obj.Pur_Group = _orderData.purchasingGroup;
				obj.DealerCode = _orderData.dealerCode;
				obj.DealerOrderNo = _orderData.tciOrderNumber;

				obj.Doc_Type = lv_orderType;

				obj.Comp_Code = _orderData.companyCode;

				if ('UB' === lv_orderType) {

					obj.Suppl_Plnt = _orderData.stoSupplyingPlant;
					obj.Currency = _orderData.documentCurrency;

				} else if ('ZLOC' === lv_orderType) {

					obj.Currency = _orderData.currency || 'CAD';
					obj.Vendor = purchaseItem.supplier;

				}

				_purchaseorderModel.create('/Draft_POHeaderSet', obj, {
					success: function (oData, response) {
						// prepare 
						aDraft = {};
						aDraft.PurchasingOrganization = oData.Purch_Org;
						aDraft.PurchasingGroup = oData.Pur_Group;

						aDraft.Supplier = oData.Vendor;
						aDraft.OrderType = oData.Doc_Type;
						aDraft.DraftUUID = oData.HeaderDraftUUID;
						aDraft.Supplier = oData.Vendor;

						aDraft.Lines = 0;
						_orderData.associatedDrafts.push(aDraft);
						if (oData.Doc_Type === "UB") {
							var aPOItems = _aCreateUB;
						} else {
							var aPOItems = _aSuppliersZloc["_" + aDraft.Supplier];

						}

						//var Index = getCreateItemIndex();
						that._addPurchaseDraftItem(aPOItems, aDraft, aPOItems[0], callbackFn);
						//callbackfn(aDraft, true);

					},
					error: function (oError) {
						// Error - What to do if Header failse
						var err = oError;
						var errorResponse = JSON.parse(oError.responseText);
						var errMessage = errorResponse.error.message.value;
						callbackFn(purchaseItem, "Create", 0, false, errMessage);
					}
				});
			} else {
				that._addPurchaseDraftItem(aPOItems, aDraft, aPOItems[0], callbackFn);
			}
			//} // for end ;
		},

		_addPurchaseDraftItem: function (aCreateItems, aDraft, purchaseItem, callbackFn) {
			var that = this;
			var messageList = null;
			var IIndex = 0;
			var getCreateItemIndex = function () {
				return IIndex++;
			};
			//var oItemNew = {j : JSON.parse(JSON.stringify(oItem))};
			//oImportItems[j]["Po_Item"] = j + 1;
			//var aDraft = null;

			//first of all, let us find the existing order header, 

			// fake the data	
			if (!_purchaseorderModel) {
				this.getPurchaseOrderModel();
				//_salesorderModel.setUseBatch(false);
			}
			for (var itemNo = 0; itemNo < aCreateItems.length; itemNo++) {
				var purchaseItem = JSON.parse(JSON.stringify(aCreateItems[itemNo]));
				var entry = _purchaseorderModel.createEntry('/Draft_POItemSet', {});
				//var draftPromise = $.when(that.saveImportItemAsDraft(impData));

				// item level data
				var obj = entry.getObject();
				obj.HeaderDraftUUID = aDraft.DraftUUID;

				//obj.TargetQty = items[0].qty.toString();                //*
				obj.Quantity = purchaseItem.qty.toString() || "0"; //*
				obj.Material = purchaseItem.partNumber; //*  				
				obj.MatDesc = purchaseItem.partDesc || "";
				obj.Po_Unit = "EA";
				obj.Comments = purchaseItem.comment || "";

				obj.Plant = _orderData.revPlant;
				obj.Stge_Loc = _orderData.sloc;

				if (!!_orderData.typeD) { // Campiagn
					obj.Zzcampaign = purchaseItem.campaignNum || "";
					obj.Zzopcode = purchaseItem.opCode || "";
					obj.VIN_no = purchaseItem.vin || "";
				} else if (!!_orderData.typeB) {
					obj.RefDoc = purchaseItem.contractNum || "";
					obj.RefDocItemNo = purchaseItem.contractLine || "";
				}

				_purchaseorderModel.create('/Draft_POItemSet', obj, {
					success: function (oData, oResponse) {
						//TODO
						aDraft.Lines = aDraft.Lines + 1;
						var I = getCreateItemIndex();
						//messageList = _cntrlrInst._extractSapItemMessages(oResponse);
						aCreateItems[I].uuid = oData.ItemDraftUUID;
						aCreateItems[I].parentUuid = oData.HeaderDraftUUID;
						//oItem[j].line = oData.ItmNumber;
						//oItem[j].messageLevel = _cntrlrInst.getMessageLevel(messageList);
						//oItem[j].messages = messageList;*/
						callbackFn(aCreateItems[I], "Create", 0, true);
					},
					error: function (oError) {
						var I = getCreateItemIndex();
						var errorResponse = JSON.parse(oError.responseText);
						var errMessage = errorResponse.error.message.value;
						callbackFn(aCreateItems[I], "Create", 0, false, errMessage);
					}
				});
			}
		},

		_updatePurchaseOrder: function (aUpdateItems, callbackFn) {
				var that = this;

				var IIndex = 0;
				var getUpdateItemIndex = function () {
					return IIndex;
				};
				if (!_purchaseorderModel) {
					this.getPurchaseOrderModel();
					//_salesorderModel.setUseBatch(false);
				}
				for (var itemNo = 0; itemNo < aUpdateItems.length; itemNo++) {
					//Update	
					var purchaseItem = JSON.parse(JSON.stringify(aUpdateItems[itemNo]));
					var key = _purchaseorderModel.createKey('/Draft_POItemSet', {
						'HeaderDraftUUID': purchaseItem.parentUuid,
						'ItemDraftUUID': purchaseItem.uuid,
						'IsActiveEntity': false
					});

					var updateObj = {};
					updateObj["HeaderDraftUUID"] = purchaseItem.parentUuid;
					updateObj["ItemDraftUUID"] = purchaseItem.uuid;
					updateObj["IsActiveEntity"] = false;
					updateObj["Material"] = purchaseItem.partNumber;
					updateObj["Po_Unit"] = "EA";
					//obj.TargetQty = items[0].qty.toString();                //*
					updateObj["Quantity"] = purchaseItem.qty.toString() || "0"; //*
					//obj.Material = salesItem.partNumber; //*  
					updateObj["Comments"] = purchaseItem.comment;
					//obj.MatDesc = salesItem.partDesc;
					if (!!_orderData.typeD) { // Campiagn
						updateObj["Zzcampaign"] = purchaseItem.campaignNum;
						updateObj["Zzopcode"] = purchaseItem.opCode;
						updateObj["VIN_no"] = purchaseItem.vin;
					} else if (!!_orderData.typeB) {
						updateObj["RefDoc"] = purchaseItem.contractNum.toString() || "";
						updateObj["RefDocItemNo"] = purchaseItem.contractLine;
					}

					_purchaseorderModel.update(key, updateObj, {
						success: function (oData, oResponse) {
							//var messageList = that._extractSapItemMessages(oResponse);

							callbackFn(aUpdateItems[0], "Update", 0, true);
						},
						error: function (oError) {
							var errorResponse = JSON.parse(oError.responseText);
							var errMessage = errorResponse.error.message.value;
							callbackFn(aUpdateItems[0], "Update", 0, false, oError);
						}
					}); // thr purchase order

				}
			} // _updatePurchaseOrder End

	}; // function return.

});