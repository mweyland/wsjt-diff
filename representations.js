/**
 * Created by oliver on 06.01.18.
 */

    //this is how you create a class in JS
var LogRepresentation = function(_input, _name){
        //local vars
        this.name = _name;
        this.hashByTime = _input;
        this.hashByLoc = {};

        this.minRX_Loc = 1; //minimum amount of calls per locator
        this.maxRX_Loc = 2; //maximum amount of calls per locator


        this.markerLayer = L.featureGroup();


        //init the object
        this.createHashByLocator();
        this.setupMarkerLayer();



};
//this is how you create member functions
LogRepresentation.prototype.createHashByLocator = function(){
    console.log("Create Locator Hashmap");
    var locHashmap = {};

    for(t in this.hashByTime){
        for(r in this.hashByTime[t]){
            if(this.hashByTime[t][r].hasOwnProperty('locator')){
                var locator = this.hashByTime[t][r].locator;
                if( !(locator in locHashmap)){
                    locHashmap[locator] = [];
                }
                locHashmap[locator].push(this.hashByTime[t][r])
            }
        }
    }

    //get the maximum amount of receptions per locator
    for (l in locHashmap){
        if(locHashmap[l].length > this.maxRX_Loc){
            this.maxRX_Loc = locHashmap[l].length;
        }
    }

    //console.log(locHashmap);
    console.log("Processed Locator hashmap, max calls per loc:"+this.maxRX_Loc);
    this.hashByLoc = locHashmap;
};
LogRepresentation.prototype.setupMarkerLayer = function(){
    for( loc in this.hashByLoc ){

        //gather some statistics for this locator
        var callAmount = this.hashByLoc[loc].length;
        var avgSNR = this.hashByLoc[loc].map(function(a){return a.snr}).reduce(function(a,b){return (a+b)/2});

        //linearly adjust size of marker between 10 and 40
        var markerSize = 10+ ((callAmount-this.minRX_Loc)/(this.maxRX_Loc-this.minRX_Loc))*30

        //TODO maiddenhead function is not in this file...
        var marker = L.circleMarker(maidenhead_to_latlon(loc),{color:'#F00', radius: markerSize});
        marker.bindPopup("Amount of calls: "+callAmount+" <br> AVG SNR:"+avgSNR.toFixed(1));
        marker.addTo(this.markerLayer);


    }
};
LogRepresentation.prototype.addTo = function(map, control){
    //this.markerLayer.addTo(map);
    control.addOverlay(this.markerLayer, this.name)

};
LogRepresentation.prototype.getBounds = function(){
    return this.markerLayer.getBounds();
};
//some helper functions so we don't need jQuery yet...
function hasClass(ele,cls) {
    return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
function addClass(ele,cls) {
    if (!hasClass(ele,cls)) ele.className += " "+cls;
}
function removeClass(ele,cls) {
    if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className=ele.className.replace(reg,' ');
    }
}

var LogComparator = function(_name){
    this.name = _name;

    console.log("New LogComparator instantiated")

    this.markerLayer = L.featureGroup();
    this._curMarkers = [];

    this._logs = []; //contains a locatorhashmap for each log
    this._locHashmap = {};
};
LogComparator.prototype.addLog = function(log, name){
    //clear all markers here
    for(m in this._curMarkers){
        this._curMarkers[m].removeFrom(this.markerLayer);

    }
    this._curMarkers = [];


    //got a time based hashmap and now divide it into a locator-based hashmap
    var locHashmap = {};

    for(t in log){
        for(r in log[t]){
            if(log[t][r].hasOwnProperty('locator')){
                var locator = log[t][r].locator;
                if( !(locator in locHashmap)){
                    locHashmap[locator] = [];
                }
                locHashmap[locator].push(log[t][r])
            }
        }
    }

    this._logs.push({hashmap:locHashmap, color:generateColor(),name:name});
    //console.log("Added a log to the logcomparator", log, " Name:", name, " locHashmap", locHashmap);

    this.updtLocHashmap();
    this.setupMarkerLayer();
};

LogComparator.prototype.updtLocHashmap = function () {
    // update the big Locatorhasmap

    for(log in this._logs){
        for(locator in this._logs[log].hashmap){
            if( !(locator in this._locHashmap)){
                this._locHashmap[locator] = {};
            }
            //TODO there might be a more elegant solution to this convolution here
            this._locHashmap[locator][this._logs[log].name] = {logs: this._logs[log].hashmap[locator], color: this._logs[log].color}
        }
    }

    console.log("Global Hashmap",this._locHashmap)
};

LogComparator.prototype.setupMarkerLayer = function () {
    //create a cake marker for each locator
    console.log("SetupMarkerLayer...")

    for(loc in this._locHashmap){
        //for each locator
        var pieces = [];
        //console.log("..process locator", this._locHashmap[loc]);
        for (var log in this._locHashmap[loc]) {
            if (this._locHashmap[loc].hasOwnProperty(log)) {
                //for each log of a locator
                var t = this._locHashmap[loc][log];
                //get the SNR and color
                //console.log(t);
                var avgSNR = t.logs.map(function(a){return a.snr}).reduce(function(a,b){return (a+b)/2});
                var color = t.color.toString();

                pieces.push([avgSNR, color]);
            }
        }
        //console.log(pieces);
        var cakeMarker = L.marker.cakeMarker(maidenhead_to_latlon(loc), {pieces:pieces});
        this._curMarkers.push(cakeMarker);
        cakeMarker.addTo(this.markerLayer);
    }
    console.info("Filled the MarkerLayer with ",this._curMarkers.length, "Markers")
};

LogComparator.prototype.addTo = function (map, control) {
    this.markerLayer.addTo(map);
    control.addOverlay(this.markerLayer, this.name)
};

/*
*  some helper color functions so we can generate nice colors per log...
*  Already a bit of work done in the past by HB3YMB
* */
function Color(r,g,b){this.r = r; this.g = g; this.b =b;}
Color.prototype.toString = function(){
    return "#"+
        ('0'+this.r.toString(16)).slice(-2) +
        ('0'+this.g.toString(16)).slice(-2)+
        ('0'+this.b.toString(16)).slice(-2);
};
Color.prototype.getBrightness = function(){
    return 1 - ( 0.299 * this.r + 0.587 * this.g + 0.114 * this.b) / 255;
};
Color.prototype.contrastColor = function() {
    var d = 0xE3; // dark colors - white font
    if (this.getBrightness() < 0.5){d = 0x52;}  // bright colors - black font
    return  new Color(d, d, d);
};
Color.prototype.fromString = function(_string){
    var h=_string.replace('#', '');
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

    for(var i=0; i<h.length; i++)
        h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);

    this.r = h[0];
    this.g = h[1];
    this.b = h[2];
};

var golden_ratio = 0.618033988749895;
var colorRatio = Math.random();
function generateColor(){
    colorRatio += golden_ratio;
    colorRatio = colorRatio%1;
    //avoid yellow colors
    if(colorRatio <= 75/360 && colorRatio >= 45/360){
        generateColor();
    }
    return HSVtoRGB(colorRatio, 0.8,0.95);
}
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s; v = h.v; h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return new Color(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255));
}