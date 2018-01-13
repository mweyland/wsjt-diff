L.Control.ComparatorControl = L.Control.extend({
    onAdd: function(map) {
        //L.DomEvent.on();

        var parent = L.DomUtil.create('div');
        parent.setAttribute("class","comp-control-parent");

        this._root = L.DomUtil.create('div');
        this._root.setAttribute("class","btn-group-vertical");

        parent.appendChild(this._root);



        return parent;
    },

    onRemove: function(map) {
        // Nothing to do here
        //L.DomEvent.off()
    },

    addLog: function(){

        var logButton = L.DomUtil.create("button");
        logButton.setAttribute("class","btn btn-secondary");
        logButton.innerHTML = "All-101.txt";

        this._root.appendChild(logButton);

    }
});

L.control.comparatorControl = function(opts) {
    return new L.Control.ComparatorControl(opts);
};

