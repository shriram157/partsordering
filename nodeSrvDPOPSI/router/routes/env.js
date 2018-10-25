/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0, dot-notation:0, no-use-before-define:0 */
/*eslint-env node, es6 */

"use strict";

var express = require("express");

global.child = null;

module.exports = function() {
	var app = express.Router();
	
	//Hello Router
	app.get('/HealthCheck', (req, res, next) => {
    	let response = {
        	StatusCode: 200,
        	StatusMessage: "Success"
    	};
    	return res.status(200).json(response);
	});

	app.get('/CheckEnvironment',  (req, res) => {
		return res.status(200).json(process.versions);
	});

	app.get("/OsInfo", (req, res) => {
		let os = require("os");
		let output = {};
		
		output.tmpdir = os.tmpdir();
		output.endianness = os.endianness();
		output.hostname = os.hostname();
		output.type = os.type();
		output.platform = os.platform();
		output.arch = os.arch();
		output.release = os.release();
		output.uptime = os.uptime();
		output.loadavg = os.loadavg();
		output.totalmem = os.totalmem();
		output.freemem = os.freemem();
		output.cpus = os.cpus();
		output.networkInfraces = os.networkInterfaces();
		
		
		let result = JSON.stringify(output);
		res.type("application/json").status(200).send(result);
	});

	app.get("/Whoami", (req, res) => {
		var exec = require("child_process").exec;
		exec("whoami", (err, stdout, stderr) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			} else {
				res.type("text/plain").status(200).send(stdout);
			}
		});
	});

	app.get("/xs-login/:password", (req, res) => {
		let exec = require("child_process").exec;
		let script =
			`xs-admin-login --stdin <<< ${req.params.password} 
		 xs system-info`;
		exec(script, (err, stdout, stderr) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			} else {
				res.type("text/plain").status(200).send(stdout);
			}
		});
	});

	app.get("/xs-cmd1/:password/:cmd", (req, res) => {
		let exec = require("child_process").exec;
		let script =
			`xs-admin-login --stdin <<< ${req.params.password} 
		 xs ${req.params.cmd}`;
		exec(script, (err, stdout, stderr) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			} else {
				res.type("text/plain").status(200).send(stdout);
			}
		});
	});

	app.get("/xs-cmd/:password/:cmd", (req, res) => {
		if (global.child === null) {
			global.child = require("child_process").exec;
			var script =
				`xs-admin-login --stdin <<< ${req.params.password} 
		 xs ${req.params.cmd}`;
			global.child(script, (err, stdout, stderr) => {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					return;
				} else {
					res.type("text/plain").status(200).send(stdout);
				}
			});
		} else {
			let script2 =
				//	`xs-admin-login --stdin <<< ${cmd} 
				`xs ${req.params.cmd}`;
			global.child(script2, (err, stdout, stderr) => {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					return;
				} else {
					res.type("text/plain").status(200).send(stdout);
				}
			});
		}

	});

	app.get("/hdbsql-cmd/:user/:password/:instance/:port/:cmd", (req, res) => {
		let exec = require("child_process").exec;
		let script =
			`hdbsql -u ${req.params.user} -p ${req.params.password} -n localhost:3${req.params.instance}${req.params.port} -i 00 -m -j -A "${req.params.cmd}" `;
		exec(script, {
			maxBuffer: 1024 * 500000
		}, (err, stdout, stderr) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			} else {
				res.type("text/plain").status(200).send(stdout);
			}
		});
	});

	return app;
};