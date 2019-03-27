"use strict";
/* eslint-env node, es6 */

var Boom = require('boom');
var request = require('request');
var {
	URL
} = require('url');
/*
 * hanlder/commander class - RequestHandler
 */
module.exports = class ProxyRequestHandler {

	constructor(apiUtil) {
		this._apiUtil = apiUtil;
	}

	apiProxy(req, res, next, endpoint, logger) {

		let self = this;

		let headOptions = {};

		// prepare the magic reverse proxy header for odata service to work.

		let originalHost = req.hostname;

		// for the application to work with APIGEE gateway, has to remove the host header
		if (!!req.headers.host) {
			//            headOptions.host = req.headers.host;
			delete req.headers['host'];
		}

		//     if (!!req.headers['x-csrf-token']){
		//         headOptions['x-csrf-token'] = req.headers['x-csrf-token'];
		//     	headOptions['x-csrf-token'] = 'Fetch';
		// delete req.headers['x-csrf-token'];
		//     }

		if ('BASIC' === endpoint.authType) {
			let authHeader = 'Basic ' + new Buffer(endpoint.userName + ':' + endpoint.password).toString('base64');
			headOptions.Authorization = authHeader;
		} else if ('APIKEY' === endpoint.authType) {
			let authHeader = 'Basic ' + new Buffer(endpoint.userName + ':' + endpoint.password).toString('base64');
			headOptions.Authorization = authHeader;
			headOptions.APIKey = endpoint.apiKey;
		}

		let method = req.method;
		let newUrl = req.url;
		if (newUrl !== undefined && newUrl !== null) {
			let iSub = newUrl.indexOf(endpoint.prefix);
			iSub = iSub + endpoint.prefix.length - 1;
			if (iSub > 0 && iSub < newUrl.length) {
				newUrl = newUrl.substr(iSub);
			}
		}

		let url = endpoint.proto + "://" + endpoint.host + ":" + endpoint.port + newUrl;

		// Add/update sap-client query parameter with UPS value in the proxied URL
		if (endpoint.type === "odata") {
			var urlObj = new URL(url);
			urlObj.searchParams.delete("sap-client");
			urlObj.searchParams.set("sap-client", endpoint.client);
			url = urlObj.href;
		}

		let xRequest =
			request({
				method: method,
				url: url,
				headers: headOptions
			});

		req.pipe(xRequest);

		xRequest.on('response', (response) => {
			// in order to make the csrfToken work
			//delete response.headers['set-cookie'];
			let csrfToken = response.headers['x-csrf-token'];
			xRequest.pipe(res);
		}).on('error', (error) => {
			//let bErr = Boom.badGateway("error", error);
			next(Boom.badGateway("error", error));
		});
	}
};