import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';
import './../css/style.css';
//import './../css/esri-leaflet-geocoder.css';

import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css'

import api from './feinstaub-api';
import * as esri from 'esri-leaflet'
import * as esri_geo from 'esri-leaflet-geocoder';

let locations;
var map;
var tiles;
var cooCenter = [50.9414,6.9589];
var zoomLevel = 14;

var stations;
var radius;
var sensors;

var stationsList;
var sensorsList;

var stationsInBounds;
var sensorsInBounds;

var circleRadii = new L.layerGroup();
var coo = [];

var mapBounds;

var max=0;
var min=0;

window.onload=function(){

    map.setView(cooCenter, zoomLevel);
    map.on('move', function() {document.getElementById('legend').style.visibility = 'hidden'; circleRadii.clearLayers()});
    map.on('zoom', function() {document.getElementById('legend').style.visibility = 'hidden'; circleRadii.clearLayers()});
    
    
	map.on('moveend', function() { 
        console.log('moveend')
        
         zoomLevel = map.getZoom();
        
        if ((prev == 250 && zoomLevel > 12)||(prev == 1000 && zoomLevel > 9)){
            
        boundsCountStations(stations._layers);
        boundsCountSensors(sensors._layers);
        countDistance();
        drawCircles();   
        stations.bringToFront();
        sensors.bringToFront();
        document.getElementById('legend').style.visibility = 'visible';
        };
        
                      
});
    
    
	map.on('zoomend', function() {console.log('zoomend')});
    
    fetch("./../json/eustations.json")
.then(function(response) {
return response.json();
})
.then(function(data) {
    
    
    var lookup = {};
    var result = [];

            stations = L.geoJSON(data,{
                      pointToLayer: function (feature, latlng) {
                       return L.circleMarker(latlng, {
                        className : 'station',
                        radius:3,
                        fillColor: 'blue',
                        stroke:false,
                        fillOpacity: 1})
                      },
                      onEachFeature: function (feature, layer) {
                        
                        var popupContent = "<h1>Official EU Station</h1><p><b>City</b> : "+feature.properties.Name+"</p><p><b>Area Classification</b> : "+feature.properties.AreaClassification+"</p><p><b>Station Classification ID</b> : "+feature.properties.StationClassification+"</p>";
                        layer.bindPopup(popupContent,{closeButton:true, maxWidth: "auto"});
                      }}).addTo(map);
    
            boundsCountStations(stations._layers);
        
          		api.getData("https://maps.sensor.community/data/v2/data.dust.min.json").then(function (result) {
            locations = result;
//          console.log(locations);
            
          sensors = L.geoJSON(locations,{
                      pointToLayer: function (feature, latlng) {
                          
                          coo.push(latlng);
                          
                       return L.circleMarker(latlng, {
                        className : 'sensor',
                        radius:3,
                        fillColor: 'red',
                        stroke:false,
                        fillOpacity: 1})
                      },
                      onEachFeature: function (feature, layer) {
                          
                      
                         var position;
                          
                          if (feature.properties.indoor == 0) {position="outdoor"}else{position="indoor"};
                        
                        var popupContent = "<h1>Sensor.Community #"+feature.properties.id+"</h1><p><b>Type</b> : "+feature.properties.type+"</p><p><b>Position</b> : "+position+"</p>";
                        layer.bindPopup(popupContent,{closeButton:true, maxWidth: "auto"});
                      }}).addTo(map);
                        
            boundsCountSensors(sensors._layers);
            countDistance();
            drawCircles ();  
            stations.bringToFront();
            sensors.bringToFront();
                   
});      
});
};


map = L.map('map',{ zoomControl:true,minZoom:1,doubleClickZoom:false});

tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
			attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
			maxZoom: 18}).addTo(map);

var searchControl = esri_geo.geosearch({useMapBounds:false}).addTo(map);

new L.Hash(map);

circleRadii.addTo(map);

var radios = document.radForm.radius;
var prev = 250;
for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function() {
//        (prev) ? console.log(prev.value): null;
        if (this !== prev) {
            prev = this.value;
            console.log(prev);
            document.getElementById('legend').style.visibility = 'hidden'
            circleRadii.clearLayers();
            drawCircles(); 
        stations.bringToFront();
        sensors.bringToFront();
        }
        
    });
};




