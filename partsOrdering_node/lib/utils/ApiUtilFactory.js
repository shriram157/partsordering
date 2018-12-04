"use strict";
/*eslint-env node, es6 */

const ApiUtil = require('./ApiUtil');
const ILogger = require('./ILogger');
const ConsoleLogger = require('./ConsoleLogger');
const CFLogger = require('./CFLogger');
const ConfigurationProvider = require('./ConfigurationProvider');
/**
 * Factory method for creating instances of ApiUtil
 *
 */
module.exports = class ApiUtilFactory{
	
	static creatUtility(){
		// Initialize logging
		let logger = new CFLogger(ILogger.LOGGING_LEVEL.DEBUG, 'ApiUtil');
		
		// Initialize the configuration provider
		let config = new ConfigurationProvider(logger);
		if(!process.env['config-server-cache-mins']){
			config.DEFAULT_CACHE_MINS = parseInt(process.env['config-server-cache-mins']);
		}
		
		// Initialize security settings
		let security = null;

		return new ApiUtil(security, config, ConsoleLogger);
	}
};