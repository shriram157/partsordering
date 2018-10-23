sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			
			shortDate: function(oDate) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MMM dd, yyyy HH:mm" });   
				var dateFormatted = dateFormat.format(oDate);
				return dateFormatted;
			},
			
			orderStatus : function(code){
				var resourceBundle = this.getResourceBundle();
				switch(code){
					case 'DF':
						return resourceBundle.getText('Order.Status.Draft');
					case 'ST':
						return resourceBundle.getText('Order.Status.Submitted');
					default :
						return resourceBundle.getText('Order.Status.NA');
				}	
			},
			
			orderType : function(type){
				var resourceBundle = this.getResourceBundle();
				switch(type){
					case 1:
						return resourceBundle.getText('order.type.standard');
					case 2:
						return resourceBundle.getText('order.type.rush');
					case 3:
						return resourceBundle.getText('order.type.campaign');
					default :
						return "";
				}	
			},
			
			lineNumberFormat : function(line){
				if (!!line){
					return line.substr(-2);
				}
			},

			iconMessageFormat : function(messages){
				
				var messageLevel = 0; // non
				
				if(!!messages && !!messages.length){
					for(var i = 1; i < messages.length; i++){
						if (messages[i].severity === "error"){
							messageLevel = 3;
						} else if (messages[i].severity === "warning"){
							if(messageLevel < 2){
								messageLevel =2;
							}
						} else {
							if(messageLevel < 1){
								messageLevel = 1 ;
							}
						}
					}
				}
				
				switch(messageLevel){
					case 3:
						return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#FC0519" });
					case 2:
						return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#2DFA06" });
					case 1:
						return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#2DFA06" });
					default:
						return "sap-icon://e-care";
				}
				
			},
			
			spqFormat : function(line){
				if (!!line){
					return line.substr(-2);
				}
			}			
			
			
		};

	}
);