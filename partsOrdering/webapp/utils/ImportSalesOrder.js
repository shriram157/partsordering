sap.ui.define([], function () {
	"use strict";

	var _cntrlrInst = null;
	var _oSOModel = null;
	return {

		_oTestAlert: function () {
			alert("Import");
		},

		setControllerInstance: function (oControllerInst) {
			this._cntrlrInst = oControllerInst;
			this.setSeleaseOrderModel(oControllerInst);
		},

		setSeleaseOrderModel: function (oSalesOrderModel) {
			if (_oSOModel === null) {
				_oSOModel = oSalesOrderModel.getSalesOrderModel();
			}
		},

		getControllerInstance: function () {
			return _cntrlrInst;
		},

		createSalesHeaderDraft: function (orderData, callbackfn) {

			var bModel = _oSOModel;
			var entry = bModel.createEntry('/draft_soHeaderSet', {});
			var obj = entry.getObject();
			var lv_orderType = this._cntrlrInst.getRealOrderTypeByItemCategoryGroup(orderData.itemCategoryGroup, orderData.isSalesOrder, orderData.orderTypeId);
			var aDraft = null;
		
			// populate the values
			obj.Division = orderData.Division;
			obj.SalesOrg = orderData.SalesOrganization;
			obj.DistrChan = orderData.DistributionChannel;

			obj.SoldtoParty = orderData.purBpCode;
			obj.PurchNoC = orderData.tciOrderNumber;
			obj.DocType = lv_orderType;

			// if (!!items[0].contractNum){
			// 	obj.ContractNumber = items[0].contractNum;
			// 	obj.ContractNumber ="1";
			// } else {
			// 	obj.ContractNumber ="1";
			// }

			bModel.create('/draft_soHeaderSet', obj, {
				success: function (oData, response) {
					// prepare aDraft
					var aDraft = {};
					aDraft.SalesOrganization = oData.SalesOrg;
					aDraft.DistributionChannel = oData.DistrChan;
					aDraft.Division = oData.Division;
					aDraft.OrderType = oData.DocType;
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

		addSalesDraftItems: function (aDraft, oImportItems, orderData, callback) {
			var that = this;
			var messageList = null;
			var j = 0;
			for (j = oImportItems.length - 1; j > -1; j--) {
				var oItem = oImportItems[j];
				oItem.line = j + 1;
				//var oItemNew = {j : JSON.parse(JSON.stringify(oItem))};
				var entry = _oSOModel.createEntry('/draft_soItemSet', {});
				//var draftPromise = $.when(that.saveImportItemAsDraft(impData));

				// item level data
				var obj = entry.getObject();
				obj.HeaderDraftUUID = aDraft.DraftUUID;
				var len = 0;
				//obj.TargetQty = items[0].qty.toString();                //*
				obj.TargetQty = oItem.qty.toString() || "0"; //*
				obj.Material = oItem.partNumber; //*  
				obj.Comments = oItem.comment;
				obj.MatDesc = oItem.partDesc;
				obj.ItmNumber = j.toString();

				if (!!orderData.typeD) { // Campiagn
					obj.Zzcampaign = oItem.campainNum;
					obj.Zzopcode = oItem.opCode;
					obj.VIN_no = oItem.vin;
				} else if (!!orderData.typeB) {
					obj.RefDoc = oItem.contractNum;
					obj.RefDocItemNo = oItem.contractLine;
				}

				_oSOModel.create('/draft_soItemSet', obj, {
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

		addItemstoDraft: function (headerDraftuuid, altems, iData) {

		},

		salesOrderDraft: function () {

		}
	};
});