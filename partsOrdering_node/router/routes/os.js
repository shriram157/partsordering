/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
'use strict';
var express = require('express');

module.exports = function() {
	var app = express.Router();

	app.get('/whoAmI', (req, res) => {
		var userContext = req.authInfo;
		var result = JSON.stringify({
			userContext: userContext
		});
		res.type('application/json').status(200).send(result);
	});

	app.get('/userProfil', (req, res) => {
		var userContext = req.authInfo;
		var result = JSON.stringify({
			userContext: userContext
		});
		res.type('application/json').status(200).send(result);
	});
	
	return app;
};
