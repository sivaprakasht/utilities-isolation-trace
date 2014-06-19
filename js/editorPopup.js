
define([
    "dojo/Evented",
    "dojo",
    "dijit",
    "esri",
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "esri/layers/FeatureLayer",
    "esri/dijit/AttributeInspector",
    "esri/tasks/query",
    "dojo/dom-construct",
    "dijit/form/Button",
    "esri/graphic",
    "application/functions",
    "dojo/dom-class",
    "dojo/NodeList-manipulate"

], function (
    Evented,
    dojo,
    dijit,
    esri,
    ready,
    declare,
    lang,
    array,
    on,
    FeatureLayer,
    AttributeInspector,
    Query,
    domConstruct,
    Button,
    Graphic,
    Functions,
    domClass

) {
    return declare([Evented], {
        config: {},
        map: null,
        layer: null,
        layerInfo: null,
        handler: null,
        options: {
            showGraphic: true
        },
        css: dojo.create("link", {
            type: "text/css",
            rel: "stylesheet",
            href: "css/editorPopup.css"
        }),
        active: false,
        constructor: function (map, config, layer, agolPopupClickHandle, agolPopupclickEventListener, options) {
            this.map = map;
            this.config = config;
            this.layer = layer;
            this.functions = new Functions();
            this.agolPopupClickHandle = agolPopupClickHandle;
            this.agolPopupclickEventListener = agolPopupclickEventListener;
            var fieldInfo = this.functions.layerFieldsToFieldInfos(layer);
            this.layerInfos = [{
                "featureLayer": this.layer.layerObject,
                "showAttachments": false,
                "isEditable": true,
                "showDeleteButton": false,
                "fieldInfos": fieldInfo
            }];

            var defaults = lang.mixin({}, this.options, options);
            // properties
            this.showGraphic = defaults.showGraphic;
            this.attsTemplate = this.layer.layerObject.templates[0].prototype.attributes;

        },

        startup: function () {
            //disconnect the popup handler
            //if (this.handler != null) {
            //    this.handler.remove();
            //}
            this._initAttEditor();
            this.selectQuery = new Query();

            this.emit("ready", { "Name": "EditorPopup" });
        },
        activateEditor: function () {
            this.mapClickEvent = this.map.on("click", lang.hitch(this, this._mapClick));

            this.infoHideEvent = this.map.infoWindow.on("hide", lang.hitch(this, this._infoHide));
            this.map.infoWindow.setContent(this.attInspector.domNode);
            this.map.infoWindow.resize(350, 240);
        },
        deactivateEditor: function () {
            if (this.mapClickEvent != null) {
                this.mapClickEvent.remove();
            }
            if (this.infoHideEvent != null) {
                this.infoHideEvent.remove();
            }

            this.map.infoWindow.setContent(null);

        },
        _initAttEditor: function () {
        
            this.attInspector = new AttributeInspector({
                layerInfos: this.layerInfos,
                _hideNavButtons: true

            }, domConstruct.create("div"));
           
            //dojo.addClass(this.attInspector.domNode, "css/editorPopup.css");
            //add a save button next to the delete button
            var saveButton = new Button({ label: this.config.i18n.ui.saveButton, "class": "saveButton" });
            domConstruct.place(saveButton.domNode, this.attInspector.deleteBtn.domNode, "after");

            saveButton.on("click", lang.hitch(this, this.saveClicked));

            this.attInspector.on("attribute-change", lang.hitch(this, function (evt) {
                //store the updates to apply when the save button is clicked 
                this.updateFeature.attributes[evt.fieldName] = evt.fieldValue;
            }));

            this.attInspector.on("next", lang.hitch(this, function (evt) {
                this.updateFeature = evt.feature;
                console.log("Next " + this.updateFeature.attributes.objectid);
            }));

            this.attInspector.on("delete", lang.hitch(this, function (evt) {
                evt.feature.getLayer().applyEdits(null, null, [evt.feature]);
                this.map.infoWindow.hide();
            }));

        
        },

        _mapClick: function (evt) {
            this.selectQuery.geometry = evt.mapPoint;
            this.selectQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            this.layer.layerObject.selectFeatures(this.selectQuery, FeatureLayer.SELECTION_NEW, lang.hitch(this, this._featureSelected));
        },
        _infoHide: function () {
            this.layer.clearSelection();
        },
        _featureSelected: function (features) {
            if (features.length > 0) {
                this.updateFeature = features[0];
                this.map.infoWindow.setTitle(this.layer.title);
                this.map.infoWindow.show(this.selectQuery.geometry.screenPoint, this.map.getInfoWindowAnchor(this.selectQuery.geometry.screenPoint));
            } else {
                this.map.infoWindow.hide();
            }
        },
        newFeature: function (geom) {
            this._initAttEditor();
            return new Graphic(geom, null, dojo.clone(this.attsTemplate));
        },

        featureAdded: function (featAdd, featUpdate, featDel) {
            if (featAdd != null) {
                if (featAdd.length > 0) {
                    var screenPoint = this.map.toScreen(this.functions.getInfoWindowPositionPoint(this.updateFeature));
                    dojo.query("head").append(this.css);
                   
                    this.map.infoWindow.setContent(this.attInspector.domNode);
                    this.map.infoWindow.resize(400, 400);
                    //this.infoHideHandler = on(this.map.infoWindow, "hide", lang.hitch(this, this.infoWindowHide));
                    if (this.agolPopupClickHandle) {
                        dojo.disconnect(this.agolPopupClickHandle);
                        this.agolPopupClickHandle = null;
                    }
                    this.map.infoWindow.show(screenPoint, this.map.getInfoWindowAnchor(screenPoint));
                }
            }

            this.emit("save-complete", { "feature": this.updateFeature, "type": "Added" });
        },
        featureUpdated: function (featAdd, featUpdate, featDel) {

            this.emit("save-complete", { "feature": this.updateFeature, "type": "Updated" });
        },
        featureError: function (error) {
            this.emit("save-complete", { "error": error });
        },

        addFeature: function (feature) {
            this.emit("saving");
            this.updateFeature = feature;

            this.layer.layerObject.applyEdits([feature], null, null, lang.hitch(this, this.featureAdded), lang.hitch(this, this.featureError));
        },
        saveClicked: function () {
            this.emit("saving");
            var e = dojo.query(this.css);
            if (e.length) {
                e = e[0];
                e.parentNode.removeChild(e);
            }
            if (!this.agolPopupClickHandle) {
                this.agolPopupClickHandle = dojo.connect(this.map, "onClick", this.agolPopupclickEventListener);
            }

            this.layer.layerObject.applyEdits(null, [this.updateFeature], null, lang.hitch(this, this.featureUpdated), lang.hitch(this, this.featureError));
            this.map.infoWindow.hide();
        },
        infoWindowHide: function (evt) {
         //   this.infoHideHandler.remove();

        },
    });
});
