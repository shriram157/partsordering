"use strict";
/*eslint-env node, es6 */

/*
 * @version 1.0.0
 * @author Ray Yang <xxxx@example.com>
 */
module.exports = class ILogger {

	/**
	 * Constructs a new instance of the logger class
	 * @param {number} level - The logging level
	 * @param {string} identifier - The identifier for this logger
	 */
	constructor(level, identifier){
		this._level = level;
		this._identifier = identifier;
		this._time = {};
	}
	
	static get LOGGING_LEVEL() {
		return {
			DEBUG: 1,
			INFO:  2,
			WARN:  3,
			ERROR: 4
		};
	}
	
	get logNetwork() {
		// null
		return null;
	}
	
	/**
	 * Writes a new debug message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Debug(...args){

	}

	/**
	 * Writes a new warning message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Warn(...args){

	}

	/**
	 * Writes a new information message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Info(...args){

	}

	/**
	 * Writes a new error message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Error(...args){

	}

	/**
	 * Writes a new error message to the log
	 *
	 * @param {string} logMsg - The message to be logged
	 */
	Audit(...args){

	}

	/**
	 * Starts a new logged timed event
	 *
	 * @param {string} name - The name of the event
	 */
	Time(name){

	}

	/**
	 * End a logged timed event
	 *
	 * @param {string} name - The name of the event
	 */
	TimeEnd(name){
		
	}

	/**
	 * The logging level
	 *
	 * @returns {number} The logging level
	 */
	GetLevel(){
		return this._level;
	}

	/**
	 * The logging identifier
	 *
	 * @returns {string} The logging identifier
	 */
	GetIdentifier(){
		return this._identifier;
	}

	/**
	 * Gets the current formatted date and time
	 *
	 * @returns {string} The current formatted date and time
	 */
	GetDateTime() {

	    let date = new Date();

	    let hour = date.getHours();
	    hour = (hour < 10 ? "0" : "") + hour;

	    let min  = date.getMinutes();
	    min = (min < 10 ? "0" : "") + min;

	    let sec  = date.getSeconds();
	    sec = (sec < 10 ? "0" : "") + sec;

	    let year = date.getFullYear();

	    let month = date.getMonth() + 1;
	    month = (month < 10 ? "0" : "") + month;

	    let day  = date.getDate();
	    day = (day < 10 ? "0" : "") + day;

	    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
	}
};