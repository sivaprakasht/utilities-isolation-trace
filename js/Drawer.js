define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dojo/Deferred",
    "dojo/window",
    "dojo/topic",
    "application/search",
    "dojo/dom-style", "dojo/query"

],
function (
    Evented,
    declare,
    lang,
    _WidgetBase,
    on,
    dom,
    domClass,
    domConstruct,
    BorderContainer,
    ContentPane,
    Deferred,
    win,
    topic,
    Search,
    domStyle, query
) {
    var Widget = declare([_WidgetBase, Evented], {
        declaredClass: "application.Drawer",
        options: {
            showDrawerSize: 850,
            borderContainer: null,
            contentPaneCenter: null,
            contentPaneSide: null,
            buttonbar: null,
            topbar: null,
            mapResizeTimeout: 260,
            mapResizeStepTimeout: 25,
            config: {}
        },
        // lifecycle: 1
        constructor: function (options) {
            // mix in settings and defaults
            // this.set("config",config);

            var defaults = lang.mixin({}, this.options, options);
            // properties
            this.set("showDrawerSize", defaults.showDrawerSize);
            this.set("borderContainer", defaults.borderContainer);
            this.set("contentPaneCenter", defaults.contentPaneCenter);
            this.set("contentPaneSide", defaults.contentPaneSide);            this.set("buttonbar", defaults.buttonbar);
            this.set("topbar", defaults.topbar);
            this.set("mapResizeTimeout", defaults.mapResizeTimeout);
            this.set("mapResizeStepTimeout", defaults.mapResizeStepTimeout);
            this.set("config", defaults.config);
            // classes
            this.css = {
                toggleButton: "toggle-button",
                toggleButtonSelected: "toggle-button-selected",
                drawerOpen: "drawer-open",
                drawerOpenComplete: "drawer-open-complete",

                addButton: "add-button",
                addButtonSelected: "add-button-selected",

                deleteButton: "delete-button",

                runButton: "run-button",
                runButtonDisabled: "run-button-disabled",

                saveButton: "save-button",
                saveButtonDisabled: "save-button-disabled"
            };
           

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
            // resize border container
            if (this._borderContainer) {
                this._borderContainer.layout();
            }
            // drawer status resize
            this.emit("resize", {});
           
        },
        drawStateChange: function (open) {
            try
            {
                if (open) {
                    this.sizes = {
                        geocoderWidth: query(".simpleGeocoder").style("width")[0],
                        drawerWidth: query(".drawer-open .content-pane-left ").style("width")[0]
                    };
                    var vs = win.getBox();
                    if (this.sizes.drawerWidth + this.sizes.geocoderWidth + 20 > vs.w) {
                        query(".simpleGeocoder").style("visibility", "hidden");

                    }
                    else {
                        query(".simpleGeocoder").style("visibility", "null");
                    }
                }
                else {
                    query(".simpleGeocoder").style("visibility", "visible");
                }
              
            }
            catch (e)
            {
            }
            //if (open)
            //{
            //    var vs = win.getBox();
            //    if (this._borderContainerNode + this.search.clientWidth == vs.w)
            //    {
                
            //    }
            //    // if window width is less than specified size
            //}

        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        // resize
        // toggle
        /* ---------------- */
        /* Public Functions */
        /* ---------------- */

        toggle: function (add) {
            // deferred to return
            var def = new Deferred();
            // true if drawer is opened
            var currentlyOpen = domClass.contains(document.body, this.css.drawerOpen);
            // if already open or already closed and asked to do the same
            if (currentlyOpen && add === true || !currentlyOpen && add === false) {
                // return
                return def.promise;
            }
            // whether drawer is now opened or closed
            var nowOpen;
            // if add is set
            if (typeof add !== "undefined") {
                nowOpen = domClass.toggle(document.body, this.css.drawerOpen, add);
            } else {
                nowOpen = domClass.toggle(document.body, this.css.drawerOpen, !currentlyOpen);
            }
            // remove shadow
            domClass.remove(document.body, this.css.drawerOpenComplete);
            // if steps animation exists
            if (this._animationSteps) {
                clearInterval(this._animationSteps);
                this._animationSteps = null;
            }
            // resize during animation
            this._animationSteps = setInterval(lang.hitch(this, function () {
                // resize border container
                this.resize();
            }), this.get("mapResizeStepTimeout"));
            // remove timeout if exists
            if (this._animationTimeout) {
                clearTimeout(this._animationTimeout);
                this._animationTimeout = null;
            }
            // wait for animation to finish
            this._animationTimeout = setTimeout(lang.hitch(this, function () {
                // resize border container
                this.resize();
                // remove shown drawer
                this._checkDrawerStatus();
                // stop resizing container
                clearInterval(this._animationSteps);
                this._animationSteps = null;
                // now drawer is open
                if (nowOpen) {
                    // add shadow
                    domClass.add(document.body, this.css.drawerOpenComplete);
                }
                
                this.drawStateChange(nowOpen);
                // return
                def.resolve();
            }), this.get("mapResizeTimeout"));
            // return when done
            return def.promise;
        },
        /* ---------------- */
        /* Private Events*/
        /* ---------------- */
      
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
        },
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
            // destroy content panes
            if (this._contentPaneCenter) {
                this._contentPaneCenter.destroy();
            }
            if (this._contentPaneSide) {
                this._contentPaneSide.destroy();
            }
            // destroy content pane
            if (this._borderContainer) {
                this._borderContainer.destroy();
            }
        },
        _mapLoaded: function () {
            this.set("map", arguments[0]);

        },
        _init: function () {
            // setup events
            this._removeEvents();
            //subscribe to events

            this._events.push(topic.subscribe("app/mapLoaded", lang.hitch(this, this._mapLoaded)));

            // required nodes
            this._borderContainerNode = dom.byId(this.get("borderContainer"));
            this._contentPaneCenterNode = dom.byId(this.get("contentPaneCenter"));
            this._contentPaneSideNode = dom.byId(this.get("contentPaneSide"));

            this._buttonbar = dom.byId(this.buttonbar);
            this._topbar = dom.byId(this.topbar);

            if (this._buttonbar == null) {
                topic.publish("app\error", { message: "Buttonbar div tag not found" });
                return;
            }

            if (this._topbar == null) {
                topic.publish("app\error", { message: "Toolbar div tag not found" });
                return;
            }
            //create buttons and controls
            this._toggleNode = domConstruct.place("<div id='toggle_button' class='hamburger-button'></div>", this._buttonbar);
            this._addNode = domConstruct.place("<div id='add_button' class='add-button'></div>", this._buttonbar);
            this._deleteNode = domConstruct.place("<div id='delete_button' class='delete-button'></div>", this._buttonbar);
            this._runNode = domConstruct.place("<div id='run_button' class='run-button-disabled'></div>", this._buttonbar);
            this._saveNode = domConstruct.place("<div id='save_button' class='save-button-disabled'></div>", this._buttonbar);

            this._searchNode = domConstruct.place("<div id='searchDiv'></div>", this._topbar);

        
            // all nodes present
            if (this._borderContainerNode &&
                this._contentPaneCenterNode &&
                this._contentPaneSideNode &&
                this._toggleNode &&
                this._addNode &&
                this._saveNode &&
                this._runNode &&
                this._deleteNode &&
                this._searchNode) {


                // outer container
                this._borderContainer = new BorderContainer({
                    gutters: false
                }, this._borderContainerNode);
                // center panel
                this._contentPaneCenter = new ContentPane({
                    region: "center",
                    style: {
                        padding: 0
                    }
                }, this._contentPaneCenterNode);
                this._borderContainer.addChild(this._contentPaneCenter);
                // panel side
                var side = "left";
                if (this.get("direction") === "rtl") {
                    side = "right";
                }
                // left panel
                this._contentPaneSide = new ContentPane({
                    region: side,
                    style: {
                        padding: 0
                    }
                }, this._contentPaneSideNode);
                this._borderContainer.addChild(this._contentPaneSide);
                // start border container
                this._borderContainer.startup();

                //search control
                this.search = new Search(
                    {
                        geocode: this.config.helperServices.geocode,
                        domNode: this._searchNode
                    });
                this.search.startup();

                // drawer button
                var toggleClick = on(this._toggleNode, 'click', lang.hitch(this, function () {
                    this.toggle();
                }));
                this._events.push(toggleClick);

                //Control Buttons
                var addClick = on(this._addNode, "click", lang.hitch(this, this._addClicked));
                this._events.push(addClick);

                var deleteClick = on(this._deleteNode, "click", lang.hitch(this, this._deleteClicked));
                this._events.push(deleteClick);

                var runClick = on(this._runNode, "click", lang.hitch(this, this._runClicked));
                this._events.push(runClick);

                var saveClick = on(this._saveNode, "click", lang.hitch(this, this._saveClicked));
                this._events.push(saveClick);
          
            
                // window
                var w = win.get(document);
                // window size event
                var winResize = on(w, 'resize', lang.hitch(this, function () {
                    this._windowResized();
                }));
                this._events.push(winResize);
                // window focused on
                var winFocus = on(w, 'focus', lang.hitch(this, function () {
                    setTimeout(lang.hitch(this, function () {
                        this.resize();
                    }), 250);
                }));
                this._events.push(winFocus);
                // check window size
                this._windowResized();
                // fix layout
                this.resize();
                // set loaded property
               
                this.set("loaded", true);
                // emit loaded event
                this.emit("load", {});
            } else {
                console.log("Drawer::Missing required node");
            }
        },

        _windowResized: function () {
            // view screen
            var vs = win.getBox(), add;
            // if window width is less than specified size
            if (vs.w < this.get("showDrawerSize")) {
                // hide drawer
                add = false;
            } else {
                // show drawer
                add = true;
            }
            // toggle
            this.toggle(add).always(lang.hitch(this, function () {
                // remove forced open
                this._checkDrawerStatus();
            }));
        },
        _checkDrawerStatus: function () {
            // border container layout
            this.resize();
            // hamburger button toggle
            this._toggleButton();
        },

        
        /* ---------------- */
        /* Control Events*/
        /* ---------------- */
        _addClicked: function () {
            // has normal class
            if (domClass.contains(this._addNode, this.css.addButton)) {
                // replace with selected class
                domClass.replace(this._addNode, this.css.addButtonSelected, this.css.addButton);
            } else if (domClass.contains(this._addNode, this.css.addButtonSelected)) {
                // replace with normal class
                domClass.replace(this._addNode, this.css.addButton, this.css.addButtonSelected);
            }
        },
        _deleteClicked: function () {
            topic.publish("app\toggleIndicator", true);

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
        _toggleButton: function () {
            // if drawer is displayed
            if (domClass.contains(document.body, this.css.drawerOpen)) {
                // has normal class
                if (domClass.contains(this._toggleNode, this.css.toggleButton)) {
                    // replace with selected class
                    domClass.replace(this._toggleNode, this.css.toggleButtonSelected, this.css.toggleButton);
                }
            } else {
                // has selected class
                if (domClass.contains(this._toggleNode, this.css.toggleButtonSelected)) {
                    // replace with normal class
                    domClass.replace(this._toggleNode, this.css.toggleButton, this.css.toggleButtonSelected);
                }
            }
        }

    });
    return Widget;
});
