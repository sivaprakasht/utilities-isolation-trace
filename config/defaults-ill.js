/*
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([], function () {

    var defaults = {
        "appid": "",
        "webmap": "f227e36832834083a8621181c17a8c5e",
        "oauthappid": null,
        "proxyurl": "http://localhost/proxy/auth_proxy.ashx",
        "theme": "black",
        "bingKey": "",
        "sharinghost": location.protocol + "//" + "www.arcgis.com",
        "units": null,
        "helperServices": {
            "geometry": {
                "url": "http://localhost:6080/arcgis/rest/services/Utilities/Geometry/GeometryServer"
            },
            "printTask": {
                "url": null
            },
            "elevationSync": {
                "url": null
            },
            "geocode": [
              {
                  "url": null
              }
            ]
        },
        "locateOptions": {
            "zoomLevel": 18,
            "addLocation": true
        },
        "highlighterDetails": {
            "image": "/Isolationtrace/images/ani/blueglow.gif",
            "height": 60,
            "width": 60,
            "timeout": 5000
        },
        "eventDetails": {
            "layerName": "Leak Report",
            "whereClause": "OBJECTID = {EventID}",
            "zoomScale": 18
        },
        "geoprocessing": {
            "url": "http://localhost:6080/arcgis/rest/services/UpstreamTrace/GPServer/UpstreamTrace",
            "inputs": [
              {
                  "paramName": "Flags",
                  "type": "Flag",
                  "symbol": {
                      "type": "esriSMS",
                      "style": "path",
                      "path": "M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z",
                      "color": [
                        0,
                        0,
                        255,
                        255
                      ],
                      "outline": {
                          "color": [
                            0,
                            0,
                            0,
                            255
                          ],
                          "style": "esriSLSSolid",
                          "type": "esriSLS",
                          "width": 1
                      },
                      "size": 30,
                      "angle": 0,
                      "xoffset": 2,
                      "yoffset": 15
                  }
              }
            ],
            "outputs": [
              {
                  "paramName": "Affected_Area",
                  "type": "Overview",
                  "buttonText": "Summary",
                  "visible": "false",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "simplefillsymbol",
                      "style": "esriSFSNull",
                      "color": [
                        0,
                        0,
                        0,
                        0
                      ],
                      "outline": {
                          "type": "esriSLS",
                          "style": "esriSLSSolid",
                          "color": [
                            255,
                            0,
                            0,
                            255
                          ],
                          "width": 3
                      }
                  },
                  "saveOptions": {
                      "type": "",
                      "name": ""
                  },
                  "fieldMap": [

                  ]
              },
              {
                  "paramName": "Connected_Inlets",
                  "type": "Result",
                  "buttonText": "Inlets",
                  "summaryText": "{Count} inlets are upstream from this location.",
                  "displayText": "{INLETTYPE} inlet, Access Type: {ACCESSTYPE}.",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "esriSMS",
                      "style": "esriSMSCircle",
                      "color": [
                        0,
                        255,
                        0,
                        255
                      ],
                      "size": 10,
                      "angle": 0,
                      "xoffset": 0,
                      "yoffset": -1,
                      "outline": {
                          "color": [
                            0,
                            255,
                            0,
                            255
                          ],
                          "width": 4
                      }
                  },
                  "bypassDetails": {
                      "skipable": false,
                      "IDField": ""
                  },
                  "saveOptions": {
                      "type": "",
                      "name": ""
                  }
              },

              {
                  "paramName": "Connected_Mains",
                  "type": "Result",
                  "buttonText": "Connected Mains",
                  "summaryText": "{Count} gravity mains returned.",
                  "displayText": "{FACILITYID}: {DIAMETER} inch {MATERIAL} gravity main.",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "esriSLS",
                      "style": "esriSLSDash",
                      "color": [
                        0,
                        255,
                        0,
                        255
                      ],
                      "width": 3

                  },
                  "bypassDetails": {
                      "skipable": false,
                      "IDField": ""
                  },
                  "saveOptions": {
                      "type": "",
                      "name": ""
                  }
              },
               {
                   "paramName": "Selected_Businesses",
                   "type": "Result",
                   "buttonText": "Businesses",
                   "summaryText": "{Count} businesses within 500 feet of a selected inlet.",
                   "displayText": "{Business_N} located at {Address}.",
                   "MinScale": 10000,
                   "MaxScale": 0,
                   "symbol": {
                       "type": "esriSMS",
                       "style": "esriSMSCircle",
                       "color": [
                         255,
                             255,
                             0,
                             255
                       ],
                       "size": 16,
                       "angle": 0,
                       "xoffset": 0,
                       "yoffset": 0,
                       "outline": {
                           "color": [
                             255,
                             255,
                             0,
                             255
                           ],
                           "width": 4
                       }
                   },
                   "bypassDetails": {
                       "skipable": false,
                       "IDField": ""
                   },
                   "saveOptions": {
                       "type": "csv",
                       "name": "Selected Businesses"
                   }
               }
            ]
        }
    }
    return defaults;
});