"use strict";
/*eslint-env node, es6 */

/**
 * A class for retrieving configuration settings from an instance of config server running in PCF/XSA
 */
module.exports = class ConfigurationProvider {

	/**
	 * The class constructor
	 * 
	 * If your application is called my-example-api, your configuration files uploaded to gitlab should be:
	 *
	 * @param {object} logger - An instance of an logger
	 * @param {string} defaultConfigName - Optional - If the default config name is something other than 'localconfig.yml' when running locally.
	 */
	constructor(logger, defaultConfigName){
		this._logger = logger;
		this._default_cache_mins = 5;
			
		if(!defaultConfigName){
			this._defaultConfigName = 'localconfig.yml';
		}else{
			this._defaultConfigName = defaultConfigName;
		}		
		
		this._options = {
			LOGGING_LEVEL : 1,
			ENDPOINTS : {
				DESTINATION_DG2 : {
					proto : "https",
					host : "sapdev.apimanagement.ca1.hana.ondemand.com",
					port : 443,
					client : 200,
					authType : "APIKEY",
					apiKey: "RBHKiLeMQEF9F8xnICJFcwQjvX5fVYum",
					userName : "XSA_DEV",
					password : "XSA_DEV@123"
				},
				MM_PUR_PO_MAINT_V2_SRV :{
					proto : "https",
					host : "fioridev1.dev.toyota.ca",
					port : 44300,
					path : "/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/",
					authType : "BASIC",
					userName : "PA_FUT_060",
					password : "Testing@123"
				},
				API_BUSINESS_PARTNER : {
					proto : "https",
					host  : "fioridev1.dev.toyota.ca",
					port  : 44300,
				    path  : "/sap/opu/odata/sap/API_BUSINESS_PARTNER/",
					authType : "BASIC",
					userName : "PA_FUT_060",
					password : "Testing@123"
				},
				MD_PRODUCT_FS_SRV : {
					proto : "https",
					host  : "fioridev1.dev.toyota.ca",
					port  : 44300,
				    path  : "/sap/opu/odata/sap/MD_PRODUCT_FS_SRV/",
					authType : "BASIC",
					userName : "PA_FUT_060",
					password : "Testing@123"
				},	
				ZMD_PRODUCT_FS_SRV : { 
					proto : "https",
					host  : "fioridev1.dev.toyota.ca",
					port  : 44300,
				    path  : "/sap/opu/odata/sap/ZMD_PRODUCT_FS_SRV/",
					authType : "BASIC",
					userName : "PA_FUT_060",
					password : "Testing@123"
				}						
			}
		};
	}
	
	get DEFAULT_CACHE_MINS(){
		return this._default_cache_mins;
	}
	
	set DEFAULT_CACHE_MINS(default_cache_mins){
		this._default_cache_mins = this._default_cache_mins;
	}
	
	getConfigurationValue(itemKey){
		let isKeyThere = !!(this._options[itemKey]);
		if(isKeyThere){
			return this._options[itemKey];
		} else {
			return null;
		}
	}

	getEndpointConfigurationValue(itemKey){
		let isKeyThere = !!this._options.ENDPOINTS && !!this._options.ENDPOINTS[itemKey];
		
		if(isKeyThere){
			return this._options.ENDPOINTS[itemKey];
		} else {
			return null;
		}
	}
};