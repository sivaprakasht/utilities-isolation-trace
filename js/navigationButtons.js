define([
    "dojo/Evented",
    "dojo",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "esri",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "dojo/dom",
    "dojo/topic"
],
function (
    Evented,
    dojo,
    ready,
    declare,
    lang,
    array,
    on,
    esri,
    HomeButton,
    LocateButton,
    dom,
    topic
    ) {
    return declare([Evented], {
        map: null,
        config: {},
        domNode: null,
        constructor: function (config, homeID,locateID) {
            this.config = config;
            this.homeID = homeID;
            this.locateID = locateID;
        },
        // start widget. called by user
        startup: function () {
            this._init();
        },

        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function () {
            this._removeEvents();
            this._events.push(topic.subscribe("app/mapLoaded", lang.hitch(this, this._mapLoaded)));
        },
        _mapLoaded: function () {
            this.map = arguments[0];
            this._addLocatorButton();
            this._addHomeButton();
        },
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },    
        _addLocatorButton: function () {

            this.locateButton = new LocateButton({
                map: this.map,
                pointerGraphic: null,
                centerAt: false,
                highlightLocation: false,
                setScale: false,
                theme: "LocateButtonCalcite"
            }, this.locateID);

            on(this.locateButton, "locate", lang.hitch(this, this._locate));

            this.locateButton.startup();
            //dojo.addClass(this.homeID, "LocateButtonCalcite");

        },
        _addHomeButton: function () {

            this.homeButton = new HomeButton({
                map: this.map,
                theme: "HomeButtonCalcite"
            }, this.homeID);

            on(this.homeButton, 'home', lang.hitch(this, function () {
                if (this.locateButton) {
                    this.locateButton.clear();
                }
            }));

            this.homeButton.startup();
            //dojo.addClass(dom.byId(divID), "HomeButtonCalcite");

        },
        _locate: function (location) {
            this.locateButton.clear();

            if (location.error != null) {
                alert(location.error);

            } else {
                var point = new Geometry.Point({ "x": location.position.coords.longitude, "y": location.position.coords.latitude, " spatialReference": { " wkid": 4326 } });
                alert(location.position.coords.longitude);

                this.map.centerAndZoom(point, this.config.locateOptions.zoomLevel);

                topic.publish("app/mapLocate", point);

                //_locateOnMap: function(point){
                //    this.map.centerAndZoom(point, this.config.locateOptions.zoomLevel);
                //    if (this.config.locateOptions.addLocation === true) {
                //        this.GPTools.addToMap(point);
                //    }
                //},
        
            }

        }
    });
});
