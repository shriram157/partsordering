sap.ui.define([
		"sap/ui/base/Object",
    	"sap/ui/core/message/Message",
    	"sap/ui/core/MessageType",
    	"sap/m/MessageBox"
	], function (UI5Object, Message, MessageType, MessageBox) {
		"use strict";

		return UI5Object.extend("adasdas.dddd.controller.ErrorHandler", {

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias adasdas.dddd.controller.ErrorHandler
			 */
			constructor : function (oComponent) {
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");

				this._oRemoteModelList = [];
				var lv_model = null;
				
				lv_model = oComponent.getModel("API_BUSINESS_PARTNER");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("API_PURCHASEORDER_PROCESS_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("API_PRODUCT_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("MD_PRODUCT_FS_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("ZMD_PRODUCT_FS_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("MM_PUR_INFO_RECORDS_MANAGE_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("MM_PUR_PO_MAINT_V2_SRV");
				this._oRemoteModelList.push(lv_model);
				lv_model = oComponent.getModel("ZC_STOR_LOCN_CDS");
				this._oRemoteModelList.push(lv_model);

				lv_model = null;
				for(var i= 0; i < this._oRemoteModelList.length; i++){
					lv_model = this._oRemoteModelList[i];

					lv_model.attachMetadataFailed(function (oEvent) {
						var oParams = oEvent.getParameters();
						sap.ui.core.BusyIndicator.hide();							
					}, this);

					lv_model.attachRequestFailed(function (oEvent) {
						var oParams = oEvent.getParameters();
						// An entity that was not found in the service is also throwing a 404 error in oData.
						// We already cover this case with a notFound target so we skip it here.
						// A request that cannot be sent to the server is a technical error that we have to handle though
						if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
							this._showServiceError(oParams.response);
						}
					}, this);
				}
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
			 * The user can try to refresh the metadata.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showMetadataError : function (sDetails) {
				MessageBox.error(
					this._sErrorText,
					{
						id : "metadataErrorMessageBox",
						details : sDetails,
						styleClass : this._oComponent.getContentDensityClass(),
						actions : [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
						onClose : function (sAction) {
							if (sAction === MessageBox.Action.RETRY) {
								this._oModel.refreshMetadata();
							}
						}.bind(this)
					}
				);
			},
			
			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				this._bMessageOpen = true;

				var tText = this._sErrorText;
				//var eText = sDetails;
				if (sDetails.statusCode >= 400 && sDetails.statusCode < 500){
					if (!!sDetails.responseText){
						try{
							var errDetail = JSON.parse(sDetails.responseText);
							tText = errDetail.error.code + " : " + errDetail.error.message.value;
							//eText = errDetail;
							
						} catch( err){
							tText = sDetails.responseText;
						}
					}
				}
				
				// also add the to the system
    	        var oMessage = new Message({
                	message: tText,
                	description: sDetails.responseText,
                	type: MessageType.Error
            	});
        		sap.ui.getCore().getMessageManager().addMessages(oMessage);

				
				MessageBox.error(
					tText,
					{
						id : "serviceErrorMessageBox",
						details : sDetails,
						styleClass : this._oComponent.getContentDensityClass(),
						actions : [MessageBox.Action.CLOSE],
						onClose : function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
			}		
		});
	}
);