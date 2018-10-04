"use strict";
/*eslint-env node, es6 */

const crypto = require("crypto");

/**
* Generates a new secure random GUID
* @version 1.0.0
* @author Ray Yang <xxxx@example.com>
* @returns {string} The newly generated guid
*/
module.exports.NewGuid = function(){
	var parts = [];

	parts.push(crypto.randomBytes(4).toString("hex"));
	parts.push(crypto.randomBytes(2).toString("hex"));
	parts.push(crypto.randomBytes(2).toString("hex"));
	parts.push(crypto.randomBytes(2).toString("hex"));
	parts.push(crypto.randomBytes(6).toString("hex"));

	return parts.join('-');
};