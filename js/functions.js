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
    Symbol

    ) {
    return declare(null, {
        constructor: function () {
        },
        getLineCenter: function (polyline) {

            var path = polyline.paths[Math.round(polyline.paths.length / 2) - 1];
            pointIndex = Math.round((path.length - 1) / 2) - 1;
            startPoint = path[pointIndex];
            endPoint = path[pointIndex + 1];
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
            }
            else if (json.type == "simplemarkersymbol" || json.type == "esriSMS") {
                if ('path' in json) {
                    var sms = new SimpleMarkerSymbol(json);
                    sms.setPath(json.path);
                    sms.setSize(json.size);
                    //sms.setColor(new dojo.Color(json.color));
                    sms.xoffset = json.xoffset;
                    sms.yoffset = json.yoffset;
                    return sms;

                }
                else
                    return new SimpleMarkerSymbol(json);

            }
            else if (json.type == "simplemlinesymbol" || json.type == "esriSLS") {
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
        layerFieldToAttributes: function (fields) {
            var attributes = {};
            dojo.forEach(fields, function (field) {
                attributes[field.name] = null;
            });
            return attributes;
        }
    });

});
