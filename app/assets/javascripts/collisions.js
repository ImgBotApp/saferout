// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">


function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 40.7549, lng: -73.9840},
    zoom: 13
  });

  new AutocompleteDirectionsHandler(map);
}

/**
  * @constructor
 */
function AutocompleteDirectionsHandler(map) {
  this.map = map;
  this.originPlaceId = null;
  this.destinationPlaceId = null;
  this.travelMode = 'WALKING';
  var originInput = document.getElementById('origin-input');
  var destinationInput = document.getElementById('destination-input');
  var modeSelector = document.getElementById('mode-selector');
  this.directionsService = new google.maps.DirectionsService;
  this.directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true,
  });
  this.directionsDisplay.setMap(map);

  var originAutocomplete = new google.maps.places.Autocomplete(
    originInput, {placeIdOnly: true});
  var destinationAutocomplete = new google.maps.places.Autocomplete(
    destinationInput, {placeIdOnly: true});

  this.setupClickListener('changemode-walking', 'WALKING');
  this.setupClickListener('changemode-bicycling', 'BICYCLING');
  // this.setupClickListener('changemode-transit', 'TRANSIT');
  // this.setupClickListener('changemode-driving', 'DRIVING');

  this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupClickListener = function(id, mode) {
  var radioButton = document.getElementById(id);
  var me = this;
  radioButton.addEventListener('click', function() {
    me.travelMode = mode;
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(autocomplete, mode) {
  var me = this;
  autocomplete.bindTo('bounds', this.map);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.place_id) {
      window.alert("Please select an option from the dropdown list.");
      return;
    }
    if (mode === 'ORIG') {
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
    me.route();
  });

};
var polylineColors = ["red", "blue", "green"];
var markers = [];
var routes = [];
var accidents = [];
// getting directions
AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.originPlaceId || !this.destinationPlaceId) {
    return;
  }
  var me = this;
  
  this.directionsService.route({
    origin: {'placeId': this.originPlaceId},
    destination: {'placeId': this.destinationPlaceId},
    travelMode: this.travelMode,
    provideRouteAlternatives: true,
  }, function(response, status) {
    if (status === 'OK') {
      // first loop  to display all routes in the response   
      for (var i = 0, len = response.routes.length; i < len; i++) {
        var route = new google.maps.DirectionsRenderer({
          map: this.map,
          directions: response,
          routeIndex: i,
          polylineOptions: {
            strokeColor: polylineColors[i]
          }
        });
        // create marker to label each route
        var middleIndexOverviewPath = Math.floor(response.routes["" + i + ""].overview_path.length / 2);
        var marker1 = new google.maps.Marker({
          position: response.routes["" + i + ""].overview_path[middleIndexOverviewPath],
          map: this.map,
          label: "" + (i + 1) + ""
        });
        markers.push(marker1);
        routes.push(route);
        accidents.push(0);
        // second loop to iterate over points on overview_path and locate relevant collisions near each point
        for (var n = 0; n < response.routes["" + i + ""].overview_path.length; n++) {
          (function(i) {
            // this query for collision locations is inaccurate because points on the overview path are not at a set distance from each other. Therefor finding collisions within a set radius of each point will result in some duplicates and some ommisions
            $.get("https://data.cityofnewyork.us/resource/qiz3-axqb.geojson?$where=within_circle(location, " + response.routes["" + i + ""].overview_path["" + n + ""].lat() + ", " + response.routes["" + i + ""].overview_path["" + n + ""].lng() + ", 15) AND (number_of_pedestrians_injured > 0 OR number_of_pedestrians_killed > 0 OR number_of_cyclist_injured > 100 OR number_of_cyclist_killed > 0)").success(function(result) {
              // third loop to create a marker for each collision in the response
              for (var f = 0; f < result.features.length; f++) {
                var coords = result.features[f].geometry.coordinates;
                var latLng = new google.maps.LatLng(coords[1],coords[0]);
                
                var marker = new google.maps.Marker({
                  position: latLng,
                  map: this.map,
                  icon: "bang.png"
                }
                );
                markers.push(marker);
                accidents[i] += 1;
              }
            }.bind(this));
          }.bind(this))(i);  
        }
      }
      // 
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  }.bind(this));
};


// functions for control panel buttons
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}
function clearMarkers() {
  setMapOnAll(null);
}
function indexOfMin(arr) {
  if (arr.length === 0) {
    return -1;
  }
  var min = arr[0];
  var minIndex = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i;
      min = arr[i];
    }
  }
  return minIndex;
}
function safestRoute() {
  var IndexMin = indexOfMin(accidents);
  for (var a = 0; a < routes.length; a++) {
    if (a !== IndexMin) { 
      routes[a].setMap(null);
    }
  }
}
function distanceAndDuration() {
  console.log(routes[0].directions.routes);
  // console.log(routes[0].directions.routes[0].legs[0].duration.text);
  var time = document.getElementsByClassName("duration");
  var far = document.getElementsByClassName("distance");
  for (var q = 0; q < 3; q++) {
    if (q + 1 <= accidents.length) {
      time[q].innerHTML = 'Duration: <span style="font-weight:700; color:navy;">' + routes[0].directions.routes[q].legs[0].duration.text + "</span>";
      far[q].innerHTML = 'Distance: <span style="font-weight:700; color:navy;">' + routes[0].directions.routes[q].legs[0].distance.text; + "</span>";
    }
  }
}
function getCollisionCount() {
  // console.log(accidents);
  var d = document.getElementsByClassName("data");
  var dt = document.getElementsByClassName("data_title");
  // console.log(d);

  for (var i = 0; i < d.length; i++) {
    if (i + 1 <= accidents.length) {
      d[i].innerHTML = "" + accidents[i] + ""
      dt[i].innerHTML = "Number of Pedestrians and Cyclists Injured or Killed on This Route";
    } else {
      dt[i].innerHTML = "No Additional Routes";
    }
  }
}
function resetMap() {
  // window.google = {};
  clearMarkers();
  for (var a = 0; a < routes.length; a++) { 
    routes[a].setMap(null);
  }
  markers = [];
  routes = [];
  accidents = [];
  // document.getElementById('origin-input').value = null;
  // document.getElementById('destination-input').value = null;
}
// functions for control panel buttons end