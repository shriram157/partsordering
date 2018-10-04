"use strict";
/*eslint-env node, es6 */


var events = require('events');
var eventEmitter = new events.EventEmitter();
var Boom = require('boom');

var Guid = require('./Guid');

const ILogger = require('./ILogger');

var LOGGING_LEVEL = ILogger.LOGGING_LEVEL.DEBUG;

/**
 * A class for providing the common fucntionalities shared across all APIs
 * @version 1.0.0
 * @author Ray Yang <xxxx@example.com>
 */
module.exports = class ApiUtil{

	/**
	 * The class constructor
	 *
	 * @param {object} apiSecurity - An instace of the api-security module
	 * @param {object} configuration - An instance of the configuration module
	 * @param {object} logging - An instance of the logging module
	 */
	constructor(apiSecurity, configuration, loggingClass){
		this._apiSecurity = apiSecurity;
		this._configuration = configuration;
		this._logging = loggingClass;
	}

	/**
	 * Registers callback functions to be invoked when specified events are emitted
	 *
	 * @param {string} The name of the event to listen for
	 * @param {function} The callback function to be invoked when the specified event is emitted
	 */
	on(eventName, callback){
		eventEmitter.on(eventName, callback);
	}

	getLogger(identifier){
		let	logger = new this._logging(LOGGING_LEVEL, identifier);
		return logger;
	}

	/**
	 * Processes a REST request that was sent to the API
	 * 
	 * @param {string} endpointKey - The name/key for the endpoint as defined in the config server configuration files
	 * @param {object} req - The express request object
	 * @param {object} res - The express response object
	 * @param {function} callback - The callback function to be invoked if the request passes all validation
	 * @returns {Promise} An awaitable promise containing the response to the request.
	 */
	ProcessRequest(endpointKey, req, res, next, callback){
		
		let self = this;
		// Generate a new unique ID for identifying this request
		let requestIdentifier = Guid.NewGuid();
		let logger;


	    let lvPromise = new Promise((resolve, reject) => {
//			without async in this current version of node (6.11.), we have to using the promoise to manage the sequnce.	    	
//			self.checkConfigLoaded();
	    	
            resolve();
		});
					
		lvPromise.then(()=>{
			//get the configurations
			let endpoint = self._configuration.getEndpointConfigurationValue(endpointKey);
			
				// Create a new instance of the logger to log any events for this request
			let loggerLevel = self._configuration.getConfigurationValue (LOGGING_LEVEL);
			let isLoggerLevelExist = !!loggerLevel;
			if (isLoggerLevelExist){
				logger = new self._logging(loggerLevel, requestIdentifier);
			} else {
				logger = new self._logging(LOGGING_LEVEL, requestIdentifier);
			}
			// Start the request processing timer
			//logger.Time('ApiUtil.ProcessRequest.' + endpointKey);
			logger.Info('ApiUtil.ProcessRequest.' + endpointKey);

			// Invoke the callback function if all validations were successful
			 callback(req, res, next, endpoint, logger);

		}).catch((err)=>{
			
		}).then( ()=>{
			// End the request processing timer
			if(logger){
			//	logger.TimeEnd('ApiUtil.ProcessRequest.' + endpointKey);
			}	
		});
	}

	/**
	 * Applies the default error formatting to the given error
	 *
	 * @param {object} err - The error to be formatted
	 */
	ApplyDefaultErrorFormat(err){
		var statusCode; 
		    statusCode = err.statuscode | err.statusCode ? err.statuscode | err.statusCode : 500;

		if(err.message){
			return {errors: [{status: statusCode, title: 'Error', details: err.message}]};
		}else{
			return {errors: [{status: statusCode, title: 'Error', details: JSON.stringify(err)}]};
		}
	}

	/**
	 * Retrieves values from the config server configuration file
	 *
	 * @param {string} itemKey - The specific item to be retrieved from within the given section
	 * @returns {string} The value
	 */
	getConfigurationValue(itemKey){
		//TODO
	}

};