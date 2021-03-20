import leaflet from 'leaflet';
import hash from 'leaflet-hash';
import 'leaflet/dist/leaflet.css';
import './../css/style.css';

import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css'

import api from './feinstaub-api';
import * as esri from 'esri-leaflet'
import * as esri_geo from 'esri-leaflet-geocoder';
import "leaflet-mouse-position";


let locations;
var map;
var tiles;
var cooCenter = [50.9414,6.9589];
var zoomLevel = 15;

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

var mobile = mobileCheck ();


console.log('mobile: ' + mobile);


window.onload=function(){

    map.setView(cooCenter, zoomLevel);
    
    map.on('move', function() {document.getElementById('legend').style.visibility = 'hidden'; circleRadii.clearLayers()});
    map.on('zoom', function() {document.getElementById('legend').style.visibility = 'hidden'; circleRadii.clearLayers()});
    
    
	map.on('moveend', function() { 
        console.log('moveend')
        
         zoomLevel = map.getZoom();
        
        boundsCountStations(stations._layers);
        boundsCountSensors(sensors._layers);
        
        if ((prev == 250 && zoomLevel > 14)||(prev == 1000 && zoomLevel > 12)){
        countDistance();
        drawCircles();   
        stations.bringToFront();
        sensors.bringToFront();
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
                        radius:responsiveRadius(mobile),
                        fillColor: 'blue',
                        stroke:false,
                        fillOpacity: 1})
                      },
                      onEachFeature: function (feature, layer) {
                        
                        var popupContent = "<h1>Official EU Station</h1><p><b>City: </b>"+feature.properties.Name+"</p><p><b>Area Classification: </b> "+feature.properties.AreaClassification+"</p><p><b>Station Classification ID: </b>"+feature.properties.StationClassification+"</p>";
                        layer.bindPopup(popupContent,{closeButton:true, maxWidth: "auto"});
                      }}).addTo(map);
    
            boundsCountStations(stations._layers);
        
          		api.getData("https://maps.sensor.community/data/v2/data.dust.min.json").then(function (result) {
            locations = result;            
          sensors = L.geoJSON(locations,{
                      pointToLayer: function (feature, latlng) {
                          
                          coo.push(latlng);
                          
                       return L.circleMarker(latlng, {
                        className : 'sensor',
                        radius:responsiveRadius(mobile),
                        fillColor: 'red',
                        stroke:false,
                        fillOpacity: 1})
                      },
                      onEachFeature: function (feature, layer) {
                         var position;
                         if (feature.properties.indoor == 0) {position="outdoor"}else{position="indoor"};
                         var popupContent = "<h1>Sensor.Community #"+feature.properties.id+"</h1><p><b>Type: </b>"+feature.properties.type+"</p><p><b>Position: </b>"+position+"</p>";
                         layer.bindPopup(popupContent,{closeButton:true, maxWidth: "auto"});
                      }}).addTo(map);
                        
            boundsCountSensors(sensors._layers);
            countDistance();
            drawCircles ();  
            stations.bringToFront();
            sensors.bringToFront();
            document.getElementById("loading_layer").style.display ="none";
            document.getElementById("radiocontainer").style.display ="block";
                                
});      
});
};


map = L.map('map',{ zoomControl:true,minZoom:1,doubleClickZoom:false});

tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
			attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
			maxZoom: 18}).addTo(map);

var searchControl = esri_geo.geosearch({useMapBounds:false, zoomToResult:true}).addTo(map);

new L.Hash(map);

L.control.mousePosition().addTo(map);

circleRadii.addTo(map);

var radios = document.radForm.radius;
var prev = 250;
for (var i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function() {
        if (this !== prev) {
            prev = this.value;
            console.log(prev);
            document.getElementById('legend').style.visibility = 'hidden';
            circleRadii.clearLayers();
            if ((prev == 250 && zoomLevel > 14)||(prev == 1000 && zoomLevel > 12)){countDistance();};
            drawCircles(); 
        stations.bringToFront();
        sensors.bringToFront();
        }
        
    });
};


 document.getElementById("menu").addEventListener("click", toggleSidebar); 

function boundsCountStations (object){
    var arrayConv = Object.values(object);
    mapBounds = map.getBounds();
    stationsInBounds = arrayConv.filter(function (e) {if (mapBounds.contains(e._latlng)){return e}});
    
    stationsInBounds.forEach(function(e){e.count250 = 0;
                                        e.count1000 = 0  });
        
    document.getElementById("stationsCount").innerHTML = stationsInBounds.length;

}


