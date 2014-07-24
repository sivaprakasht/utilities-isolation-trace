define([
    "dojo/Evented",
    "dojo",
    "dijit",
    "esri",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/window",
    "dojo/dom-construct",
    "dojo/dom-prop",
    "dojo/has",
    "dojo/topic",
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
    "dojo/_base/array",
    "application/search",
    "application/editorPopup",
    "application/functions"
],
function (
    Evented,
    dojo,
    dijit,
    esri,
    declare,
    lang,
    _WidgetBase,
    on,
    dom,
    domClass,
    win,
    domConstruct,
    domProp,
    has,
    topic,
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
    array,
    Search,
    EditPopup,
    Functions
) {
    var Widget = declare([_WidgetBase, Evented], {
        declaredClass: "application.gptools",
       
        options: {
            toolbar: null,
            direction: "ltr",
            config: {}
        },
        // lifecycle: 1
        constructor: function (options) {

            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // properties

            this.set("buttonbar", defaults.buttonbar);
            this.set("direction", defaults.direction);
            this.set("config", defaults.config);
            //construct the buttons
            this._buttonbar = dom.byId(this.get("buttonbar"));
            if (this._buttonbar == null)
            {
                topic.publish("app\error", { message: "Toolbar div tag not found" });
                return;
            }

            this._addNode = domConstruct.place("<div id='add_button' class='add-button'></div>", this._buttonbar);
            this._deleteNode = domConstruct.place("<div id='delete_button' class='delete-button'></div>", this._buttonbar);
            this._runNode = domConstruct.place("<div id='run_button' class='run-button-disabled'></div>", this._buttonbar);
            this._saveNode = domConstruct.place("<div id='save_button' class='save-button-disabled'></div>", this._buttonbar);
            this._searchNode = domConstruct.place("<div id='searchDiv'></div>", this._buttonbar);

            // classes
            this.css = {
                addButton: "add-button",
                addButtonSelected: "add-button-selected",

                deleteButton: "delete-button",

                runButton: "run-button",
                runButtonDisabled: "run-button-disabled",

                saveButton: "save-button",
                saveButtonDisabled: "save-button-disabled"
            };
            this.search = new Search(this.config, this._searchNode);
            this.functions = new Functions();
        },
        // start widget. called by user
        startup: function () {
            this._init();
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function () {
            this._removeEvents();
            this.inherited(arguments);
        },
        resize: function () {
            this.emit("resize", {});
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */

        /* ---------------- */
        /* Public Functions */
        /* ---------------- */

        /* ---------------- */
        /* Private Events*/
        /* ---------------- */

        _drawEnd: function (evt) {
            this._addLocationToMap(evt.geometry);
        },
        _drawComplete: function (evt) {
            this.map.graphics.clear();

        },
        _windowResized: function () {

        },
        _addClicked: function () {
            // has normal class
            if (domClass.contains(this._addNode, this.css.addButton)) {
                // replace with selected class
                domClass.replace(this._addNode, this.css.addButtonSelected, this.css.addButton);
            }else if (domClass.contains(this._addNode, this.css.addButtonSelected)) {
                // replace with normal class
                domClass.replace(this._addNode, this.css.addButton, this.css.addButtonSelected);
            }
        },

        _deleteClicked: function () {
            topic.publish("app\toggleIndicator", true);
            this._reset();
            topic.publish("app\toggleIndicator", false);

        },
        _runClicked: function () {
            if (domClass.contains(this._runNode, this.css.runButtonDisabled)) {
                return;
            }

        },
        _saveClicked: function () {
            if (domClass.contains(this._saveNode, this.css.saveButtonDisabled)) {
                return;
            }

        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _mapLocate: function () {
            this._addLocationToMap( arguments[0]);
        },
        _addLocationToMap: function (point) {
            this.map.infoWindow.hide();
            var addType = "";
            if (domClass.contains(this._addNode, this.css.addButtonSelected)) {
                addType = "Flag";
            }

            array.some(this.gpInputDetails, function (layer) {
                if (layer.type == addType) {
                    layer.add(new Graphic(point, null, null, null));
                    if (domClass.contains(this._runNode, this.css.runNButtonDisabled)) {
                        domClass.replace(this._runNode, this.css.runNButtonDisabled, this.css.runButton);
                    }
                    return true;
                }
            });

        },
        _mapLoaded: function () {
            this.set("map", arguments[0]);
            return;

            this.drawbar = new Draw(this.map);
            this.drawbar.on("draw-end", lang.hitch(this, this._drawEnd));
            this.drawbar.on("draw-complete", lang.hitch(this, this._drawComplete));

            if (this.config.i18n != null) {
                if (this.config.i18n.map != null) {
                    if (this.config.i18n.map.mouseToolTip != null) {
                        esri.bundle.toolbars.draw.addPoint = this.config.i18n.map.mouseToolTip;

                    }
                }
            }
            this.drawbar.deactivate();

            if (this.config.editingAllowed === false) {
                if (domClass.contains(this._saveNode, this.css.saveButton)) {
                    // replace with normal class
                    domClass.replace(this._saveNode, this.css.saveButton, this.css.saveButtonDisabled);
                }
            } 
            
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
        },      
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },
        _init: function () {
            // setup events
            this._removeEvents();

            this.search.startup();

            //subscribe to events
            this._events.push(topic.subscribe("app/mapLocate", lang.hitch(this, this._mapLocate)));
            this._events.push(topic.subscribe("app/mapLoaded", lang.hitch(this, this._mapLoaded)));

            if (this._addNode &&
                this._saveNode &&
                this._runNode &&
                this._deleteNode) {
                var side = "left";
                if (this.get("direction") === "rtl") {
                    side = "right";
                }

                var addClick = on(this._addNode, "click", lang.hitch(this, this._addClicked));
                this._events.push(addClick);

                var deleteClick = on(this._deleteNode, "click", lang.hitch(this, this._deleteClicked));
                this._events.push(deleteClick);

                var runClick = on(this._runNode, "click", lang.hitch(this, this._runClicked));
                this._events.push(runClick);

                var saveClick = on(this._saveNode, "click", lang.hitch(this, this._saveClicked));
                this._events.push(saveClick);

                // window size event
                var winResize = on(window, "resize", lang.hitch(this, function () {
                    this._windowResized();
                }));
                this._events.push(winResize);
                // check window size
                this._windowResized();
                // fix layout
                this.resize();
                // set loaded property
                this.set("loaded", true);
                // emit loaded event
                this.emit("load", {});
            } else {
                console.log("GPTools::Missing required node");
            }
        },
        _reset: function () {
            if (domClass.contains(this._saveNode, this.css.saveButton)) {
                // replace with normal class
                domClass.replace(this._saveNode, this.css.saveButton, this.css.saveButtonDisabled);
            }
            if (domClass.contains(this._runNode, this.css.runButton)) {
                // replace with normal class
                domClass.replace(this._runNode, this.css.runButton, this.css.runButtonDisabled);
            }
            this._resetInputs();
            this._resetResults();

        },
        _overviewSaved: function (info) {
            if ("error" in info) {
                alert(info.error);
            } else if (info.type == "Updated") {
                this._saveOutputs(true);
            } else if (info.type == "Added") {
                this._hideBusyIndicator();
            }
        },
        _saveOutputs: function (skipOverview) {
            var defs = [];
            this.csvData = "";
            array.forEach(this.config.geoprocessing.outputs, function (output) {
                if ((output.type == "Overview" && skipOverview === false) || output.type != "Overview") {
                    if (output.results != null && output.saveOptions.type) {
                        if (output.results.features != null) {
                            if (output.results.features.length > 0) {
                                if (output.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
                                    if (output.saveOptions.saveToLayer != null) {
                                        defs.push(output.saveOptions.saveToLayer.layerObject.applyEdits(output.results.features, null, null).promise);
                                    }
                                } else if (output.saveOptions.type.toUpperCase() == "csv".toUpperCase()) {
                                    defs.push(this._createCSVContent(output.results, output.saveOptions.name).promise);

                                }
                            }
                        }
                    }
                }
            }, this);
            all(defs).then(
                lang.hitch(this, function (results) {

                    array.forEach(results, function (result) {
                        if ("csvdata" in result) {
                            this.csvData = this.csvData === "" ? result.csvdata : this.csvData + result.csvdata;
                        }
                    }, this);

                    this._saveComplete();
                }),

              lang.hitch(this, function (error) {
                  alert(error);
                  this._saveComplete();
              }));
        },
        _saveComplete: function () {

            if (this.csvData !== "") {

                if (has("ie") >= 10) {
                    var blob = new Blob([this.csvData], {
                        type: "text/csv;charset=utf-8;",
                    });
                    window.navigator.msSaveBlob(blob, this.config.i18n.gp.downloadFileName + ".csv");

                } else if (has("chrome") > 14) {
                    var csvContent = "data:text/csv;charset=utf-8," + this.csvData;

                    var encodedUri = encodeURI(csvContent);
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", this.config.i18n.gp.downloadFileName + ".csv");

                    link.click(); // This will download the data file named "my_data.csv"

                } else {
                    dojo.byId("reportinput").value = this.csvData;
                    var f = dojo.byId("downloadform");
                    f.submit();
                }

            }
            this._reset();
            dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");
            this._hideBusyIndicator();

        },
        _createCSVContent: function (results, title) {
            var deferred = new Deferred();

            setTimeout(lang.hitch(this, function () {
                var csvNewLineChar = "\r\n";
                var csvContent = title + csvNewLineChar + csvNewLineChar;
                var atts = [];
                var dateFlds = [];
                var idx = 0;
                if (results.features.length > 0) {
                    for (var key in results.features[0].attributes) {
                        if (results.features[0].attributes.hasOwnProperty(key)) {

                            array.some(results.fields, function (field) {
                                if (field.name == key) {
                                    if (field.type == "esriFieldTypeDate") {
                                        dateFlds.push(idx);

                                    }
                                    idx += 1;

                                    atts.push(field.alias);
                                    return true;
                                }
                            }, this);
                        }
                    }
                    csvContent += atts.join(",") + csvNewLineChar;
                    array.forEach(results.features, function (feature, index) {
                        atts = [];
                        idx = 0;

                        if (feature.attributes != null) {
                            for (var k in feature.attributes) {

                                if (feature.attributes.hasOwnProperty(k)) {
                                    if (dateFlds.indexOf(idx) >= 0) {
                                        atts.push("\"" + this._formatDate(feature.attributes[k]) + "\"");
                                    } else {
                                        atts.push("\"" + feature.attributes[k] + "\"");
                                    }
                                }
                                idx = idx + 1;
                            }
                        }
                        var dataLine = atts.join(",");

                        csvContent += dataLine + csvNewLineChar;
                    }, this);
                    csvContent += csvNewLineChar + csvNewLineChar;
                } else {
                    array.forEach(results.fields, function (field, index) {

                        atts.push(field.alias);

                    }, this);
                    csvContent += atts.join(",") + csvNewLineChar;

                }
                deferred.resolve({ "csvdata": csvContent });
            }, 1000));

            return deferred;
        },
        _formatDate: function (value) {
            var inputDate = new Date(value);
            return dojo.date.locale.format(inputDate, {
                selector: "date",
                datePattern: "MM-d-y"
            });

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
                    output.saveOptions.saveToLayer = this.functions.findLayer(this.layers, output.saveOptions.name);
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
            if (this.overviewInfo == null) {
                alert("This app requires a overview output from the GP process");
            }
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
                        if (this.editPopup != null) {

                            this._toggleControls("false");
                            dijit.byId("tools.save").set("iconClass", "customBigIcon saveIconProcessing");
                            var newfeat = this.editPopup.newFeature(this.overviewInfo.results.features[0].geometry);

                            if (this.overviewInfo.fieldMap != null) {
                                array.forEach(this.overviewInfo.fieldMap, function (field) {
                                    if (newfeat.attributes.hasOwnProperty(field.fieldName)) {
                                        array.forEach(this.config.geoprocessing.outputs, function (output) {
                                            if (output.paramName == field.paramName) {
                                                newfeat.attributes[field.fieldName] = output.results.features.length;

                                            }
                                        });
                                    }
                                }, this);
                            }
                            this.editPopup.addFeature(newfeat);
                            dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");
                        } else {
                            this._saveOutputs(false);
                        }
                    } else {
                        this._saveOutputs(true);
                    }

                } else {
                    this._saveOutputs(true);

                }
            } else {
                this._saveOutputs(true);
            }

        },
        _clearTool: function () {
            this._reset();
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
      
        _skipBtn: function (resultItem) {
            return function (e) {
                var btn = dijit.byId(resultItem.controlDetails.bypassButtonID);

                if (btn.get("iconClass") == "resultItemButtonSkipIconSelected resultItemButton") {
                    btn.set("iconClass", "resultItemButtonSkipIcon resultItemButton");
                    if (this.skipLayer != null) {
                        this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                        resultItem.controlDetails.selectionGraphic.bypassed = false;
                    }
                } else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    if (this.skipLayer != null) {
                        this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                        resultItem.controlDetails.selectionGraphic.bypassed = true;
                    }
                }
            };
        },
        _zoomToBtn: function (resultItem) {
            return function (e) {
                var geometry;
                if (resultItem.controlDetails.selectionGraphic.geometry.type == "polyline") {
                    geometry = this.functions.getLineCenter(resultItem.controlDetails.selectionGraphic.geometry);
                } else {
                    geometry = resultItem.controlDetails.selectionGraphic.geometry;
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

            var btnBypass = null;
            if (graphic.bypassed === true) {
                btnBypass = new Button({

                    baseClass: "",
                    iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                    showLabel: false

                }, dojo.create("div"));
            } else {
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
                    if (this.skipLayer != null) {
                        this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                        resultItem.controlDetails.selectionGraphic.bypassed = false;
                    }
                } else {
                    btn.set("iconClass", "resultItemButtonSkipIconSelected resultItemButton");
                    if (this.skipLayer != null) {
                        this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                        resultItem.controlDetails.selectionGraphic.bypassed = true;
                    }
                }

                // this._skipBtn(graphic.resultItem)
                this.map.infoWindow.hide();
            };

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
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");
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
                dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");

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
            dijit.byId("tools.save").set("iconClass", "customBigIcon saveDisabledIcon");

        },
        _processGPResults: function (message, paramName) {
            this.gp.getResultData(message.jobInfo.jobId, paramName).then(lang.hitch(this, function () {
                this.resultsCnt = this.resultsCnt - 1;

                if (this.resultsCnt === 0) {

                    var ext = this.overExtent;
                    if (ext) {
                        this.map.setExtent(ext.expand(1.5));
                    }
                    this._showAllResultLayers();
                    this.sc.selectChild(this.overviewInfo.resultsPane);
                    dijit.byId("tools.run").set("iconClass", "customBigIcon runIcon");
                    dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
                }
            }));

        },
        _populateOverview: function (gpParam) {
            array.forEach(gpParam.results.features, function (feature) {
                this.overExtent = this.overExtent == null ? feature.geometry.getExtent() : this.overExtent.union(feature.geometry.getExtent());
                var selectGraphic = new Graphic(feature.geometry, null, null, null);
                if (gpParam.layer != null) {
                    gpParam.layer.add(selectGraphic);
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
                if (this.skipLayer != null) {
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
                }
                var selectGraphic = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                selectedGPParam.layer.add(selectGraphic);

                var div = domConstruct.create("div", { "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "div", class: "resultItem" }, cp.containerNode);
                if (skipLoc != null) {
                    skipLoc.GPParam = selectedGPParam.paramName;
                }
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
    return Widget;
});
