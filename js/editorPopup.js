
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
    "application/functions"

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
    Functions

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
        active: false,
        constructor: function (map, config, layer,handler, options) {
            this.map = map;
            this.config = config;
            this.layer = layer;
            if (layer.popupInfo != null) {
                if (layer.popupInfo.fieldInfos != null) {
                    fieldInfo = layer.popupInfo.fieldInfos;
                }
            }
            if (fieldInfo == null) {
                fieldInfo = array.map(layer.layerObject.fields, function (field) {
                    return { 'fieldName': field.name, 'isEditable': field.editable, 'tooltip': field.alias, 'label': field.alias };
                });
            }
            this.layerInfos = [{
                'featureLayer': this.layer.layerObject,
                'showAttachments': false,
                'isEditable': true,
                'fieldInfos': fieldInfo
            }];
            
            this.handler = handler;
            var defaults = lang.mixin({}, this.options, options);
            // properties
            this.showGraphic = defaults.showGraphic;
            this.functions = new Functions();
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
                layerInfos: this.layerInfos
            }, domConstruct.create("div"));

            //add a save button next to the delete button
            var saveButton = new Button({ label: "Save", "class": "saveButton" });
            domConstruct.place(saveButton.domNode, this.attInspector.deleteBtn.domNode, "after");

            saveButton.on("click", lang.hitch(this, this.featureSaved));

            this.attInspector.on("attribute-change", lang.hitch(this,function (evt) {
                //store the updates to apply when the save button is clicked 
                this.updateFeature.attributes[evt.fieldName] = evt.fieldValue;
            }));

            this.attInspector.on("next", lang.hitch(this,function (evt) {
                this.updateFeature = evt.feature;
                console.log("Next " + this.updateFeature.attributes.objectid);
            }));

            this.attInspector.on("delete",lang.hitch(this, function (evt) {
                evt.feature.getLayer().applyEdits(null, null, [evt. feature]);
                this.map.infoWindow.hide();
            }));

    
        },

        _mapClick: function (evt) {
            this.selectQuery.geometry = evt.mapPoint;
            this.selectQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            this.layer.layerObject.selectFeatures(this.selectQuery, FeatureLayer.SELECTION_NEW, lang.hitch(this,this._featureSelected));
        },
        _infoHide:  function () {
            this.layer.clearSelection();
        },
        _featureSelected: function (features) {
            if (features.length > 0) {
                //store the current feature
                this.updateFeature = features[0];
                this.map.infoWindow.setTitle(this.layer.title);
                this.map.infoWindow.show(this.selectQuery.geometry.screenPoint, this.map.getInfoWindowAnchor(this.selectQuery.geometry.screenPoint));
            } else {
                this.map.infoWindow.hide();
            }
        },
        createFeature: function (geom) {
            //var atts = {}
            //this.layer.layerObject.templates.
            //array.forEach(this.layer.layerObject.fields, function (field) {
            //    atts[field.name] = "";
            //});
            return new Graphic(geom, null, this.layer.layerObject.templates[0].prototype.attributes);
           
        },
        addFeature: function (feature) {
            this.layer.layerObject.applyEdits([feature], null, null, lang.hitch(this,function () {
                var screenPoint = this.map.toScreen(this.functions.getInfoWindowPositionPoint(feature));
                this.updateFeature = feature;
                this.map.infoWindow.setContent(this.attInspector.domNode);
                this.map.infoWindow.resize(325, 185);
                this.map.infoWindow.show(screenPoint, this.map.getInfoWindowAnchor(screenPoint));

                
            }));


          //  this.layer.layerObject.add(feature);
          //  this.map.infoWindow.setContent(this.attInspector.domNode);
          //  //this.selectQuery.spatialRelationship = Query.SPATIAL_REL_OVERLAPS;
          //  this.selectQuery.geometry = feature.geometry.getExtent().getCenter();
          //  this.layer.layerObject.selectFeatures(this.selectQuery, FeatureLayer.SELECTION_NEW, lang.hitch(this, this._featureSelected));
          //  //this.layer.layerObject._selectedFeaturesArr.push(feature)
          //////store the current feature
          ////  this.updateFeature = feature;
          ////  var screenPoint = this.map.toScreen(feature.geometry.getExtent().getCenter());
          ////  this.map.infoWindow.setTitle(this.layer.title);

            //this.map.infoWindow.show(screenPoint, this.map.getInfoWindowAnchor(screenPoint));
            
        },
        featureSaved: function(){
            this.updateFeature.getLayer().applyEdits(null, [this.updateFeature], null);
            this.emit("featureSaved", { "Name": "EditorPopup" });
        }
    });
});