function boundsCountSensors (object){
    var arrayConv = Object.values(object);
    mapBounds = map.getBounds();
    sensorsInBounds = arrayConv.filter(function (e) {if (mapBounds.contains(e._latlng)){return e}}); 
    
    document.getElementById("sensorsCount").innerHTML = sensorsInBounds.length;

}

function countDistance(){
    stationsInBounds.forEach(function(e){
    sensorsInBounds.forEach(function(i){if (i._latlng.distanceTo(e._latlng)<=250){e.count250 +=1};
                                           if (i._latlng.distanceTo(e._latlng)<=1000){e.count1000 +=1};
                                           });
    });
}

function drawCircles(){
    
    if(prev == 250 && zoomLevel > 14){
        
        console.log(stationsInBounds);
            max = Math.max.apply(Math, stationsInBounds.map(function(o) { return o.count250; }));
            min = Math.min.apply(Math, stationsInBounds.map(function(o) { return o.count250; }));   
        
        console.log(min + ' ' +max);
        
    };
    
    if(prev == 1000 && zoomLevel > 12){
        
        console.log(stationsInBounds);
        
           max = Math.max.apply(Math, stationsInBounds.map(function(o) { return o.count1000; }));
           min = Math.min.apply(Math, stationsInBounds.map(function(o) { return o.count1000; }));
        
        console.log(min + ' ' +max);
    };
    
    
    if(((prev == 1000 && zoomLevel > 12) || (prev == 250 && zoomLevel > 14)) && (Math.abs(min) !== Infinity || Math.abs(max) !== Infinity)){
        
    console.log("CALLED");
    
    document.getElementById('legend').style.visibility = 'visible';
        
if (min !== 0 && min === max ){document.getElementById('min').innerHTML= "&emsp;";}else{ document.getElementById('min').innerHTML= "&emsp;" + min;}; 
            
   
        
 if (max!== 0){document.getElementById('max').innerHTML= "&emsp;" + max;}else{document.getElementById('max').innerHTML= "&emsp;";}; 
        
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
        
    });
    };
        
}

function setColor(val1,val2){
    
    var base = (max - min);
    var percCal;
    
    if (prev == 250) {var perc = val1;};
    if (prev == 1000) {var perc = val2;};
    
//    REVOIR!!!
    
            if (base == 0 && max!= 0  && min!=0) { console.log('min=max'); perc = 100;}
            else if (base == 0 && max== 0) { console.log('min=max=0');perc = 0; }
            else {
                console.log('calculate');
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
            return '#' + ('000000' + h.toString(16)).slice(-6); 
}

function popupMaker(coo){
    
    var filtered = sensorsInBounds.filter(function(i){
        if (prev == 250){if (i._latlng.distanceTo(coo)<=250){return i};};
        if (prev == 1000){if (i._latlng.distanceTo(coo)<=1000){return i};};
    })
    
    console.log(filtered);
    
    if (filtered.length == 0){return "<h1>No S.C Sensor in " + prev + " m radius</h1>"}
    
    else{
    
    var texte1 ="<table><tr><th><h1>" + filtered.length + " S.C Sensor(s) in " + prev + " m radius</h1></th></tr>";
    
    filtered.forEach(function(e,i,a){
        
        if (i < (a.length -1)) {var texte2 = "<tr><td>" + e.feature.properties.id + "</td></tr>"};
        if (i == (a.length -1)) {var texte2 = "<tr><td>" + e.feature.properties.id + "</td></tr></table>"};
        texte1 += texte2});
    return texte1;
    };
}

function openSidebar() {
	document.getElementById("menu").innerHTML = "&#10006;";
	document.getElementById("sidebar").style.display = "block";
}

function closeSidebar() {
	document.getElementById("menu").innerHTML = "&#9776;";
	document.getElementById("sidebar").style.display = "none";
}

function toggleSidebar() {
	if (document.getElementById("sidebar").style.display === "block") {
		closeSidebar();
	} else {
		openSidebar()
	}
}

 function mobileCheck () {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
     
// TABLET
     
//       let check = false;
//  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
//  return check;
     
     
}

function responsiveRadius(bool){
    if (bool == true){
         return 10
        }else{
        return 4
        }   
}