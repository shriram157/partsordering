/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
'use strict';

var xsenv = require('@sap/xsenv');
var express = require('express');

module.exports = function () {
	var router = express.Router();

	router.get("/userProfile", (req, res) => {
		res.type('application/json').status(200).send(JSON.stringify({
			userContext: {
				scopes: JSON.parse(JSON.stringify(req.authInfo.scopes)),
				userAttributes: JSON.parse(JSON.stringify(req.authInfo.userAttributes)),
				userInfo: JSON.parse(JSON.stringify(req.authInfo.userInfo))
			}
		}));
	});

	router.get('/uiConfig', (req, res) => {
		// Get UPS name from env var UPS_NAME
		var apimServiceName = process.env.UPS_NAME;
		let options = {};
		options = Object.assign(options, xsenv.getServices({
			api: {
				name: apimServiceName
			}
		}));
		res.json(options.UI_CONFIG);
	});

	return router;
};