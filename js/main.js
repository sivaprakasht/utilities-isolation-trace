/*global define ,document */
/*jslint sloppy:true,nomen:true */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/on",
    "dojo/topic",
    "application/Drawer",
    "application/eventAction",
    "application/basemapButton",
    "application/navigationButtons"
], function (
    ready,
    declare,
    lang,
    arcgisUtils,
    dom,
    domClass,
    on,
    topic,
    Drawer,
    EventAction,
    BasemapButton,
    NavigationButtons
    ) {
    return declare(null, {
        config: {},
        startup: function (config) {
            // config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information.
            this._toggleIndicatorListener = topic.subscribe("app\toggleIndicator", this._toggleIndicator);
            this._errorListener = topic.subscribe("app\error", this.reportError);

            if (config) {
                this.config = config;
                this._checkEditing();
                // responsive drawer
                this._drawer = new Drawer({
                    showDrawerSize: 850, // Pixel size when the drawer is automatically opened
                    borderContainer: "border_container", // border container node id
                    contentPaneCenter: "cp_center", // center content pane node id
                    contentPaneSide: "cp_left", // side content pane id
                    topbar: "topbar", // toolbar id
                    toggleButton: "toggle_button", // button node to toggle drawer id
                    addButton: "add_button", // button node to add button id
                    direction: this.config.i18n.direction, // i18n direction "ltr" or "rtl"
                    config: this.config
                });
                // startup drawer
                this._drawer.startup();

                this.eventAction = new EventAction(this.config);
                this.eventAction.startup();


                this.basemapButton = new BasemapButton(this.config, dojo.byId("basemapDiv"));
                this.basemapButton.startup();

                this.navigationButtons = new NavigationButtons(this.config, "LocateButton","HomeButton");
                this.navigationButtons.startup();

                // document ready
                ready(lang.hitch(this, function () {
                    //supply either the webmap id or, if available, the item info
                    var itemInfo = this.config.itemInfo || this.config.webmap;
                    this._createWebMap(itemInfo);
                }));
            } else {
                var error = new Error("Main:: Config is not defined");
                this.reportError(error);
            }
        },
        reportError: function (error) {
            // remove loading class from body
            domClass.remove(document.body, "app-loading");
            domClass.add(document.body, "app-error");
            // an error occurred - notify the user. In this example we pull the string from the
            // resource.js file located in the nls folder because we've set the application up
            // for localization. If you don't need to support multiple languages you can hardcode the
            // strings here and comment out the call in index.html to get the localization strings.
            // set message
            var node = dom.byId("loading_message");
            if (node) {
                if (this.config && this.config.i18n) {
                    node.innerHTML = this.config.i18n.map.error + ": " + error.message;
                } else {
                    node.innerHTML = "Unable to create map: " + error.message;
                }
            }
        },
        // Map is ready
        _mapLoaded: function () {
            topic.publish("app/mapLoaded", this.map);
          
            this.eventAction.findEventFeature();
            // remove loading class from body
            this._toggleIndicator(false);
        },
        _toggleIndicator: function (events) {
            if (events) {
                domClass.add(document.body, "app-loading");
            } else {
                domClass.remove(document.body, "app-loading");
            }
        },
        _checkEditing: function () {
            if (this.config.editingAllowed == null) {
                this.config.editingAllowed = false;

                if (this.config == null) {
                    this.config.editingAllowed = true;

                }
                if (this.config.userPrivileges == null) {
                    this.config.editingAllowed = true;

                } else {
                    for (var key in this.config.userPrivileges) {
                        if (this.config.userPrivileges[key] == "features:user:edit") {
                            this.config.editingAllowed = true;
                            return this.config.editingAllowed;

                        }
                    }
                }

            }
            return this.config.editingAllowed;

        },
        // create a map based on the input web map id
        _createWebMap: function (itemInfo) {
            arcgisUtils.createMap(itemInfo, "mapDiv", {
                mapOptions: {
                    // Optionally define additional map config here for example you can
                    // turn the slider off, display info windows, disable wraparound 180, slider position and more.
                },
                bingMapsKey: this.config.bingKey
            }).then(lang.hitch(this, function (response) {
                // Once the map is created we get access to the response which provides important info
                // such as the map, operational layers, popup info and more. This object will also contain
                // any custom options you defined for the template. In this example that is the 'theme' property.
                // Here' we'll use it to update the application to match the specified color theme.
                // console.log(this.config);
                this.map = response.map;

                this.handler = response.clickEventHandle;

                this.map.operationalLayers = response.itemInfo.itemData.operationalLayers;

                // make sure map is loaded
                if (this.map.loaded) {
                    // do something with the map
                    this._mapLoaded();
                } else {
                    on.once(this.map, "load", lang.hitch(this, function () {
                        // do something with the map
                        this._mapLoaded();
                    }));
                }
            }), this.reportError);
        }
    });
});