/**
 * Created by oliver on 08.01.18.
 */
/* this is the actual rendering code */
L.SVG.include ({
    _initCake: function(layer){
        //console.log("init path");
        layer._paths = [];
        layer._outlines = [];
        this._layers[L.Util.stamp(layer)] = layer;
        if (!this._rootGroup) { this._initContainer(); }
    },
    _addCake: function(layer){
        //console.log("adding paths",layer._paths);
        for(p in layer._paths){
            this._rootGroup.appendChild(layer._paths[p]);
        }
        for(p in layer._outlines) {
            this._rootGroup.appendChild(layer._outlines[p]);
        }

    },
    _removeCake: function(layer){
        for(p in layer._paths){
            L.DomUtil.remove(layer._paths[p])
        }
        for(p in layer._outlines) {
            L.DomUtil.remove(layer._outlines[p])
        }
        delete  this._layers[L.Util.stamp(layer)];
    },
    _updateCakeMarker: function (layer) {
        var c = layer._point,
            r = layer._radius,
            cR = layer._circleRatios,
            len = layer._circleRatios.length;

        //we now need to calculate the interception points
        // so where two pieces will meet
        //if we have more than one piece, there will always be at least 2 meeting points...

        var curAngle = 0;
        var iP = [];
        for( p in cR){
            iP.push([c.x+Math.sin(curAngle)*r, c.y+Math.cos(curAngle)*r, cR[p] < Math.PI]);
            //console.log("Current angle: ", curAngle, " piece angle:"+cR[p], "Current decision: "+curAngle >= Math.PI);
            curAngle = curAngle + cR[p];
        }
        //curAngle should now be 2*Pi...
        if(curAngle > 2*Math.PI+0.01 || curAngle < 2*Math.PI-0.01){
            console.error("CakeMarker: the angles don't add up, curAngle:", curAngle, " all pieces:",cR);
        }

        //console.log(curAngle, iP)

        //now we can compose the path for different pieces
        var hasChanged = layer._paths.length !== len;
        if(hasChanged ){
            //something has changed...
            //TODO we should remove the old paths and then add the new paths
            //(Only needed if we want to do dynamic updates to existing markers)
            for(p in layer._paths){
                L.DomUtil.remove(layer._paths[p])
            }
            for(p in layer._outlines) {
                L.DomUtil.remove(layer._outlines[p])
            }

            layer._outlines = [];
            layer._paths = [];
            //console.error("TODO, new paths", len, layer._paths);
        }

        if(cR.length > 1){
            //more than one piece
            for(var i=0;i < len;i++){
                var isBig = iP[i%len][2] ? 0 : 1; //wether circle is bigger than 180degree
                //console.log(isBig)
                var cake = "M"+c.x+","+c.y+"L"+iP[i%len][0]+','+iP[i%len][1]+"A"+r+','+r+',0,'+isBig+',0,'+iP[(i+1)%len][0]+','+iP[(i+1)%len][1]+"";
                var outline = "M"+iP[i%len][0]+','+iP[i%len][1]+"A"+r+','+r+',0,'+isBig+',0,'+iP[(i+1)%len][0]+','+iP[(i+1)%len][1]+"";

                //console.log(p);
                if( hasChanged ){
                    var p = L.SVG.create("path");
                    p.setAttribute("d",cake);
                    p.setAttribute("style","fill:"+layer._colors[i]);
                    p.setAttribute("fill-opacity","0.5");
                    layer._paths.push(p);

                    var q = L.SVG.create("path");
                    q.setAttribute("d",outline);
                    q.setAttribute("style","stroke:"+layer._colors[i]);
                    q.setAttribute("fill-opacity","0");
                    q.setAttribute("stroke-width","5");

                    layer._outlines.push(q);
                }else{
                    layer._paths[i].setAttribute("d",cake);
                    layer._outlines[i].setAttribute("d",outline);
                }
            }
        }else{
            //only one piece
            if( hasChanged ) {
                var p = L.SVG.create("circle");
                p.setAttribute("cx", c.x);
                p.setAttribute("cy", c.y);
                p.setAttribute("r", r);
                p.setAttribute("style","stroke:"+layer._colors[0]+";fill:"+layer._colors[0]);
                p.setAttribute("fill-opacity","0.5");
                p.setAttribute("stroke-width","5");
                //console.log("layer:" ,layer," colors",layer._colors[i]);
                layer._paths.push(p);
            }else {
                var i = layer._paths.length - 1; //last element...
                var q = layer._paths[i];
                q.setAttribute("cx", c.x);
                q.setAttribute("cy", c.y);
                q.setAttribute("r", r);
                q.setAttribute("style","stroke:"+layer._colors[i]+";fill:"+layer._colors[i]);
                q.setAttribute("fill-opacity","0.5");
                q.setAttribute("stroke-width","5");
            }
        }

        //this._setPath(layer, d);

        //todo if haschanged we should re-add the paths here
    }
});

/* this is the map representation code */
L.Marker.CakeMarker = L.Path.extend({
    options: {
        fill: true,
        radius: 20,
        pieces: []
    },

    initialize: function (latlng, options) {
        options = L.Util.setOptions(this, options);
        this._latlng = latlng;
        this._radius = this.options.radius;
        this._pieces = options.pieces;
        this._calcRatios();

        //console.log("initialized a cake marker with "+this._pieces.length+ "pieces")
        //console.log(this._pieces);

    },

    onAdd: function () {
        this._renderer._initCake(this);
        this._reset();
        this._renderer._addCake(this);
    },
    onRemove: function (){
        this._renderer._removeCake(this);

    },
    setLatLng: function (latlng) {
        this._latlng = latlng;
        this.redraw();
        return this.fire('move', {latlng: this._latlng});
    },

    getLatLng: function () {
        return this._latlng;
    },

    setRadius: function (radius) {
        this.options.radius = this._radius = radius;
        return this.redraw();
    },

    getRadius: function () {
        return this._radius;
    },

    setStyle : function (options) {
        var radius = options && options.radius || this._radius;
        //Path.prototype.setStyle.call(this, options);
        console.error("We should implement this");
        this.setRadius(radius);
        return this;
    },
    /* creates the path used for displaying the cake */
    _calcRatios: function(){
        var cntPieces = this.options.pieces.length;
        var radius = this.options.radius;
        var point = this._point;
        var pieces = this.options.pieces;
        //TODO rework array to object (pieces)
        var absSum = pieces.map(function(x){return Math.abs(x[0])}).reduce(function(a,b){return a+b});

        //how much of the full cake each piece should take
        this._circleRatios = pieces.map(function(x){return 2*Math.PI*Math.abs(x[0])/absSum});
        this._colors = pieces.map(function(x){return x[1]})

        //console.log("Ratios: ",this._circleRatios)
    },
    _project: function () {
        this._point = this._map.latLngToLayerPoint(this._latlng);
        this._updateBounds();
    },

    _updateBounds: function () {
        var r = this._radius,
            r2 = this._radiusY || r,
            w = this._clickTolerance(),
            p = [r + w, r2 + w];
        this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
    },

    _update: function () {
        if (this._map) {
            this._updatePath();
        }
    },

    _updatePath: function () {
        //console.log(this._point);
        this._renderer._updateCakeMarker(this);
    },

    _empty: function () {
        return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
    },

    // Needed by the `Canvas` renderer for interactivity
    _containsPoint: function (p) {
        return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
    }
});

L.marker.cakeMarker = function(latlng, options) {
    return new L.Marker.CakeMarker(latlng, options)
};