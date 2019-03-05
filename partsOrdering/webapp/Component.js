sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"tci/wave2/ui/parts/ordering/model/models",
	"tci/wave2/ui/parts/ordering/controller/ErrorHandler"	
], function(UIComponent, Device, models, ErrorHandler) {
	"use strict";

	return UIComponent.extend("tci.wave2.ui.parts.ordering.Component", {

		metadata: {
			manifest: "json"
		},
		
		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			var that = this;
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);


			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			sap.ui.core.BusyIndicator.show(0);			
			var division = jQuery.sap.getUriParameters().get('Division');
			 
			var lang = jQuery.sap.getUriParameters().get('Language');
			
			var appMode = models.getAppStateModel();
			this.setModel(appMode, "ApplicationMode");

			// Parse the current url and display the targets of the route that matches the hash
			this.getRouter().initialize();
			
			this.loadUserProfile(function(userData){
				var userProfile ={};
				userProfile.loaded = true;          

				if (!!userData && !!userData.userContext && !!userData.userContext.userAttributes){
					//var appMode = that.getModel('ApplicationMode');
					if (!!userData.userContext.userAttributes.DealerCode && userData.userContext.userAttributes.DealerCode.length > 0){
						userProfile.dealerCode = userData.userContext.userAttributes.DealerCode[0];        
					}

					// only two lang					
					if (!!lang ){
						lang = lang.trim().toLowerCase();
						if ('fr' === lang){
							userProfile.language ="fr";
						} else {
							userProfile.language ="en";
						}
					} else {
						if (!!userData.userContext.userAttributes.Language && userData.userContext.userAttributes.Language.length > 0){
							lang = userData.userContext.userAttributes.Language[0];
							if (!!lang){
								lang = lang.trim().toLowerCase();
								if ('french' === lang){
									userProfile.language ="fr";
								} else {
									userProfile.language ="en";
								}
							}
						}
					}
					
					if(!!userProfile.language){
						// only set the locale is the lang is set, 
						sap.ui.getCore().getConfiguration().setLanguage(userProfile.language);
					}
					
					
					if (!!userData.userContext.userAttributes.UserType && userData.userContext.userAttributes.UserType.length > 0){
						userProfile.userType = userData.userContext.userAttributes.UserType[0];        
					}
					
					if(!!userData.userContext.userInfo){
						userProfile.email = userData.userContext.userInfo.email;
						userProfile.familyName = userData.userContext.userInfo.familyName;
						userProfile.givenName = userData.userContext.userInfo.givenName;
						userProfile.logonName = userData.userContext.userInfo.logonName;
					}
					
					if (!!division){
						userProfile.division = 	division;
						if (division === "20") {
						  	userProfile.logoImage = 'images/Lexus_EN.png'; 
						} else {
							userProfile.logoImage = 'images/toyota.png';
						}
					} else {
						userProfile.division = 	'';
						//Default
						userProfile.logoImage = 'images/toyota.png';
					}					
					

					appMode.setProperty("/userProfile", userProfile);
				}
				
				if (that.isAppModelLoaded() ){
					sap.ui.core.BusyIndicator.hide();
				}
			});
			
			this.loadConfiguration(function(configurationData){
				var appLinkes = {};
				appLinkes.loaded = true;
				if (!!configurationData && !!configurationData.api.APPLINKS ){
					appLinkes.PARTS_AVAILIBILITY = configurationData.api.APPLINKS.PARTS_AVAILIBILITY;
					appMode.setProperty("/appLinkes", appLinkes);
				}
				if (that.isAppModelLoaded() ){
					sap.ui.core.BusyIndicator.hide();
				}				
			});
		},
		
	    getAppMode : function(){
	    	return this.getModel('ApplicationMode');
	    }, 
	    
	    isAppModelLoaded : function(){
	    	var isLoaded = false;
	    	var appMode = this.getModel('ApplicationMode');
	    	if (!!appMode && !!appMode.getData()){
	    		var appData = appMode.getData();
	    		if( !!appData.userProfile && !!appData.userProfile.loaded && !!appData.appLinkes && !!appData.appLinkes.loaded  ){
	    			isLoaded = true;
	    		}
	    	}
	    	return isLoaded;
	    }, 
	    
		loadUserProfile : function(callbackFunc){
			var that = this;
			$.ajax({
				url: "/node/env/userProfile",
				type: "GET",
				dataType: "json",
				success: function (oData,a,b) {
					callbackFunc(oData);
				},
				error: function (response) {
					callbackFunc(null);
				}
			});
		},
		
		loadConfiguration : function(callbackFunc){
			var that = this;
			$.ajax({
				url: "/node/env/configuration",
				type: "GET",
				dataType: "json",
				success: function (oData,a,b) {
					callbackFunc(oData);
				},
				error: function (response) {
					callbackFunc(oData);
				}
			});
		},
		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy : function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

			/**
			 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
			 * design mode class should be set, which influences the size appearance of some controls.
			 * @public
			 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
			 */
			getContentDensityClass : function() {
				if (this._sContentDensityClass === undefined) {
					// check whether FLP has already set the content density class; do nothing in this case
					if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
						this._sContentDensityClass = "";
					} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
						this._sContentDensityClass = "sapUiSizeCompact";
					} else {
						// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
						this._sContentDensityClass = "sapUiSizeCozy";
					}
				}
				return this._sContentDensityClass;
			}

	});
});