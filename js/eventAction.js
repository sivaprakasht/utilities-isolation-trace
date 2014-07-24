define([
    "dojo/Evented",
    "dojo",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom",
    "dojo/topic",
    "esri/tasks/query"
],
function (
    Evented,
    dojo,
    ready,
    declare,
    lang,
    array,
    on,
    dom,
    topic,
    Query
    ) {
    return declare([Evented], {
        map: null,
        config: {},
        eventLayer: null,
        constructor: function (config) {
            this.config = config;
            
        },
        startup: function () {
            this._removeEvents();
            this._events.push(topic.subscribe("app/mapLoaded", lang.hitch(this, this._mapLoaded)));

          
        },
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },
        _mapLoaded: function () {
            this.map = arguments[0];
            this._initEventLayer();
        },
        _initEventLayer: function () {
            if (this.config.eventDetails.layerName !== "") {
                array.some(this.map.operationalLayers, lang.hitch(this, function (layer) {

                    if (layer.title == this.config.eventDetails.layerName) {
                        this.config.eventDetails.EventLayer = layer;
                        console.log("Event Layer found: " + this.config.eventDetails.layerName);
                        return false;
                    }

                }));
            }
        },
        findEventFeature: function () {
            if (this.config.eventDetails.EventLayer != null) {
                if (this.config.EventID != null) {
                    var query = new Query();
                    query.where = lang.replace(this.config.eventDetails.whereClause,this.config);
                    //query.outFields = "";//["*"];

                    this.config.eventDetails.EventLayer.layerObject.queryFeatures(query, lang.hitch(this, function (featureSet) {

                        if (featureSet.features.length >= 1) {
                            
                            this.map.centerAndZoom(featureSet.features[0].geometry, this.config.eventDetails.zoomScale);
                            this.emit("EventFeature", featureSet.features[0]);
                            
                        }
                    }));
                }
            }
        }
    });
});
