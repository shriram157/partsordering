"use strict";
/*eslint-env node, es6 */

const ILogger = require('./ILogger');

/*
 * @version 1.0.0
 * @author Ray Yang <xxxx@example.com>
 */
module.exports = class ConsoleLogger extends ILogger{

	/**
	 * Writes a new debug message to the log
	 * @param {string} logMsg - The message to be logged
	 */
	Debug(logMsg, ...args){
		if(this.GetLevel() <= 1){
			let date = this.GetDateTime();
			console.log('\nDEBUG - (' + this.GetIdentifier() + ') (' + date + ') - ' + logMsg, ...args);
		}
	}

	/**
	 * Writes a new information message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Info(logMsg, ...args ){
		if(this.GetLevel() <= 2){
			let date = this.GetDateTime();
			console.log('\nINFO - (' + this.GetIdentifier() + ') (' + date + ') - ' + logMsg, ...args);
		}
	}

	/**
	 * Writes a new warning message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Warn(logMsg, ...args){
		if(this.GetLevel() <= 3){
			let date = this.GetDateTime();
			console.log('\nWARN - (' + this.GetIdentifier() + ') (' + date + ') - ' + logMsg, ...args);
		}
	}

	/**
	 * Writes a new error message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Error(logMsg, ...args){
		if(this.GetLevel() <= 4){
			let date = this.GetDateTime();
			console.log('\nERROR - (' + this.GetIdentifier() + ') (' + date + ') - ' + logMsg, ...args);
		}
	}

	/**
	 * Writes a new audit message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Audit(logMsg, ...args){
		let date = this.GetDateTime();
		console.log('\nAUDIT - (' + this.GetIdentifier() + ') (' + date + ') - ' + logMsg, ...args);
	}

	/**
	 * Begins a new named time event
	 * 
	 * @param {string} name - The name of the event
	 */
	Time(name){
		if(this.GetLevel() <= 4){
			if(!this._time[name]){
				this._time[name] = new Date().getTime();
			}
		}
	}

	/**
	 * Ends a named time event and write the timing details to the log
	 *
	 * @param {string} name - The name of the event
	 */
	TimeEnd(name){
		if(this.GetLevel() <= 4){
			if(this._time[name]){
				let date = this.GetDateTime();
				let start = this._time[name];
				let end = new Date().getTime();
				let durationms = end - start;

				console.log('\nTIME - (' + this.GetIdentifier() + ') (' + date + ') - ' + name + ': ' + durationms + 'ms');

				delete this._time[name];
			}
		}
	}
};