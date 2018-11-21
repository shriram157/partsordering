"use strict";
/*eslint-env node, es6 */

var xsenv = require("@sap/xsenv");


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

		let options = {};
		options = Object.assign(options, xsenv.getServices({
			api: {
				name: "PARTS_ORDERING_APIM_CUPS"
			}
		}));
		
		
		if (!!options.api.LOGGING_LEVEL){
			this._options = options.api;
		} else {
			// may throw error in the future
			this._options = {
				LOGGING_LEVEL : 1,
				ENDPOINTS : {
					DESTINATION_DG2 : {
						proto : "https",
						prefix : "/sap/opu/odata/sap/",
						host : "sapdev.apimanagement.ca1.hana.ondemand.com",
						port : 443,
						client : 200,
						authType : "APIKEY",
						apiKey: "RBHKiLeMQEF9F8xnICJFcwQjvX5fVYum",
						userName : "XSA_DEV",
						password : "XSA_DEV@123"
					}						
				}
			};
		}
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