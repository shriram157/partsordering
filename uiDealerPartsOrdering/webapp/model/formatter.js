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
				return new sap.ui.core.format.DateFormatter('YYYY/MM/DD HH:mm:ss').format(oDate);
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
			
			lineNumberFormat : function(line){
				if (!!line){
					return line.substr(-2);
				}
			}
		};

	}
);