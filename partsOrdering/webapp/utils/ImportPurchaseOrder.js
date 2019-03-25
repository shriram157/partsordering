sap.ui.define([], function () {
	"use strict";

	var _cntrlrInst = null;
	var _oPOModel = null;
	return {

		setControllerInstance: function (oControllerInst) {
			this._cntrlrInst = oControllerInst;
			this.setPurchaseOrderModel(oControllerInst);
		},

		setPurchaseOrderModel: function (oPurchaseOrderModel) {
			if (_oPOModel === null) {
				_oPOModel = this._cntrlrInst.getPurchaseOrderModel();
			}
		},

		getControllerInstance: function () {
			return _cntrlrInst;
		},

		createPurchaseHeaderDraft: function (orderData, oPurItem, callbackfn) {

			var bModel = _oPOModel;
			var entry = bModel.createEntry('/Draft_POHeaderSet', {});
			var obj = entry.getObject();
			var lv_orderType = this._cntrlrInst.getRealOrderTypeByItemCategoryGroup(oPurItem.itemCategoryGroup, false, orderData.orderTypeId);
			var aDraft = null;

			// --- BYPASS -1

			obj.Purch_Org = orderData.purchaseOrg;
			obj.Pur_Group = orderData.purchasingGroup;
			obj.DealerCode = orderData.dealerCode;
			obj.DealerOrderNo = orderData.tciOrderNumber;

			obj.Doc_Type = lv_orderType;

			obj.Comp_Code = orderData.companyCode;

			if ('UB' === lv_orderType) {

				obj.Suppl_Plnt = orderData.stoSupplyingPlant;
				obj.Currency = orderData.documentCurrency;

			} else if ('ZLOC' === lv_orderType) {

				obj.Currency = orderData.currency || 'CAD';
				obj.Vendor = oPurItem.supplier;

			}

			// if (!!items[0].contractNum){
			// 	obj.ContractNumber = items[0].contractNum;
			// 	obj.ContractNumber ="1";
			// } else {
			// 	obj.ContractNumber ="1";
			// }

			bModel.create('/Draft_POHeaderSet', obj, {
				success: function (oData, response) {
					// prepare 
					aDraft = {};
					aDraft.PurchasingOrganization = oData.Purch_Org;
					aDraft.PurchasingGroup = oData.Pur_Group;

					aDraft.Supplier = oData.Vendor;
					aDraft.OrderType = oData.Doc_Type;
					aDraft.DraftUUID = oData.HeaderDraftUUID;

					aDraft.Lines = 0;
					callbackfn(aDraft, true);

				},
				error: function (oError) {
					var err = oError;
					callbackfn(null, false);
				}
			});
		},

		addPurchaseDraftItems: function (oImportItems, orderData, callback) {
			var that = this;
			var messageList = null;
			
			for (var j = oImportItems.length - 1; j > -1; j--) {
				var oItem = oImportItems[j];
				//var oItemNew = {j : JSON.parse(JSON.stringify(oItem))};
				oImportItems[j]["Po_Item"] = j + 1;
				var aDraft = null;
				var lv_orderType = this._cntrlrInst.getRealOrderTypeByItemCategoryGroup(oImportItems[j].itemCategoryGroup, orderData.isSalesOrder,
					orderData.orderTypeId);

				//first of all, let us find the existing order header, 

				for (var x1 = 0; x1 < orderData.associatedDrafts.length; x1++) {
					aDraft = orderData.associatedDrafts[x1];
					if (lv_orderType === "UB" && lv_orderType === aDraft.OrderType) {
						break;
					} else if (lv_orderType === "ZLOC" &&
						oItem.supplier === aDraft.Supplier &&
						lv_orderType === aDraft.OrderType
					) {
						break;
					} else {
						aDraft = null;
					}
				}
				// fake the data	

				var entry = _oPOModel.createEntry('/Draft_POItemSet', {});
				//var draftPromise = $.when(that.saveImportItemAsDraft(impData));

				// item level data
				var obj = entry.getObject();
				obj.HeaderDraftUUID = aDraft.DraftUUID;

				//obj.TargetQty = items[0].qty.toString();                //*
				obj.Quantity = oItem.qty.toString() || "0"; //*
				obj.Material = oItem.partNumber; //*  				
				obj.MatDesc = oItem.partDesc || "";
				obj.Po_Unit = "EA";
				obj.Comments = "";
				obj.Po_Item = (oItem.Po_Item).toString();
				//obj.Supplier = lv_supplier;

				obj.Plant = orderData.revPlant;
				obj.Stge_Loc = orderData.sloc;

				//					obj.Plant = "6000";          

				//obj.PurchasingInfoRecord=items[0].purInfoRecord;

				if (!!orderData.typeD) { // Campiagn
					obj.Zzcampaign = oItem.campainNum;
					obj.Zzopcode = oItem.opCode;
					obj.VIN_no = oItem.vin;
				} else if (!!orderData.typeB) {
					obj.RefDoc = oItem.contractNum;
					obj.RefDocItemNo = oItem.contractLine;
				}

				_oPOModel.create('/Draft_POItemSet', obj, {
					success: function (obj, oDraftItem, oResponse) {
						//TODO
						aDraft.Lines = aDraft.Lines + 1;
						/*	oItem[j].Status = "Success";
							oItem[j].StatusText = "Import Successful";

							messageList = _cntrlrInst._extractSapItemMessages(oResponse);
							oItem[j].uuid = oData.ItemDraftUUID;
							oItem[j].parentUuid = oData.HeaderDraftUUID;
							oItem[j].line = oData.ItmNumber;
							oItem[j].messageLevel = _cntrlrInst.getMessageLevel(messageList);
							oItem[j].messages = messageList;*/
						callback(obj, oDraftItem, oResponse, true);
					},
					error: function (oError) {
						var err = oError;
						callback(oError, false);
					}
				});
			}
		},

	};
});