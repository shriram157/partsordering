/*eslint new-cap: 0, no-console: 0, no-shadow: 0, no-unused-vars: 0*/
/*eslint-env es6, node*/

"use strict";

var env = require("./routes/env");

module.exports = (app, appContext) => {
	app.use("/node/env", env());
};