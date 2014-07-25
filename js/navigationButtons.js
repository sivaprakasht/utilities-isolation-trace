define([
    "dojo/Evented",
    "dijit/_WidgetBase",
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
    "dojo/topic",
    "esri/geometry"
],
function (
    Evented,
    _WidgetBase,
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
    topic,
    Geometry
    ) {
    return declare([_WidgetBase, Evented], {
        options: {
            toolbar: null,
            direction: "ltr",
            map: null,
            homeID: null,
            locateID: null,
            zoomScale: 16
        },
        constructor: function (options) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);

            this.set("homeID", defaults.homeID);
            this.set("locateID", defaults.locateID);
            this.set("zoomScale", defaults.zoomScale);
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
            this.set("map",arguments[0]);
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

            this._LocateButtonLight = new LocateButton({
                map: this.map,
                pointerGraphic: null,
                centerAt: false,
                highlightLocation: false,
                setScale: false,
                theme: "LocateButtonLight"
            }, this.get("locateID"));

            on(this._LocateButtonLight, "locate", lang.hitch(this, this._locate));

            this._LocateButtonLight.startup();
            

        },
        _addHomeButton: function () {

            this._HomeButtonLight = new HomeButton({
                map: this.map,
                theme: "HomeButtonLight"
            }, this.get("homeID"));

            on(this._HomeButtonLight, 'home', lang.hitch(this, function () {
                if (this._LocateButtonLight) {
                    this._LocateButtonLight.clear();
                }
            }));

            this._HomeButtonLight.startup();
            

        },
        _locate: function (location) {
            this._LocateButtonLight.clear();

            if (location.error != null) {
                alert(location.error);

            } else {
                var point = new Geometry.Point({ "x": location.position.coords.longitude, "y": location.position.coords.latitude, " spatialReference": { " wkid": 4326 } });
            
                this.map.centerAndZoom(point, this.get("zoomScale"));;

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
