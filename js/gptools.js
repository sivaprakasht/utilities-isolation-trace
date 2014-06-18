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
    "dojo/dom-prop",
    "dojo/dom-construct",
    "dojo/has",
    "dojo/promise/all",
    "dojo/Deferred",
    "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/CartographicLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/toolbars/draw",
    "esri/tasks/FeatureSet",
    "dojo/_base/Color",
    "dijit/layout/StackContainer",
    "dijit/layout/StackController",
    "dijit/layout/ContentPane",
    "dijit/form/Button",
    "esri/InfoTemplate",
    "dojox/timing",
    "application/functions",
    "application/editorPopup"

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
    domProp,
    domConstruct,
    has,
    all,
    Deferred,
    Graphic,
    SimpleMarkerSymbol,
    GraphicsLayer,
    SimpleRenderer,
    CartographicLineSymbol,
    PictureMarkerSymbol,
    Draw,
    FeatureSet,
    Color,
    StackContainer,
    StackController,
    ContentPane,
    Button,
    InfoTemplate,
    Timing,
    Functions,
    EditPopup

) {
    return declare([Evented], {
        map: null,
        config: {},
        layers: null,
        pointLayer: null,
        toolbar: null,
        gp: null,
        handler: null,
        constructor: function (map, config, layers, agolPopupClickHandle, agolPopupclickEventListener) {
            this.map = map;
            this.config = config;
            this.layers = layers;

            this.agolPopupClickHandle = agolPopupClickHandle;
            this.agolPopupclickEventListener = agolPopupclickEventListener;
            this.functions = new Functions();

        },
        startup: function () {

            this.toolbar = new Draw(this.map);
            this.toolbar.on("draw-end", lang.hitch(this, this._drawEnd));
            this.toolbar.on("draw-complete", lang.hitch(this, this._drawComplete));

            if (this.config.i18n != null) {
                if (this.config.i18n.map != null) {
                    if (this.config.i18n.map.mouseToolTip != null) {
                        esri.bundle.toolbars.draw.addPoint = this.config.i18n.map.mouseToolTip;

                    }
                }
            }
            this.toolbar.deactivate();

            on(dijit.byId("tools.add"), "click", lang.hitch(this, this._addTool));
            on(dijit.byId("tools.run"), "click", lang.hitch(this, this._runTool));

            if (this.config.editingAllowed === false) {
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");
                dijit.byId("tools.save").setDisabled(true)
            }
            else {
                on(dijit.byId("tools.save"), "click", lang.hitch(this, this._saveTool));
            }
            on(dijit.byId("tools.clear"), "click", lang.hitch(this, this._clearTool));

            this.gp = new esri.tasks.Geoprocessor(this.config.geoprocessing.url);

            on(this.gp, "error", lang.hitch(this, this._GPError));
            on(this.gp, "job-complete", lang.hitch(this, this._GPResults));
            on(this.gp, "status-update", lang.hitch(this, this._GPCallback));
            on(this.gp, "get-result-data-complete", lang.hitch(this, this._GPComplete));

            this.gp.setOutSpatialReference(this.map.spatialReference);


            this._createGPResults();
            this._createToolbarGraphic();
            this._createInfoWindows();
            this._createTimer();
            this._initCSVDownload();


            if (this.overviewInfo != null) {
                if (this.overviewInfo.saveOptions != null) {
                    if (this.overviewInfo.saveOptions.saveToLayer != null) {
                        this.editPopup = new EditPopup(this.map, this.config, this.overviewInfo.saveOptions.saveToLayer, this.agolPopupClickHandle, this.agolPopupclickEventListener);
                        this.editPopup.on("saving", lang.hitch(this, this._showBusyIndicator));
                        this.editPopup.on("save-complete", lang.hitch(this, this._overviewSaved));
                        this.editPopup.startup();
                        //this.editPopup.activateEditor();
                    }
                }
            }

            this.emit("ready", { "Name": "gptools" });
        },
        addToMap: function (point) {
            this.map.infoWindow.hide();
            var addType = "";
            if (domProp.get(dijit.byId("tools.add"), "iconClass") == "customBigIcon addIconSelected") {

                addType = "Flag";

            } else {
                if (dijit.byId("tools.barrier") != null) {
                    if (domProp.get(dijit.byId("tools.barrier"), "iconClass") == "customBigIcon barrierIconSelected") {

                        addType = "Barrier";

                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }

            array.some(this.gpInputDetails, function (layer) {
                if (layer.type == addType) {
                    layer.add(new Graphic(point, null, null, null));
                    return true;
                }
            });

        },
        _showBusyIndicator: function () {
            this.emit("show-busy", { "Name": "gptools" });
        },
        _hideBusyIndicator: function () {
            this.emit("hide-busy", { "Name": "gptools" });
        },
        _overviewSaved: function (info) {
            if ('error' in info) {
                alert(info.error);
            }
            else if (info.type == "Updated") {
                defs = [];

                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    if (output.type != "Overview") {
                        if (output.results != null && output.saveOptions.type) {
                            if (output.results.features != null) {
                                if (output.results.features.length > 0) {
                                    if (output.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                                        if (output.saveOptions.saveToLayer != null) {
                                            defs.push(output.saveOptions.saveToLayer.layerObject.applyEdits(output.results.features, null, null).promise);
                                        }
                                    }
                                    else if (output.saveOptions.type.toUpperCase() == "csv".toUpperCase()) {
                                        defs.push(this._createCSVContent(output.results.features, output.saveOptions.name).promise);

                                    }
                                }
                            }
                        }
                    }
                }, this);
                all(defs).then(lang.hitch(this, function (results) {

                    array.forEach(results, function (result) {
                        if ('csvdata' in result) {
                            this.csvData = this.csvData == "" ? result['csvdata'] : this.csvData + result['csvdata'];
                        }
                    }, this);

                    this._saveComplete();
                }));
            }
            else if (info.type == "Added") {
                this._hideBusyIndicator();
            }
        },
        _saveComplete: function () {

            if (this.csvData != "") {

                if (has("ie") >= 10) {
                    var blob = new Blob([this.csvData], {
                        type: "text/csv;charset=utf-8;",
                    });
                    window.navigator.msSaveBlob(blob, this.config.i18n.gp.downloadFileName + ".csv");

                }
                else if (has("chrome") > 14) {
                    var csvContent = "data:text/csv;charset=utf-8," + this.csvData;

                    var encodedUri = encodeURI(csvContent);
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", this.config.i18n.gp.downloadFileName + ".csv");

                    link.click(); // This will download the data file named "my_data.csv"

                }
                else {
                    dojo.byId("reportinput").value = this.csvData;
                    var f = dojo.byId("downloadform");
                    f.submit();
                }

            }
            this._reset();
            dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
            this._hideBusyIndicator();

        },
        _createCSVContent: function (features, title) {
            var deferred = new Deferred();

            setTimeout(function () {
                var csvNewLineChar = "\r\n";
                var csvContent = title + csvNewLineChar + csvNewLineChar;


                var atts = [];
                var dateFlds = []
                array.forEach(features.fields, function (field, index) {

                    if (field.type == "esriFieldTypeDate") {
                        dateFlds.push(index);

                    }
                    atts.push(field["alias"]);
                }
               , this);


                csvContent += atts.join(",") + csvNewLineChar;
                array.forEach(features, function (feature, index) {
                    atts = [];
                    var idx = 0;

                    for (var k in feature.attributes) {

                        if (feature.attributes.hasOwnProperty(k)) {
                            if (dateFlds.indexOf(idx) >= 0) {
                                atts.push('"' + this._formatDate(feature.attributes[k]) + '"');
                            }
                            else {
                                atts.push('"' + feature.attributes[k] + '"');
                            }
                        }
                        idx = idx + 1;
                    }


                    dataLine = atts.join(",");

                    csvContent += dataLine + csvNewLineChar + csvNewLineChar + csvNewLineChar;
                }, this);

                deferred.resolve({ "csvdata": csvContent });
            }, 1000);

            return deferred;
        },
        _createGPResults: function () {
            this.sc = new StackContainer({
                class: "resultPane",

                id: "myProgStackContainer"
            }, "stackContainer");

            this.resultLayers = [];

            array.forEach(this.config.geoprocessing.outputs, function (output) {
                var sym = null;
                var ren = null;

                var layer = new GraphicsLayer();
                layer.minScale = output.MinScale;
                layer.maxScale = output.MaxScale;
                if ("visible" in output) {
                    if (output.visible.toUpperCase() == "false".toUpperCase()) {
                        layer.setVisibility(false);

                    } else {
                        layer.setVisibility(true);
                    }
                } else {
                    layer.setVisibility(true);
                }
                layer.id = output.paramName;

                if (output.symbol != null) {

                    sym = this.functions.createGraphicFromJSON(output.symbol);
                    ren = new SimpleRenderer(sym);
                    layer.setRenderer(ren);
                }

                this.map.addLayer(layer);
                output.layer = layer;

                if (output.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                    output.saveOptions.saveToLayer = this.functions.findLayer(this.layers, output.saveOptions.name)
                    //array.some(this.layers, lang.hitch(this, function (layer) {

                    //    if (layer.title == output.saveOptions.name) {
                    //        output.saveOptions.saveToLayer = layer;
                    //        console.log(output.saveOptions.name + " " + "Set");
                    //        return true;
                    //    }

                    //}));
                }

                var cp = new ContentPane({
                    title: output.buttonText,
                    name: output.paramName,
                    id: output.paramName + "CP"

                });
                cp.on("show", lang.hitch(this, this._contentPaneShown(output)));
                cp.startup();

                this.sc.addChild(cp);
                output.resultsPane = cp;
                if (output.type.toUpperCase() != "Overview".toUpperCase()) {
                    this.resultLayers.push(layer);
                } else {
                    this.overviewInfo = output;
                }
            }, this);

            this.controller = new StackController({ containerId: "myProgStackContainer" }, "stackControl");
            this.sc.startup();
            this.controller.startup();
            this.sc.resize();
        },
        _createToolbarGraphic: function () {

            this.gpInputDetails = [];
            this.skipLayer = null;

            array.forEach(this.config.geoprocessing.inputs, function (input) {
                var inLayer = new GraphicsLayer();
                inLayer.id = input.paramName;
                inLayer.type = input.type;
                inLayer.paramName = input.paramName;

                var addSymbol = this.functions.createGraphicFromJSON(input.symbol);

                var ren = new SimpleRenderer(addSymbol);
                inLayer.setRenderer(ren);
                this.gpInputDetails.push(inLayer);
                if (input.type == "Skip") {
                    this.skipLayer = inLayer;
                }
            }, this);

            this.map.addLayers(this.gpInputDetails);
        },
        _showAllResultLayers: function () {
            array.forEach(this.resultLayers, function (layer) {
                layer.setVisibility(true);
            });
        },
        _contentPaneShown: function (gpParam) {
            return function () {
                if (gpParam.type.toUpperCase() == "Overview".toUpperCase()) {
                    this._showAllResultLayers();
                } else {
                    array.forEach(this.resultLayers, function (layer) {
                        if (layer.id == gpParam.layer.id) {
                            layer.setVisibility(true);
                        } else {
                            layer.setVisibility(false);
                        }
                    });
                }
            };
        },
        _addTool: function () {
            if (domProp.get(dijit.byId("tools.add"), "iconClass") == "customBigIcon addIconSelected") {

                this._toggleControls("false");

            } else {
                this._toggleControls("add");

            }
        },
        _runTool: function () {
            this._toggleControls("false");
            this._GPExecute();
        },
        _saveTool: function () {
            if (domProp.get(dijit.byId("tools.save"), "iconClass") == "customBigIcon saveDisabledIcon") {
                return;
            }
            if (domProp.get(dijit.byId("tools.save"), "iconClass") == "customBigIcon saveIconProcessing") {
                return;
            }

            if (this.overviewInfo.results != null) {
                if (this.overviewInfo.results.features != null) {
                    if (this.overviewInfo.results.features.length > 0) {
                        this._toggleControls("false");
                        dijit.byId("tools.save").set("iconClass", "customBigIcon saveIconProcessing");
                        var newfeat = this.editPopup.newFeature(this.overviewInfo.results.features[0].geometry);
                        this.editPopup.addFeature(newfeat);
                        dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");
                    } else {
                        dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
                    }

                } else {
                    dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
                }
            }
            else {
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
            }


            //this._saveTrace();
        },
        _clearTool: function () {
            this._reset();
        },
        _reset: function () {
            this._resetInputs();
            this._resetResults();
        },
        _resetInputs: function () {
            array.forEach(this.gpInputDetails, function (input) {
                input.clear();
            }, this);
        },
        _resetResults: function () {
            this._toggleControls("false");
            this.map.graphics.clear();

            array.forEach(this.config.geoprocessing.outputs, function (output) {
                if (output.layer != null) {
                    output.layer.clear();
                }
                if (output.resultsPane != null) {
                    output.resultsPane.set("content", "");
                }
            }, this);


        },
        _toggleControls: function (active) {

            if (this.toolbar == null) {
                return;
            }
            if (active == "false") {
                this.toolbar.deactivate();
                dijit.byId("tools.add").set("iconClass", "customBigIcon addIcon");

            } else if (active == "add") {

                this.toolbar.activate(Draw.POINT);
                dijit.byId("tools.add").set("iconClass", "customBigIcon addIconSelected");

            }

        },
        _drawEnd: function (evt) {
            this.addToMap(evt.geometry);
        },
        _drawComplete: function (evt) {
            this.map.graphics.clear();

        },
        _skipBtn: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.controlDetails.bypassButtonID);

                if (btn.get("iconClass") == "resultItemButtonSkipIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonSkipIcon resultItemButton");
                    this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = false;

                } else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = true;

                }
            };
        },
        _zoomToBtn: function (resultItem) {
            return function (e) {
                var geometry;
                if (resultItem.controlDetails.skipGraphic.geometry.type == "polyline") {
                    geometry = this._getLineCenter(resultItem.controlDetails.skipGraphic.geometry);
                } else {
                    geometry = resultItem.controlDetails.skipGraphic.geometry;
                }
                this.map.centerAt(geometry);

                this._showHighlight(geometry);

            };
        },
        _showHighlight: function (geometry) {

            this.aniLayer.clear();
            this.timer.stop();
            var highightGraphic = new Graphic(geometry, null, null, null);
            this.aniLayer.add(highightGraphic);


            this.timer.start();
        },
        _initCSVDownload: function () {
            var url = "webservices/csv.ashx";
            var f = dojo.byId("downloadform");
            f.action = url;
            dojo.byId("filename").value = this.config.i18n.gp.downloadFileName;
            this.config.csvNewLineChar = "\r\n";

            this.csvData = "";

        },
        _createTimer: function () {
            this.timer = new Timing.Timer(this.config.highlighterDetails.timeout);

            this.aniLayer = new GraphicsLayer();
            //  var aniSymbol = new PictureMarkerSymbol("./images/ani/Cyanglow.gif",25,25);
            var aniSymbol = new PictureMarkerSymbol(this.config.highlighterDetails.image, this.config.highlighterDetails.width, this.config.highlighterDetails.height);

            var aniRen = new SimpleRenderer(aniSymbol);


            this.aniLayer.id = "aniLayer";

            this.aniLayer.setRenderer(aniRen);

            this.map.addLayer(this.aniLayer);


            this.timer.onTick = lang.hitch(this, function () {
                this.timer.stop();
                console.info("hightlighter complete");
                this.aniLayer.clear();
            });


        },
        _createInfoWindows: function () {

            this.template = new InfoTemplate();
            this.template.setTitle(this.config.i18n.page.bypass);



            this.template.setContent(lang.hitch(this, this._createSkipButtonForPopup));


        },
        _createSkipButtonForPopup: function (graphic) {

            var btnBypass = null
            if (graphic.bypassed == true) {
                btnBypass = new Button({

                    baseClass: "",
                    iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                    showLabel: false

                }, dojo.create("div"));
            }
            else {
                btnBypass = new Button({

                    baseClass: "",
                    iconClass: "resultItemButtonSkipIcon resultItemButton",
                    showLabel: false

                }, dojo.create("div"));
            }
            btnBypass.startup();
            btnBypass.on("click", lang.hitch(this, this._popupSkip(graphic.resultItem)));
            return btnBypass.domNode;
        },
        _popupSkip: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.controlDetails.bypassButtonID);

                if (btn.get("iconClass") == "resultItemButtonSkipIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonSkipIcon resultItemButton");
                    this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = false;

                }
                else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                    resultItem.controlDetails.selectionGraphic.bypassed = true;

                }

                // this._skipBtn(graphic.resultItem)
                this.map.infoWindow.hide();
            }



        },
        _GPExecute: function () {
            if (domProp.get(dijit.byId("tools.run"), "iconClass") == "customBigIcon runIconProcessing") {
                return;
            }
            var params = {};
            var fs;
            var noFlags = false;
            array.forEach(this.gpInputDetails, function (layer) {

                fs = new FeatureSet();
                fs.features = layer.graphics;
                if (layer.type == "Flag") {

                    if (layer.graphics == null) {
                        noFlags = true;
                    }
                    if (layer.graphics.length === 0) {
                        noFlags = true;
                    }
                }
                if (layer.graphics.length > 0) {
                    params[layer.paramName] = fs;
                }

            });
            if (noFlags) {
                return false;
            }

            dijit.byId("tools.run").set("iconClass", "customBigIcon runIconProcessing");
            this.gp.submitJob(params);

        },
        _GPCallback: function (message) {
            console.log(message.jobInfo.jobStatus);
        },
        _GPResults: function (message) {
            if (message.jobInfo.jobStatus == "esriJobFailed") {
                console.log(message.jobInfo.jobStatus);
                alert(this.config.i18n.gp.failed);

                dijit.byId("tools.run").set("iconClass", "customBigIcon runIcon");
                return;

            }
            try {
                console.log(message.jobInfo.results);
                this._resetResults();
                this.overExtent = null;
                this.resultsCnt = 0;

                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    if (this._verifyParam(message, output.paramName)) {
                        this.resultsCnt = this.resultsCnt + 1;
                        this._processGPResults(message, output.paramName);
                    }
                }, this);

            }
            catch (exp) {
                dijit.byId("tools.run").set("iconClass", "customBigIcon runIcon");

            }
        },
        _verifyParam: function (message, paramName) {
            if (message == null) { return false; }
            if (message.jobInfo == null) { return false; }
            if (message.jobInfo.results == null) { return false; }
            for (var key in message.jobInfo.results) {
                if (paramName == key) {
                    return true;
                }
            }
            return false;

        },
        _GPComplete: function (message) {
            console.log(message.result.paramName);
            array.some(this.config.geoprocessing.outputs, function (output) {
                if (message.result.paramName == output.paramName) {
                    if (output.type.toUpperCase() == "Overview".toUpperCase()) {

                        output.results = message.result.value;
                        this._populateOverview(output);

                    } else {
                        output.results = message.result.value;
                        this._populateResultsToggle(output);

                    }
                    return true;
                }
            }, this);


        },
        _GPError: function (message) {
            console.log(message.error);
            alert(message.error.message);
            dojo.style("loader", "display", "none");
            dijit.byId("tools.run").set("iconClass", "customBigIcon runIcon");

        },
        _processGPResults: function (message, paramName) {
            this.gp.getResultData(message.jobInfo.jobId, paramName).then(lang.hitch(this, function () {
                this.resultsCnt = this.resultsCnt - 1;

                if (this.resultsCnt === 0) {


                    dijit.byId("tools.run").set("iconClass", "customBigIcon runIcon");
                    var ext = this.overExtent;
                    if (ext) {
                        this.map.setExtent(ext.expand(1.5));
                    }
                    this._showAllResultLayers();
                    this.sc.selectChild(this.overviewInfo.resultsPane);
                }
            }));

        },
        _populateOverview: function (gpParam) {
            array.forEach(gpParam.results.features, function (feature) {
                this.overExtent = this.overExtent == null ? feature.geometry.getExtent() : this.overExtent.union(feature.geometry.getExtent());
                if (gpParam.visible.toUpperCase() != "FALSE") {
                    var selectGraphic = new Graphic(feature.geometry, null, null, null);
                    if (gpParam.layer != null) {
                        gpParam.layer.add(selectGraphic);
                    }
                }
            }, this);
        },
        _populateResultsToggle: function (selectedGPParam) {

            var intResultCount = { "Count": 0, "SkipCount": 0 };

            var cp = dijit.byId(selectedGPParam.paramName + "CP");

            cp.set("content", "");


            array.forEach(selectedGPParam.results.features, function (resultItem) {
                var process = true;
                var skipLoc = null;

                if (this.skipLayer.graphics.length > 0) {
                    array.some(this.skipLayer.graphics, function (item) {
                        if (item.GPParam == selectedGPParam.paramName) {
                            if (resultItem.attributes[selectedGPParam.bypassDetails.IDField] == item.attributes[selectedGPParam.bypassDetails.IDField]) {
                                process = false;
                                skipLoc = item;
                                return true;
                            }
                        }

                    });
                }
                if (skipLoc == null) {
                    skipLoc = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                }

                var selectGraphic = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                selectedGPParam.layer.add(selectGraphic);

                var div = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "div", class: "resultItem" }, cp.containerNode);
                skipLoc.GPParam = selectedGPParam.paramName;

                var id;
                if (resultItem.attributes.OID != null) {
                    id = resultItem.attributes.OID;
                } else if (resultItem.attributes.OBJECTID != null) {
                    id = resultItem.attributes.OBJECTID;
                }

                var bypassID = selectedGPParam.paramName + ":" + id + "BypassBtn";
                var zoomToID = selectedGPParam.paramName + ":" + id + "ZoomToBtn";

                resultItem.controlDetails = {
                    "bypassButtonID": bypassID,
                    "zoomToButtonID": zoomToID,
                    "skipGraphic": skipLoc,
                    "bypassDetails": selectedGPParam.bypassDetails,
                    "selectionGraphic": selectGraphic
                };
                var btncontrolDiv = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "controls" }, div);
                var btnZoomDiv = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv" }, btncontrolDiv);

                var btnZoom = new Button({
                    id: zoomToID,

                    baseClass: "",
                    iconClass: "resultItemButtonZoomIcon resultItemButton",
                    showLabel: false

                }, btnZoomDiv);
                btnZoom.startup();
                btnZoom.on("click", lang.hitch(this, this._zoomToBtn(resultItem)));

                var btnBypass = null;
                var btnBypassDiv = null;

                if (selectedGPParam.bypassDetails.skipable && process) {
                    intResultCount.Count = intResultCount.Count + 1;
                    btnBypassDiv = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv" }, btncontrolDiv);

                    btnBypass = new Button({
                        id: bypassID,

                        baseClass: "",
                        iconClass: "resultItemButtonSkipIcon resultItemButton",
                        showLabel: false

                    }, btnBypassDiv);

                    btnBypass.startup();
                    btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                    resultItem.controlDetails.selectionGraphic.bypassed = false;
                    // selectGraphic.attributes.bypassed = false;

                    selectGraphic.setInfoTemplate(this.template);
                } else if (selectedGPParam.bypassDetails.skipable && process === false) {
                    intResultCount.SkipCount = intResultCount.SkipCount + 1;
                    btnBypassDiv = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv" }, btncontrolDiv);

                    btnBypass = new Button({
                        id: bypassID,

                        baseClass: "",
                        iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                        showLabel: false

                    }, btnBypassDiv);

                    btnBypass.startup();

                    btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                    resultItem.controlDetails.selectionGraphic.bypassed = true;
                } else {
                    resultItem.controlDetails.selectionGraphic.bypassed = false;
                    intResultCount.Count = intResultCount.Count + 1;
                }
                domConstruct.create("label", { class: "resultItemLabel", "for": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv", "innerHTML": lang.replace(selectedGPParam.displayText, resultItem.attributes) }, btncontrolDiv);
                //dojo.connect(lbl, "onClick", lang.hitch(this, this._zoomToBtn(resultItem)));

                resultItem.controlDetails.selectionGraphic.resultItem = resultItem;

            }, this);

            dojo.place("<div class='resultItem'>" + lang.replace(selectedGPParam.summaryText, intResultCount) + "</div>", this.overviewInfo.resultsPane.containerNode);

        }
    });
});
