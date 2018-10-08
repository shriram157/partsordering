/*global history */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"tci/wave2/ui/parts/ordering/model/models",
		"sap/ui/Device",
		'sap/m/MessagePopover',
		'sap/m/MessageItem',
		'sap/m/Link',
		'sap/ui/model/json/JSONModel'
	], function (Controller, History, models, Device, MessagePopover, MessageItem, Link, JSONModel) {
		"use strict";
		
		var CONST_APP_STATE = "APP_STATE";
		
		var CONST_APP_ERROR = "APP_ERROR";
		
		// this section is sample
		var oLink = new Link({
			text: "Show more information",
			href: "", //  
			target: "_blank"
		});

		var oMessageTemplate = new MessageItem({
			type: '{type}',
			title: '{title}',
			description: '{description}',
			subtitle: '{subtitle}',
			counter: '{counter}',
			link: oLink
		});

		var oMessagePopover = new MessagePopover({
			items: {
				path: '/',
				template: oMessageTemplate
			}
		});
		
		
		return Controller.extend("tci.wave2.ui.parts.ordering.controller.BaseController", {
			
		
			/**
			 * Convenience method for accessing the router in every controller of the application.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return this.getOwnerComponent().getRouter();
			},

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},
			
			
			/**
			 * Event handler for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();
					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					// TODO
					this.getRouter().navTo("master", {}, true);
				}
			},

			getErrorModel : function(){
				var dataModel = sap.ui.getCore().getModel(CONST_APP_ERROR);
				if (dataModel === null || dataModel === undefined) {
					//mock data
					var sErrorDescription = 'First Error message description. \n' +
						'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod' +
						'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,' +
						'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo' +
						'consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse' +
						'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non' +
						'proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

					var aMockMessages = [{
						type: 'Error',
						title: 'Error message',
						description: sErrorDescription,
						subtitle: 'Example of subtitle',
						counter: 1
						}, {
						type: 'Warning',
						title: 'Warning without description',
						description: ''
						}, {
						type: 'Success',
						title: 'Success message',
						description: 'First Success message description',
						subtitle: 'Example of subtitle',
						counter: 1
						}, {
						type: 'Error',
						title: 'Error message',
						description: 'Second Error message description',
						subtitle: 'Example of subtitle',
						counter: 2
						}, {
						type: 'Information',
						title: 'Information message',
						description: 'First Information message description',
						subtitle: 'Example of subtitle',
						counter: 1
					}];

					dataModel = new JSONModel();
					dataModel.setData(aMockMessages);
					sap.ui.getCore().setModel(dataModel, CONST_APP_ERROR);
				}
				
				var appState = models.getAppStateModel();
				appState.setProperty('/messageListLength', aMockMessages.length + "");
				return dataModel;
			},

			initMessageHover : function(){
				var oModel = this.getErrorModel();
				oMessagePopover.setModel(oModel);
			},
			
			getHeaderMenuModel : function() {
				var dataModel = sap.ui.getCore().getModel("HeaderMenuModel");
				if (dataModel  === null || dataModel === undefined){
					var resourceBundle = this.getResourceBundle();
					var jsonData = {headeremuList : [
							{key : "001", name : resourceBundle.getText('headerMenu.CreateOrder')},
							{key : "001", name : resourceBundle.getText('headerMenu.FindOrder')},
							{key : "001", name : resourceBundle.getText('headerMenu.CheckOrderStatus')},
						]};
				
					dataModel = new sap.ui.model.json.JSONModel();
					dataModel.setData(jsonData);
					sap.ui.getCore().setModel(dataModel, "HeaderMenuModel");
				}
				return dataModel;
			}, 
			
			getStateModel : function(){
				var appState = models.getAppStateModel();
				return appState;
			},
			
			onSelectTab: function (event) {
				var key = event.getParameter('item').getKey();
				var appState = models.getAppStateModel();
				
				switch (key){
				    case "CO":
						this.getRouter().navTo("StartOrdering", null, true);
						break;
				    case "FO":
						this.getRouter().navTo("FindOrder", null, true);
						break;
				    case "CS":
						this.getRouter().navTo("CheckOrderStatus", null, true);
						break;
					default:
						this.getRouter().navTo("StartOrdering", null, true);
						break;
				}
//				appState.setProperty('/tabKey', key);

				return;
			},
			
			getBusinessPartnersByType : function(type, callBackFunction){
				var oFilter = new Array();
				oFilter[0] = new sap.ui.model.Filter("BusinessPartnerType", sap.ui.model.FilterOperator.EQ, type );

				//var bModel = models.createBusinessPartnerModel();
				var bModel = this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");
				bModel.read("/A_BusinessPartner",
					{ 
						filters:  oFilter,
						success:  function(oData, oResponse){
							var bpList= [];
							var iBP = null;
							if (!!oData && !!oData.results){
								for (var i = 0; i < oData.results.length; i++){
									iBP = {};
									iBP.BusinessPartnerType = oData.results[i].BusinessPartnerType;
									iBP.BusinessPartnerUUID = oData.results[i].BusinessPartnerUUID;
									iBP.BusinessPartner = oData.results[i].BusinessPartner;
									//iBP.Name = oData.results[i].OrganizationBPName1;
									iBP.Name = oData.results[i].BusinessPartnerName;
									iBP.Dealer = iBP.BusinessPartner.slice(-5);
									bpList.push(iBP);
								}
							}	
							callBackFunction(bpList);
						},
						error: function(err){
							// error handling here
						}
					}
				);		
			},

			handleMessagePopoverPress: function (oEvent) {
				oMessagePopover.toggle(oEvent.getSource());
			}
		});

	}
);