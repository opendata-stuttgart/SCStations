import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';
import './../css/style.css';

import api from './feinstaub-api';

let locations;

var map;
var tiles;
var cooCenter = [48.8564,2.3556];
var zoomLevel = 14;

var radius;

var coo = [];
//var arrayDistance = [];

window.onload=function(){

    map.setView(cooCenter, zoomLevel);
	map.on('moveend', function() {});
	map.on('move', function() {});
//	map.on('click', function(e) {
//		map.setView([e.latlng.lat, e.latlng.lng], map.getZoom());
//	});
    

};

map = L.map('map',{ zoomControl:true,minZoom:1,doubleClickZoom:false});

tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
			attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
			maxZoom: 18}).addTo(map);

new L.Hash(map);

retrieveData();  


fetch("./../json/eustations.json")
.then(function(response) {
return response.json();
})
.then(function(data) {
    
    var lookup = {};
    var result = [];
//    console.log(result);
    
    
         radius = L.geoJSON(data,{
                      pointToLayer: function (feature, latlng) {
                          
//                          cooStations.push(latlng);   
                          
                       return L.circle(latlng, {
                        radius:250,
                        fillColor: 'blue',
                        stroke:false,
                        fillOpacity: 0.2})
                      }}).addTo(map);

    L.geoJSON(data,{
                      pointToLayer: function (feature, latlng) {
                       return L.circleMarker(latlng, {
                        radius:3,
                        fillColor: 'blue',
                        stroke:false,
                        fillOpacity: 1})
                      },
                      onEachFeature: function (feature, layer) {
                        
                        var popupContent = "<h1>Official EU Station</h1><p><b>City</b> : "+feature.properties.Name+"</p><p><b>Area Classification</b> : "+feature.properties.AreaClassification+"</p><p><b>Station Classification ID</b> : "+feature.properties.StationClassification+"</p>";
                        layer.bindPopup(popupContent,{closeButton:true, maxWidth: "auto"});
                      }}).addTo(map);
    
        

    
    
});


document.getElementById("radius").addEventListener("change", updateRadius);


function retrieveData() {
		api.getData("https://maps.sensor.community/data/v2/data.dust.min.json").then(function (result) {
            locations = result;
          console.log(locations);
            
            L.geoJSON(locations,{
                      pointToLayer: function (feature, latlng) {
                          
                          coo.push(latlng);
                          
                       return L.circleMarker(latlng, {
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
                      }
                
            
            
            }).addTo(map);
});
            
};

function updateRadius() {
    console.log(document.getElementById("radius").value);
    
    var value = document.getElementById("radius").value;
    
    radius.eachLayer(function (layer) { 
        
        
        
        layer.setRadius(value);
        document.getElementById("value").value = value;
//    //console.log(layer.getLatLng())
//        
//        var count = 0;
//        
//       // console.log(value)
//        coo.forEach(function(coo){
//            if (layer.getLatLng().distanceTo(coo)<=value) {count +=1; }  
//        });
//    console.log(count);
//        
////    layer.setStyle({fillColor : });
    });
    
};
