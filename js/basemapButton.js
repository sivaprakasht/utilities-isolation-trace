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
    "dojo/topic",
    "dojo/i18n!application/nls/resources"
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
    topic,
    i18n
    ) {
    return declare([Evented], {
        options: {
            basemapGalleryGroupQuery: null,
            domNode: null
        },
        constructor: function (options) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            this._i18n = i18n;


            this.basemapGalleryGroupQuery = defaults.basemapGalleryGroupQuery;
            this.domNode = defaults.domNode;

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
            this._basemapGallery = dojo.byId(this.domNode);
            if (this._basemapGallery) {
                var title = "Switch Basemap";
                if (this._i18n) {
                    if (this._i18n.ui) {
                        if (this._i18n.ui.basemapButton) {

                            title = this._i18n.ui.basemapButton;

                        }
                    }
                }

                dojo.addClass(this._basemapGallery, "basemapButton");

                var tp = new TitlePane({ title: title, closable: false, open: false });

                this._basemapGallery.appendChild(tp.domNode);

                tp.startup();
                var cp = new ContentPane({
                    content: "<div id='basemapContent'>Switch Basemap</div>",
                    style: "width: 380px; height: 280px; overflow: auto;"
                }).placeAt(tp.containerNode);
                cp.startup();

                if (this.basemapGalleryGroupQuery) {
                    this.basemapGallery = new BasemapGallery({
                        basemap: this.basemapGalleryGroupQuery,
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
            }
        },

    });
});
