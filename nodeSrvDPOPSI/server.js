/*eslint no-console: 0, no-unused-vars: 0, no-undef:0*/
/*eslint-env node, es6 */

"use strict";

const ApiUtilFactory = require('./lib/utils//ApiUtilFactory');
const ProxyRequestHandler = require('./lib/ProxyRequestHandler');

var https = require('https');
var port = process.env.PORT || 3000;
var xsenv = require('@sap/xsenv');
var server = require('http').createServer();

https.globalAgent.options.ca = xsenv.loadCertificates();
global.__base = __dirname + '/';

//Initialize Express App for XSA UAA 
var passport = require('passport');
var xssec = require('@sap/xssec');
var express = require('express');

//logging
var apiUtil = ApiUtilFactory.creatUtility();
var logger = apiUtil.getLogger("Servr Main"); 

//Initialize Express App for XS UAA 
var app = express();

//passport and security staff 

//controlled reverse proxy  
var proxyHandler = new ProxyRequestHandler(apiUtil);
app.all( '/sap/opu/odata/sap/*', (req, res, next ) => {
	apiUtil.ProcessRequest('DESTINATION_DG2', req, res, next, (...args) => proxyHandler.apiProxy(...args));
});

//Setup Routes
var router = require('./router')(app, server);

//Start the Server
server.on('request', app);
server.listen(port, function() {
	console.info(`HTTP Server: ${server.address().port}`);
});
