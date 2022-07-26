sap.ui.define(['sap/m/Input'],
function(Input){
	'use strict';
	var CustomInput = Input.extend("tci.wave2.ui.parts.ordering.utils.CustomInputDecimal", {
		metadata : {
			events : {
				"press" : {
				
				}
			}
		},
		// onkeyup: function(evt){
		// 	this.setValue(this.getValue().replace(/^[+-=]*[A-Z_]*$/gi, ""));
		// },
		onkeyup : function(){
			var patt = /^\d{1,14}(\.\d{1,2})?$/;
			var validateNum = patt.test(Number(this.getValue()));
			if(!validateNum){
				this.setValue("");
			}else{
				this.setValue(this.getValue());
			}
			//this.setValue(this.getValue().replace(/^[+-]*[A-Z_]*$/gi, ""));
		},
	
		renderer :"sap.m.InputRenderer"	
		
	});
	CustomInput.prototype.onAfterRendering = function(){
		var patt = /^\d{1,14}(\.\d{1,2})?$/;
			var validateNum = patt.test(Number(this.getValue()));
			if(!validateNum){
				this.setValue("");
			}else{
				this.setValue(this.getValue());
			}
	};
	return CustomInput;
});