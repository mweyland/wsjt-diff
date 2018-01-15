L.Control.ComparatorControl = L.Control.extend({
    onAdd: function(map) {
        //L.DomEvent.on();
        var that = this;

        var parent = L.DomUtil.create('div');
        parent.setAttribute("class","comp-control-parent MenuContainer");


        var upContainer = L.DomUtil.create("div");
        upContainer.setAttribute("class","MenuRow");

        this._root = L.DomUtil.create('div');
        this._root.setAttribute("class","btn-group-vertical");

        upContainer.appendChild(this._root);

        /* setup the buttons for toggling db/linear dB shall be the starting value*/
        var dwnContainer = L.DomUtil.create("div");
        dwnContainer.setAttribute("class","MenuRow");
        var loglinToggle = L.DomUtil.create("div");
        loglinToggle.setAttribute("class", "btn-group btn-group-toggle loglinToggle");

        var logButton = L.DomUtil.create("label");
        logButton.setAttribute("class","btn btn-sm btn-secondary active toggleBtn");
        var logInput = L.DomUtil.create("input");
        logInput.setAttribute("type","checkbox");

        logButton.innerHTML = "dB";

        logButton.appendChild(logInput);

        var linButton = L.DomUtil.create("label");
        linButton.setAttribute("class","btn btn-sm btn-secondary toggleBtn");
        var linInput =  L.DomUtil.create("input");
        linInput.setAttribute("type","checkbox");
        linButton.innerHTML = "linear";

        linButton.appendChild(linInput);



        $(linButton).click(function(e){
            e.preventDefault();
            console.log("LinButton has been clicked");
            $(logButton).removeClass("active");
            $(linButton).addClass("active");
            if(typeof that.btnListeners !== "undefined"){
                that.btnListeners.forEach(function(fn){
                    try{
                        fn("linear")
                    }catch (e){
                        //
                        console.log(e)
                    }
                })
            }
        });
        $(logButton).click(function(e){
            e.preventDefault();
            console.log("LogButton has been clicked");
            $(linButton).removeClass("active");
            $(logButton).addClass("active");
            if(typeof that.btnListeners !== "undefined"){
                that.btnListeners.forEach(function(fn){
                    try{
                        fn("decibel")
                    }catch (e){
                        //do nothing...
                        console.log(e)
                    }
                })
            }
        });


        loglinToggle.appendChild(logButton);
        loglinToggle.appendChild(linButton);
        dwnContainer.appendChild(loglinToggle);


        parent.appendChild(upContainer);
        parent.appendChild(dwnContainer);
        parent.appendChild(dwnContainer);

        return parent;
    },

    addButtonListener: function(fn){
        //console.log("CompControls: add unit button listener");
        if(typeof this.btnListeners === "undefined"){
            this.btnListeners = []
        }
        this.btnListeners.push(fn);
    },

    onRemove: function(map) {
        // Nothing to do here
        //L.DomEvent.off()
    },

    addLog: function(name, aColor, callback){
        var logButton = L.DomUtil.create("button");
        logButton.setAttribute("class","btn btn-secondary");
        logButton.innerHTML = name;
        logButton.setAttribute("style","background-color:"+aColor.toString()+";color:"+aColor.contrastColor().toString());


        L.DomEvent.disableClickPropagation(logButton);
        L.DomEvent.on(logButton, 'click', L.DomEvent.stop);
        L.DomEvent.on(logButton, 'click', function(){
            //here we have to add the toggling code
            if(callback){

                //well, this is kinda a bad situation we are creating here... Software Design 101
                callback(logButton);
            }
        }, this);
        L.DomEvent.on(logButton, 'click', this._refocusOnMap, this);
        this._root.appendChild(logButton);
    }



});

L.control.comparatorControl = function(opts) {
    return new L.Control.ComparatorControl(opts);
};