function boundsCountStations (object){
    var arrayConv = Object.values(object);
    mapBounds = map.getBounds();
//    console.log(mapBounds);
    stationsInBounds = arrayConv.filter(function (e) {if (mapBounds.contains(e._latlng)){return e}});
    
    stationsInBounds.forEach(function(e){e.count250 = 0;
                                        e.count1000 = 0  });
//    console.log(stationsInBounds); 
};


function boundsCountSensors (object){
    var arrayConv = Object.values(object);
    mapBounds = map.getBounds();
//    console.log(mapBounds);
    sensorsInBounds = arrayConv.filter(function (e) {if (mapBounds.contains(e._latlng)){return e}});
//    console.log(sensorsInBounds);
    
};

function countDistance (dist){
    stationsInBounds.forEach(function(e){
    sensorsInBounds.forEach(function(i){if (i._latlng.distanceTo(e._latlng)<=250){e.count250 +=1};
                                           if (i._latlng.distanceTo(e._latlng)<=1000){e.count1000 +=1};
                                           });
    });
    

//    console.log(stationsInBounds);
    
};

function drawCircles(){
    
    if(prev == 250 && zoomLevel > 12){
                 max = Math.max.apply(Math, stationsInBounds.map(function(o) { return o.count250; }));
                min = Math.min.apply(Math, stationsInBounds.map(function(o) { return o.count250; }));   
        
    };
    
    if(prev == 1000 && zoomLevel > 9){
           max = Math.max.apply(Math, stationsInBounds.map(function(o) { return o.count1000; }));
           min = Math.min.apply(Math, stationsInBounds.map(function(o) { return o.count1000; }));
    };
    
    
    if((prev == 1000 && zoomLevel > 9) || (prev == 250 && zoomLevel > 12)  ){
    
    document.getElementById('legend').style.visibility = 'visible';
    
    document.getElementById('min').innerHTML= min;
    document.getElementById('max').innerHTML= max;
    
    
    stationsInBounds.forEach(function(e){
        
       circleRadii.addLayer( new L.circle(e._latlng, {
                        className : 'radius',
                        radius:prev,
                        fillColor: setColor(e.count250,e.count1000),
                        stroke:true,
                        color:setColor(e.count250,e.count1000),
                        opacity:1,
                        weight :1,
                        fillOpacity: 0.3})
                        .bindPopup(popupMaker(e._latlng))
                           );
        
//        bringToBack()
    });
    };
        
};

function setColor(val1,val2){
    
    var base = (max - min);
    var percCal;
    
    if (prev == 250) {var perc = val1;};
    if (prev == 1000) {var perc = val2;};
    
//    REVOIR!!!
    
            if (base == 0 && max!= 0  && min!=0) { console.log('cas1'); perc = 100;}
            else if (base == 0 && max== 0) { console.log('cas2');perc = 0; }
            else {
                console.log('cas3');
                perc = (perc - min) / base * 100; 
            }
    
            var r, g, b = 0;
    
            if (perc == 0) {
                r = 255;
                g = Math.round(5.1 * perc);
            }
            else {
                g = 255;
                r = Math.round(510 - 5.10 * perc);
            }
            var h = r * 0x10000 + g * 0x100 + b * 0x1;
            console.log('#' + ('000000' + h.toString(16)).slice(-6));
            return '#' + ('000000' + h.toString(16)).slice(-6); 
};

function popupMaker(coo){
    
    var filtered = sensorsInBounds.filter(function(i){
        if (prev == 250){if (i._latlng.distanceTo(coo)<=250){return i};};
        if (prev == 1000){if (i._latlng.distanceTo(coo)<=1000){return i};};
    })
    
    console.log(filtered);
    
    if (filtered.length == 0){return 'No S.C Sensor in radius'}
    
    else{
    
    var texte1 ="<table><tr><th>S.C Sensors in " + prev + " m radius</th></tr>";
    
    filtered.forEach(function(e,i,a){
        
        if (i < (a.length -1)) {var texte2 = "<tr><td>" + e.feature.properties.id + "</td></tr>"};
        if (i == (a.length -1)) {var texte2 = "<tr><td>" + e.feature.properties.id + "</td></tr></table>"};
        texte1 += texte2});
//    console.log(texte1);
    return texte1;
    };
};