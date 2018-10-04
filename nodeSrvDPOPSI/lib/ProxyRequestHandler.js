"use strict";
/* eslint-env node, es6 */

var Boom = require('boom');
var request = require('request');

/*
 * hanlder/commander class - RequestHandler
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = class ProxyRequestHandler {

    constructor(apiUtil) {
        this._apiUtil = apiUtil;
    }
    
    apiProxy(req, res, sssext, endpoint, logger){
    	
    	let self = this;    	

    	let headOptions = {};
		
		// prepare the magic reverse proxy header for odata service to work.
    	
        let originalHost = req.hostname;
        
        if (!!req.headers.host){
            headOptions.host = req.headers.host;
        }

        if (!!req.headers['x-csrf-token']){
//            headOptions['x-csrf-token'] = req.headers['x-csrf-token'];
           // headOptions['x-csrf-token'] = 'Fetch';
		   delete req.headers['x-csrf-token'];

        }
        
        if ('BASIC' ===  endpoint.authType) {
        	let authHeader = 'Basic ' + new Buffer(endpoint.userName + ':' + endpoint.password ).toString('base64');
        	headOptions.Authorization = authHeader;
        } else if ('APIKEY' === endpoint.authType ){
        	let authHeader = 'Basic ' + new Buffer(endpoint.userName + ':' + endpoint.password ).toString('base64');
        	headOptions.Authorization = authHeader;
        	headOptions.APIKey = endpoint.apiKey;
        }

        let method = req.method;
        
		let url = endpoint.proto + "://" + endpoint.host + ":" + endpoint.port + req.url;

		// if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method ===
		// } else if (method === 'GET' || method === 'HEADER' || method === 'DELETE' ) {
		// }
		
	
        let xRequest = 
			request({
				method : method,
				url : url,
				headers: headOptions
 			}
		);
        
        req.pipe(xRequest);
        
        
        xRequest.on('response', (response) => {
        	delete response.headers['set-cookie'];
        	let csrfToken = response.headers['x-csrf-token'];
        	xRequest.pipe(res);
        }).on('error', (error) => {
        	let bErr = Boom.badGateway("error", error);
        	next(Boom.badGateway("error", error));
       })   
    }
};