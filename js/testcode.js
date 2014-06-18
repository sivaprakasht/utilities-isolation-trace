_clearSelected: function (evt) {
    if (domProp.get(dijit.byId("tools.add"), "iconClass") == "customBigIcon addIconSelected") {
        this.map.graphics.clear();
    }

},
_saveTrace: function () {

    dijit.byId("tools.save").set("iconClass", "customBigIcon saveIconProcessing");

    this.defCount = this.config.GPParams.length;


    if (this.resultOverviewLayer != null) {
        if (this.resultOverviewLayer.graphics != null) {
            if (this.resultOverviewLayer.graphics.length > 0) {
                this.defCount = this.defCount + 1;
                this._saveLayer(this.config.overviewDetails);
            }
        }
    }
    array.forEach(this.config.GPParams, function (GPParam) {

        if (GPParam.results != null && GPParam.saveOptions.type) {
            if (GPParam.results.features != null) {
                this._saveLayer(GPParam);

            }
            else {
                this.defCount = this.defCount - 1;

            }
        }
        else {
            this.defCount = this.defCount - 1;

        }


    }, this);

    if (this.defCount == 0) {
        dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");

    }
},
_saveLayer: function (param) {
    if (param.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
        if (param.saveOptions.saveToLayer != null) {

            var editDeferred = param.saveOptions.saveToLayer.layerObject.applyEdits(param.results.features, null, null);

            editDeferred.addCallback(lang.hitch(this, this._saveComplete));
            editDeferred.addErrback(function (error) {
                this._saveComplete();
                this.defCount = this.defCount - 1;
                if (this.defCount == 0) {
                    this._reset();
                    dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
                }
                alert(error.message);
                console.log(error);
            });
        }
        else {
            alert(param.paramName + ": " + this.config.i18n.error.saveToLayerMissing);
            this._saveComplete();
        }
    }

    else if (param.saveOptions.type.toUpperCase() == "csv".toUpperCase()) {

        this._addCSVContent(param);

        this._saveComplete();

    }

    else {
        this._saveComplete();
    }
},

_saveOverview: function () {

    //if (this.overviewInfo.saveOptions.type.toUpperCase() == "Layer".toUpperCase()) {
    //    if (this.overviewInfo.saveOptions.saveToLayer != null) {

    //        var editDeferred = this.overviewInfo.saveOptions.saveToLayer.layerObject.applyEdits(this.overviewInfo.results.features, null, null);

    //        editDeferred.addCallback(lang.hitch(this, this._overviewSaved));
    //        editDeferred.addErrback(function (error) {
    //            //this._saveComplete();
    //            //this.defCount = this.defCount - 1;
    //            //if (this.defCount == 0) {
    //            //    this._reset();
    //            //    dijit.byId("tools.save").set("iconClass", "customBigIcon saveIcon");
    //            //}
    //            //alert(error.message);
    //            //console.log(error);
    //        });
    //    }
    //    else {
    //        alert(this.overviewInfo.paramName + ": " + this.config.i18n.error.saveToLayerMissing);
    //        //this._saveComplete();
    //    }
    //}

    //else if (param.saveOptions.type.toUpperCase() == "csv".toUpperCase()) {

    //    this._addCSVContent(this.overviewInfo);

    //    //this._saveComplete();

    //}

    //else {
    //    //this._saveComplete();
    //}
},