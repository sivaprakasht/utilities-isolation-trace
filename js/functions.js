define([
    "dojo",
    "dijit",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/Symbol",
    "esri/geometry/Point",
    "esri/geometry/Extent"
],
function (
    dojo,
    dijit,
    declare,
    lang,
    array,
    SimpleMarkerSymbol,
    PictureMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Symbol,
    Point,
    Extent

    ) {
    return declare(null, {
        constructor: function () {
        },
        getLineCenter: function (polyline) {

            var path = polyline.paths[Math.round(polyline.paths.length / 2) - 1];
            var pointIndex = Math.round((path.length - 1) / 2) - 1;
            var startPoint = path[pointIndex];
            var endPoint = path[pointIndex + 1];
            return new Point((startPoint[0] + endPoint[0]) / 2.0, (startPoint[1] + endPoint[1]) / 2.0, polyline.spatialReference);
        },
        findLayer: function (layers, layerName) {
            var result = null;

            array.some(layers, function (layer) {

                if (layer.layerObject.layerInfos != null) {
                    array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
                        if (layerName == subLyrs.name) {
                            if (layer.layers != null) {
                                array.forEach(layer.layers, function (popUp) {
                                    if (subLyrs.id == popUp.id) {
                                        layer.popupInfo = popUp.popupInfo;
                                    }
                                }, this);
                            }
                            result = layer;
                            return true;
                        }
                    }, this);
                } else {
                    if (layerName == layer.title) {

                        result = layer;
                        return true;
                    }
                }
            });
            return result;
        },
        createGraphicFromJSON: function (json) {
            //simplemarkersymbol | picturemarkersymbol | simplelinesymbol | cartographiclinesymbol | simplefillsymbol | picturefillsymbol | textsymbol

            if (json.type == "simplefillsymbol" || json.type == "esriSFS") {
                return new SimpleFillSymbol(json);
            }else if (json.type == "simplemarkersymbol" || json.type == "esriSMS") {
                if ("path" in json) {
                    var sms = new SimpleMarkerSymbol(json);
                    sms.setPath(json.path);
                    sms.setSize(json.size);
                    //sms.setColor(new dojo.Color(json.color));
                    sms.xoffset = json.xoffset;
                    sms.yoffset = json.yoffset;
                    return sms;

                }else {
                    return new SimpleMarkerSymbol(json);
                }
            }else if (json.type == "simplemlinesymbol" || json.type == "esriSLS") {
                return new SimpleLineSymbol(json);
            }

        },
        getInfoWindowPositionPoint: function (feature) {
            var point;
            switch (feature.getLayer().geometryType) {
                case "esriGeometryPoint":
                    point = feature.geometry;
                    break;
                case "esriGeometryPolyline":
                    var pathLength = feature.geometry.paths[0].length;
                    point = feature.geometry.getPoint(0, Math.ceil(pathLength / 2));
                    break;
                case "esriGeometryPolygon":
                    point = feature.geometry.getExtent().getCenter();
                    break;
            }
            return point;
        },

        layerFieldsToFieldInfos: function (layer) {
            var fieldInfo = null;
            if (layer.popupInfo != null) {
                if (layer.popupInfo.fieldInfos != null) {
                    array.forEach(layer.popupInfo.fieldInfos, function (fieldInfo) {
                        if (fieldInfo.format != null) {
                            if (fieldInfo.format.dateFormat != null) {
                                if (fieldInfo.format.dateFormat == "shortDateShortTime" ||
                                    fieldInfo.format.dateFormat == "shortDateShortTime24" ||
                                    fieldInfo.format.dateFormat == "shortDateLEShortTime" ||
                                    fieldInfo.format.dateFormat == "shortDateLEShortTime24")
                                {
                                    fieldInfo.format.time = true;
                                }
                                
                                
                            }
                        }
                    });
                    fieldInfo = layer.popupInfo.fieldInfos;
                }
            }
            if (fieldInfo == null) {
                fieldInfo = array.map(layer.layerObject.fields, function (field) {
                    return {
                        "fieldName": field.name,
                        "isEditable": field.editable,
                        "tooltip": field.alias,
                        "label": field.alias,
                        "format": { "time": true }
                    };
                });
            }
          
            return array.filter(fieldInfo, function (field) {
                return field.visible;
            });
        },
    });

});
