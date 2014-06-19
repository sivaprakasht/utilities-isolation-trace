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
        "webmap": "b82a4d1c9f374a259d3b7111d4820314",
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
            "url": "http://localhost:6080/arcgis/rest/services/IsolationTrace/GPServer/IsolationTrace",
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
              },
              {
                  "paramName": "Barriers",
                  "type": "Barrier",
                  "symbol": {
                      "type": "esriSMS",
                      "style": "path",
                      "path": "m241.78999,288.7684l45.98341,-45.9834l65.03485,0l45.98453,45.9834l0,65.03488l-45.98453,45.98172l-65.03485,0l-45.98341,-45.98172l0,-65.03488z",
                      "color": [
                        255,
                        0,
                        0,
                        0
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
                      "size": 25,
                      "angle": 0,
                      "xoffset": 0,
                      "yoffset": 0
                  }
              },
              {
                  "paramName": "SkipLocations",
                  "type": "Skip",
                  "symbol": {
                      "type": "esriSMS",
                      "style": "path",
                      "path": "M29.225,23.567l-3.778-6.542c-1.139-1.972-3.002-5.2-4.141-7.172l-3.778-6.542c-1.14-1.973-3.003-1.973-4.142,0L9.609,9.853c-1.139,1.972-3.003,5.201-4.142,7.172L1.69,23.567c-1.139,1.974-0.207,3.587,2.071,3.587h23.391C29.432,27.154,30.363,25.541,29.225,23.567zM16.536,24.58h-2.241v-2.151h2.241V24.58zM16.428,20.844h-2.023l-0.201-9.204h2.407L16.428,20.844z",
                      "color": [
                        255,
                        255,
                        0,
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
                      "xoffset": 0,
                      "yoffset": 0
                  }
              }
            ],
            "outputs": [
              {
                  "paramName": "Affected_Area",
                  "type": "Overview",
                  "buttonText": "Summary",
                  "visible": "true",
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
                      "type": "Layer",
                      "name": "Outage Area"
                  },
                  "fieldMap": [
                      {
                          "fieldName": "NUMHYDS",
                          "paramName": "Isolated_Hydrants",
                      },
                      {
                          "fieldName": "NUMVALVES",
                          "paramName": "Isolating_Valves",
                      },
                      {
                          "fieldName": "CUSTOUT",
                          "paramName": "Isolated_Customers",
                      }
                  ]
              },
              {
                  "paramName": "Isolating_Valves",
                  "type": "Result",
                  "buttonText": "Valves",
                  "summaryText": "{Count} Valves Returned in Trace, {SkipCount} were bypassed.",
                  "displayText": "{DIAMETER} inch Valve: {FACILITYID}",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "esriSMS",
                      "style": "esriSMSCircle",
                      "color": [
                        0,
                        0,
                        0,
                        0
                      ],
                      "size": 22,
                      "angle": 0,
                      "xoffset": 0,
                      "yoffset": -1,
                      "outline": {
                          "color": [
                            255,
                            0,
                            0,
                            255
                          ],
                          "width": 4
                      }
                  },
                  "bypassDetails": {
                      "skipable": true,
                      "IDField": "FACILITYID"
                  },
                  "saveOptions": {
                      "type": "csv",
                      "name": "Isolating System Valves"
                  }
              },
              {
                  "paramName": "Isolated_Hydrants",
                  "type": "Result",
                  "buttonText": "Hydrants",
                  "summaryText": "{Count} Hydrants would be affected by a shutdown in this area.",
                  "displayText": "{MANUFACTURER} Hydrant {FACILITYID}",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "esriSMS",
                      "style": "esriSMSCircle",
                      "color": [
                        0,
                        0,
                        0,
                        0
                      ],
                      "size": 22,
                      "angle": 0,
                      "xoffset": 0,
                      "yoffset": -2,
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
                      "name": "Isolated Hydrants"
                  }
              },
              {
                  "paramName": "Isolated_Customers",
                  "type": "Result",
                  "buttonText": "Customers",
                  "summaryText": "{Count} Customers would be affected by a shutdown in this area.",
                  "displayText": "Customer {FACILITYID}",
                  "MinScale": 10000,
                  "MaxScale": 0,
                  "symbol": {
                      "type": "esriSMS",
                      "style": "esriSMSCircle",
                      "color": [
                        0,
                        0,
                        0,
                        0
                      ],
                      "size": 22,
                      "angle": 0,
                      "xoffset": 1,
                      "yoffset": -1,
                      "outline": {
                          "color": [
                            122,
                            122,
                            255,
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
                      "name": "Isolated Customers"
                  }
              }
            ]
        }
    }
    return defaults;
});