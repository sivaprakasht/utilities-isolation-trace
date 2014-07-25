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
    "esri/tasks/query",
    "dojo/i18n!application/nls/resources",
    "application/functions"
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
    Query,
    i18n,
    Functions
    ) {
    return declare([Evented], {
        options: {
            layerName: null,
            whereClause: null,
            eventID: null,
            zoomScale: 16
        },
        constructor: function (options) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            this._i18n = i18n;
            this.layerName = defaults.layerName;
            this.whereClause = defaults.whereClause;
            this.eventID = defaults.eventID;
            this.zoomScale = defaults.zoomScale;
            this._helperFunctions = new Functions();
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
            if (this.eventID != null) {
                this._eventLayer = this._helperFunctions.findLayer(this.map.operationalLayers, this.layerName);

                if (this._eventLayer != null) {

                    var query = new Query();
                    query.where = lang.replace(this.whereClause, this.config);
                    if (this._eventLayer.layerObject) {
                        this._eventLayer.layerObject.queryFeatures(query, lang.hitch(this, function (featureSet) {

                            if (featureSet.features.length >= 1) {

                                this.map.centerAndZoom(featureSet.features[0].geometry, this.zoomScale);
                                this.emit("EventFeature", featureSet.features[0]);

                            }
                        }));
                    }
                }
            }
        }
    });
});
