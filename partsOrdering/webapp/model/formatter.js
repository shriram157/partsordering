sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		linex1Format: function (typeD, typeB, campCode, contCode) {
			var lv_line;
			/*	if (!!line) {
					lv_line = line.replace(/^0+/, '');
					lv_line = ''; // don't show the line number
				}*/
			if (!!typeD) {
				if (!!lv_line) {
					return lv_line + " / " + campCode;
				} else {
					return campCode;
				}
			} else if (!!typeB) {
				if (!!lv_line) {
					return lv_line + " / " + contCode;
				} else {
					return contCode;
				}

			} else {
				return lv_line;
			}
		},
		deliveryDate: function (sValue) {
			return "2018";
		},
		round2dec: function (sValue) {
			try {
				if (!!sValue) {
					if (sValue === 0) {
						return "0";
						// changed to return blank  if 0 - May 27.
					}
					return parseFloat(sValue).toFixed(0);
					// changed to return blank  if 0 decimals - May 29.
				}

			} catch (err) {

			}

			return "0";
		},
		estDateFormat: function (inDate) {
			// var inDate = "+ 20200314";
			/* alert(inDate); */
			// alert(inDate.indexOf("+"));
			var outDate = "";
			if (inDate !== "") {
				if (inDate.indexOf("+") >= 0) {
					var onlyDate = inDate.slice(2, 10);
					// alert(onlyDate);
					var sYear = onlyDate.slice(0, 4);
					// alert(sYear);
					var sMonth = onlyDate.slice(4, 6) - 1;
					// alert(sMonth);
					var sDate = onlyDate.slice(6, 8);
					// alert(sDate);
					var formattedDate = new Date(sYear, sMonth, sDate);
					// alert(formattedDate);
					var strDate = formattedDate.toString();
					// alert(formattedDate.toString().slice(4, 15));
					// var outDate = "+ " + strDate.slice(11,15) + " " + strDate(4,7) + " ," + strDate (8,10);
					if (onlyDate) {
						outDate = "+ " + strDate.slice(4, 7) + " " + strDate.slice(8, 10) + ", " + strDate.slice(11, 15);
					} else {
						outDate = "+ ";
					}
					// alert(outDate);
				} else {
					var onlyDate = inDate.slice(0, 8);
					// alert(onlyDate);
					var sYear = onlyDate.slice(0, 4);
					// alert(sYear);
					var sMonth = onlyDate.slice(4, 6) - 1;
					// alert(sMonth);
					var sDate = onlyDate.slice(6, 8);
					// alert(sDate);
					var formattedDate = new Date(sYear, sMonth, sDate);
					// alert(formattedDate);
					var strDate = formattedDate.toString();
					// alert(formattedDate.toString().slice(4, 15));
					//var outDate =strDate.slice(11,15) + " " + strDate.slice(4,7) + " ," + strDate.slice(8,10);
					outDate = strDate.slice(4, 7) + " " + strDate.slice(8, 10) + ", " + strDate.slice(11, 15);
					// alert(outDate);
				}
			}
			return outDate;

		},
		OrdDatFormat: function (orDate) {
			var sDate = "";
			if (orDate !== "") {
				// alert(myDate);
				var sYear = orDate.substr(0, 4);
				// alert(myYear);
				var sMon = orDate.substr(4, 2);
				// alert(myMon);
				if (sMon.substr(0, 1) == "0") {
					sMon = sMon.substr(1, 1);
				} else {
					// alert(sMon);
					sMon= sMon;
				}
				var sDay = orDate.substr(6, 2);
				// alert(myDay);
				var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				// alert(monthNames[myMon - 1]);
				// alert(monthNames[myMon - 1] + " " + myDay + "," + myYear);
				sDate = monthNames[sMon - 1] + " " + sDay + "," + sYear;
			}
			return sDate;

		},

		linex2Format: function (typeD, typeB, opCode, vin) {
			if (!!typeD) {
				if (!!opCode) {
					return opCode + " / " + vin;
				} else {
					return vin;
				}
			}
			return '';
		},
		sub2boolean: function (value) {
			if (!!value && 'YES' === value.toUpperCase()) {
				return true;
			}
			return false;
		},
		sub3boolean: function (value) {
			if (!!value && 'X' === value.toUpperCase()) {
				return true;
			}
			return false;
		},
		sub4boolean: function (value) {
			if (!!value && 'X' === value.toUpperCase()) {
				return true;
			}
			return false;
		},
		getItemNumber: function (sValue) {
			if (!!sValue) {
				return sValue.replace(/^0+/, '');
			}
			return sValue;
		},
		removeLeadingZero: function (sValue) {
			if (!!sValue) {
				return sValue.replace(/^0+/, '');
			}
			return sValue;
		},
		shortDate: function (oDate) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM dd, yyyy HH:mm"
			});
			var dateFormatted = dateFormat.format(oDate);
			return dateFormatted;
		},
		StatusFormatter : function(oVal){
			var resourceBundle = this.getResourceBundle();
			
			if(oVal){
				if(oVal === "E"){
					return resourceBundle.getText("Order.Status.Error");
				}else if(oVal === "D"){
					return resourceBundle.getText("Order.Status.Draft");
				}
			}
			return oVal;
		},

		getItemTooltip: function (uuid, pUuid) {
			var resourceBundle = this.getResourceBundle();
			return resourceBundle.getText('Message.Draft.Item.Id', [uuid, pUuid]);
		},

		totalLine1: function (lines) {
			var resourceBundle = this.getResourceBundle();
			return resourceBundle.getText('Label.CheckOrder.Totalparts', [lines]);
		},

		totalDraft: function (lines) {
			var resourceBundle = this.getResourceBundle();
			if(lines < 1000){
				return resourceBundle.getText('Label.FindOrder.Total', [lines]);
			}else{
				return resourceBundle.getText('Label.FindOrder.Draft');
			}
		},
		partNumberLabelFormat: function (typeB, typeD) {
			var resourceBundle = this.getResourceBundle();
			if (!!typeB) {
				return resourceBundle.getText('Lable.CreateOrder.ContractNumber');
			} else if (!!typeD) {
				return resourceBundle.getText('Lable.CreateOrder.CampaignNumber');
			}
			return "";
		},
		partDescLabelFormat: function (typeB, typeD) {
			var resourceBundle = this.getResourceBundle();
			if (!!typeD) {
				return resourceBundle.getText('Lable.CreateOrder.OpCodeVin');
			}
			return "";
		},

		orderStatus: function (code) {
			var resourceBundle = this.getResourceBundle();
			switch (code) {
			case 'DF':
				return resourceBundle.getText('Order.Status.Draft');
			case 'ST':
				return resourceBundle.getText('Order.Status.Submitted');
			default:
				return resourceBundle.getText('Order.Status.NA');
			}
		},

		orderType: function (type) {
			var resourceBundle = this.getResourceBundle();
			switch (type) {
			case '1':
				return resourceBundle.getText('order.type.standard');
			case '2':
				return resourceBundle.getText('order.type.rush');
			case '3':
				return resourceBundle.getText('order.type.campaign');
			default:
				return "";
			}
		},

		orderTypeD: function (type) {
			var resourceBundle = this.getResourceBundle();
			switch (type) {
			case 'UB':
				return resourceBundle.getText('order.type.standard');
			case 'ZLOC':
				return resourceBundle.getText('order.type.standard');
			case 'ZOR':
				return resourceBundle.getText('order.type.standard');
			case 'ZRO':
				return resourceBundle.getText('order.type.rush');
			case 'ZCO':
				return resourceBundle.getText('order.type.campaign');
			default:
				return resourceBundle.getText('order.type.other', [type]);
			}
		},

		lineNumberFormat: function (line) {
			if (!!line) {
				return line.substr(-2);
			}
		},

		iconMessageFormat: function (messages) {

			var messageLevel = 0; // non
			var meesageItem = null;
			if (!!messages && !!messages.length) {
				for (var i = 1; i < messages.length; i++) {
					if (!!meesageItem) {
						switch (meesageItem.severity) {
						case 'error':
							messageLevel = 3;
							break;
						case 'warning':
							if (messageLevel < 2) {
								messageLevel = 2;
							}
							break;
						default:
							if (messageLevel < 1) {
								messageLevel = 1;
							}
							break;
						}
					}
				}
			}

			switch (messageLevel) {
			case 3:
				return "#FC0519";
				//return new sap.ui.core.Icon({src: "sap-icon://e-care", color: "#FC0519" }); 
				//return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#FC0519" });
			case 2:
				return "#FFDAB9";
				//return new sap.ui.core.Icon({src: "sap-icon://e-care", color: "#2DFA06" }); 
				//return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#2DFA06" });
				// case 1:
				// 	return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#2DFA06" });
			default:
				return "#2DFA06";
				//return new sap.ui.core.Icon({src: "sap-icon://e-care", color: "#2DFA06" }); 
				// return sap.ui.core.IconPool.getIconURI({src: "sap-icon://e-care", color: "#2DFA06" });
				//						return "sap-icon://e-care";
			}

		},

		spqFormat: function (line) {
			if (!!line) {
				return line.substr(-2);
			}
		},

		confDelFormat: function (cnfQty, delQty) {
			if (typeof cnfQty !== 'undefined' && cnfQty !== null && cnfQty.trim() > 0) {
				return Math.round(cnfQty);
			} else if (typeof delQty !== 'undefined' && delQty !== null && delQty.trim() > 0) {
				return Math.round(delQty);
			} else {
				return "";
			}

		},
		
		color:function(value) //changes by Shriram for DMND0003688 to add color to PartNumber if status is Z9,ZA,ZB
		{
			if(value=="Z9" || value=="ZA" || value=="ZB")
			{
				return "Information";
			}
		}
		//changes by Swetha for DMND0004095 on 29th Jan, 2024.
		StanrushCPOR:function(type){
			var resourceBundle = this.getResourceBundle();
			switch (type) {
			case '1':
				return resourceBundle.getText('order.type.standardCPOR');
			case '2':
				return resourceBundle.getText('order.type.rushCPOR');
			default:
				return "";
			}
		}

	};

});