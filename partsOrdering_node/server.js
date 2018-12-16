/*eslint no-console: 0, no-unused-vars: 0, no-undef:0*/
/*eslint-env node, es6 */
"use strict";

//Initialize Express App for XSA UAA and HDBEXT Middleware
var xsenv = require('@sap/xsenv');
var xssec = require('@sap/xssec');
var passport = require('passport');
var express = require('express');
var log = require("cf-nodejs-logging-support");

var https = require('https');
var server = require('http').createServer();


const ApiUtilFactory = require('./lib/utils//ApiUtilFactory');
const ProxyRequestHandler = require('./lib/ProxyRequestHandler');

//Global Initialization
var port = process.env.PORT || 3000;
https.globalAgent.options.ca = xsenv.loadCertificates();
global.__base = __dirname + '/';

//Initialize Express App for XS UAA 
var app = express();

// redirect the express log to cloud
app.use(log.logNetwork);

//logging
var apiUtil = ApiUtilFactory.creatUtility();
var logger = apiUtil.getLogger("Servr Main"); 

//passport and security staff 
var xsUaaServices = xsenv.getServices({ uaa: { tag: "xsuaa" } });
passport.use('JWT', new xssec.JWTStrategy(xsUaaServices.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));

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
