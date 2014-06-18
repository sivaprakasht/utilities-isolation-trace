define([
    "dojo/Evented",
    "dojo",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom",
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
    Query
    ) {
    return declare([Evented], {
        map: null,
        config: {},
        layers: null,
        eventLayer: null,
        constructor: function (map, config, layers) {
            this.map = map;
            this.config = config;
            this.layers = layers;
        },
        startup: function () {
            this._initEventLayer();
        },
        _initEventLayer: function () {
            if (this.config.eventDetails.layerName != "") {
                array.some(this.layers, lang.hitch(this, function (layer) {

                    if (layer.title == this.config.eventDetails.layerName) {
                        this.eventLayer = layer;
                        console.log("Event Layer found: " + this.config.eventDetails.layerName);
                        return false;
                    }

                }));
            }
        },
        findEventFeature: function () {
            if (this.eventLayer != null) {
                if (this.config.eventDetails.EventID != null) {
                    var query = new Query();
                    query.where = lang.replace(this.config.eventDetails.whereClause, this.config.eventDetails);
                    query.outFields = "";//["*"];

                    this.eventLayer.layerObject.queryFeatures(query, lang.hitch(this, function (featureSet) {

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
