import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';
import './../css/style.css';

import api from './feinstaub-api';

let locations;

var map;
var tiles;
var cooCenter = [50.8655,4.3373];
var zoomLevel = 14;



var radius;
var sensors;

var coo = [];
//var arrayDistance = [];


var radiusBounds = [];

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
                        className : 'radius',
                        radius:250,
                        fillColor: 'transparent',
                        stroke:false,
                        fillOpacity: 0.2})
                      }}).addTo(map);
    
    radius.eachLayer(function (layer) {
    var boundsObject ={"bounds": layer.getBounds(), "id": layer.feature.properties.Code, "count":0 };
    layer._path.id = layer.feature.properties.Code;
    radiusBounds.push(boundsObject);    
});
        
    console.log(radiusBounds);
    

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

retrieveData();

document.getElementById("radius").addEventListener("change", updateRadius);


function retrieveData() {
		api.getData("https://maps.sensor.community/data/v2/data.dust.min.json").then(function (result) {
            locations = result;
          console.log(locations);
            
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
            
            
             sensors.eachLayer(function (layer) {
                 
//                 console.log(layer);
                 
                 
                 radiusBounds.forEach(function(e){if (e.bounds.contains(layer._latlng)){
                     e.count +=1;
                 }});
    
                 
             });
            
           console.log(radiusBounds); 
            
            
            radius.eachLayer(function (layer) {layer.setStyle({fillColor: setColor(layer.feature.properties.Code)})});
            
//            radius.setStyle({fillColor: setColor(radiusBounds)});    
            
});
      
            
};

//
function setColor(layer){
    
//    console.log(data);
//   console.log(layer);

//    
    var selectedRadius = radiusBounds.find(e => e.id == layer);
//   
//    console.log(selectedRadius[0]);
//    console.log(selectedRadius[0].count);
    
//    0 à 100
//    
//    var r, g, b = 0;
//   
//	if(selectedRadius.count < 1) {
//		r = 255;
//		g = Math.round(5.1 * selectedRadius.count);
//	}
//	else {
//		g = 255;
//		r = Math.round(510 - 5.10 * selectedRadius.count);
//	}
//	var h = r * 0x10000 + g * 0x100 + b * 0x1;
//    
//	return '#' + ('000000' + h.toString(16)).slice(-6); 

    var max = Math.max.apply(Math, radiusBounds.map(function(o) { return o.count; }))
    console.log(max);
    var min = 0;
    var base = (max - min);
    
     var perc = selectedRadius.count;

            if (base == 0) { perc = 100; }
            else {
                perc = (perc - min) / base * 100; 
            }
            var r, g, b = 0;
            if (perc < 1) {
                r = 255;
                g = Math.round(5.1 * perc);
            }
            else {
                g = 255;
                r = Math.round(510 - 5.10 * perc);
            }
            var h = r * 0x10000 + g * 0x100 + b * 0x1;
            return '#' + ('000000' + h.toString(16)).slice(-6);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
};


//function (layer){
//                return "red";
//                



//function getMax(arr) {
//    var max;
//    for (var i=0 ; i<arr.length ; i++) {
//        if (max == null || parseInt(arr[i].count) > parseInt(max[prop]))
//            max = arr[i];
//    }
//    return max;
//}


function perc2color(perc) {
	var r, g, b = 0;
	if(perc < 50) {
		r = 255;
		g = Math.round(5.1 * perc);
	}
	else {
		g = 255;
		r = Math.round(510 - 5.10 * perc);
	}
	var h = r * 0x10000 + g * 0x100 + b * 0x1;
	return '#' + ('000000' + h.toString(16)).slice(-6);
};



function updateRadius() {
    console.log(document.getElementById("radius").value);
    
    var value = document.getElementById("radius").value;
    
//    radiusBounds = [];
    
    radius.eachLayer(function (layer) { 
        
        layer.setRadius(value);
        document.getElementById("value").value = value;
        
//        console.log(radiusBounds.find(e => e.id == layer.feature.properties.Code));
        
        radiusBounds.find(e => e.id == layer.feature.properties.Code).bounds = layer.getBounds();
        radiusBounds.find(e => e.id == layer.feature.properties.Code).count = 0;
        
    });
    
    
    sensors.eachLayer(function (layer) {
                 
//                 console.log(layer);
                           
     radiusBounds.forEach(function(e){if (e.bounds.contains(layer._latlng)){
         e.count +=1;
     }});


 });
    
    
radius.eachLayer(function (layer) {layer.setStyle({fillColor: setColor(layer.feature.properties.Code)})});

    
    
    
    
    
    
    
    
    
    
    
//    radius.eachLayer(function (layer) {
//    var boundsObject ={"bounds": layer.getBounds(), "id": layer.feature.properties.Code, "count":0 };
//    layer._path.id = layer.feature.properties.Code;
//    radiusBounds.push(boundsObject);    
//});
    
    
    
//    radius.eachLayer(function (layer) {layer.setStyle({fillColor: setColor(radiusBounds,layer.feature.properties.Code)})});

    
};
