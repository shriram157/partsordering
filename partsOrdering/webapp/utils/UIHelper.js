sap.ui.define([], function () {
	"use strict";

	var _cntrlrInst = null;
	var _objCreateOrderRequestCollection = null;
	var _isWithDrawn = [];
	var _isEditAction = false;
	var _isDeleteAction = false;
	var _isPurchaseOrder = false;
	var _isSalesOrder = false;
	var _dealerType = null;
	var _orderType = null;
	var _bpCode = null;
	var _userType = null;
	var _bpGroup = null;
	var _customer = null;
	var _dealerCode = null;

	return {
		setControllerInstance: function (oControllerInst) {
			_cntrlrInst = oControllerInst;
		},

		getControllerInstance: function () {
			return _cntrlrInst;
		},

		setRoutingProperty: function (objCreateOrderRequestCollection) {
			if (objCreateOrderRequestCollection) {
				for (var oItemIndex = 0; oItemIndex < objCreateOrderRequestCollection.length; oItemIndex++) {
					var oLeaveKey = objCreateOrderRequestCollection[oItemIndex].LeaveKey;
					var oRequestID = objCreateOrderRequestCollection[oItemIndex].RequestID;
					if (oRequestID !== "") {
						objCreateOrderRequestCollection[oItemIndex]._navProperty = oRequestID;
					} else {
						objCreateOrderRequestCollection[oItemIndex]._navProperty = oLeaveKey;
					}
				}
			}
			_objCreateOrderRequestCollection = objCreateOrderRequestCollection;
		},

		setIsEditAction: function (oStatus) {
			_isEditAction = oStatus;
		},

		getIsEditAction: function () {
			return _isEditAction;
		},

		setDearlerType: function (oDealerType) {
			_dealerType = oDealerType;
		},

		getDealerType: function () {
			return _dealerType;
		},

		setOrderType: function (oOrderType) {
			_orderType = oOrderType;
		},

		getOrderType: function () {
			return _orderType;
		},

		setBpCode: function (oBpCode) {
			_bpCode = oBpCode;
		},

		getBpCode: function () {
			return _bpCode;
		},

		setBpGroup: function (oBpGroup) {
			_bpGroup = oBpGroup;
		},

		getBpGroup: function () {
			return _bpGroup;
		},

		setDealerCode: function (oDealerCode) {
			_dealerCode = oDealerCode
		},

		getDealerCode: function () {
			return _dealerCode;
		},
		
		setDealerType: function (oDealerType) {
			_dealerType = oDealerType
		},

		getDealerType: function () {
			return _dealerT;
		},
		
		setCustomer: function (oCustomer) {
			_customer = oCustomer;
		},

		getCustomer: function () {
			return _customer;
		},

		setUserType: function (oUserType) {
			_userType = oUserType;
		},

		getUserType: function () {
			return _userType;
		},

		errorDialog: function (messages) {

			var _errorTxt = "";
			var _firstMsgTxtLine = "";
			var _detailmsg = "";
			var oSettings = "";

			if (typeof messages === "string") {
				oSettings = {
					message: messages,
					type: sap.ca.ui.message.Type.ERROR
				};
			} else if (messages instanceof Array) {

				for (var i = 0; i < messages.length; i++) {
					_errorTxt = "";
					if (typeof messages[i] === "string") {
						_errorTxt = messages[i];
					} else if (typeof messages[i] === "object") {
						_errorTxt = messages[i].value;
					}
					_errorTxt.trim();
					if (_errorTxt !== "") {
						if (i === 0) {
							_firstMsgTxtLine = _errorTxt;
						} else {
							_detailmsg = _detailmsg + _errorTxt + "\n";
						}
					}
				}

				if (_detailmsg == "") { // do not show any details if none are there
					oSettings = {
						message: _firstMsgTxtLine,
						type: sap.ca.ui.message.Type.ERROR
					};
				} else {
					oSettings = {
						message: _firstMsgTxtLine,
						details: _detailmsg,
						type: sap.ca.ui.message.Type.ERROR
					};
				}

			}
			sap.ca.ui.message.showMessageBox(oSettings);
		}

	}

});