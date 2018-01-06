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
    this.markerLayer.addTo(map);
    control.addOverlay(this.markerLayer, this.name)

};
LogRepresentation.prototype.getBounds = function(){
    return this.markerLayer.getBounds();
}