define([
    "dojo/Evented",
    "dojo",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dijit/layout/ContentPane",
    "dijit/TitlePane",
    "esri",
    "esri/dijit/BasemapGallery",
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
    ContentPane,
    TitlePane,
    esri,
    BasemapGallery,
    dom,
    topic
    ) {
    return declare([Evented], {
        map: null,
        config: {},
        domNode: null,
        constructor: function (config, domNode) {
            this.config = config;
            this.domNode = domNode;
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
            this._addBaseMapGallery();
        },
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },    
        _addBaseMapGallery: function () {
            var title = "Switch Basemap";
            if (this.config.i18n) {
                if (this.config.i18n.ui) {
                    if (this.config.i18n.ui.basemapButton) {

                        title = this.config.i18n.ui.basemapButton;

                    }
                }
            }

            dojo.addClass(this.domNode, "basemapButton");

            var tp = new TitlePane({ title: title, closable: false, open: false });

            this.domNode.appendChild(tp.domNode);

            tp.startup();
            var cp = new ContentPane({
                content: "<div id='basemapContent'>Switch Basemap</div>",
                style: "width: 380px; height: 280px; overflow: auto;"
            }).placeAt(tp.containerNode);
            cp.startup();

            if (this.config.basemapGalleryGroupQuery) {
                this.basemapGallery = new BasemapGallery({
                    basemap: this.config.basemapGalleryGroupQuery,
                    map: this.map
                }, "basemapContent");
            } else {
                this.basemapGallery = new BasemapGallery({
                    showArcGISBasemaps: true,
                    map: this.map
                }, "basemapContent");
            }

            this.basemapGallery.startup();

            this.basemapGallery.on("error", function (msg) {
                console.log("basemap gallery error:  ", msg);
            });
        },

    });
});
