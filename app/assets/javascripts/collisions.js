// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
function getData() {
  var dataDiv = document.getElementById('datadiv');
  $.get("https://data.cityofnewyork.us/resource/qiz3-axqb.geojson?$where=number_of_pedestrians_injured > 0&date=2017-09-04T00:00:00.000&borough=MANHATTAN").done(function(response) {
    var html = '';
    for (var i = 0; i < response.features.length; i++) {
      console.log(response.features[i]);
      html += '<h3>' + response.features[i].properties.on_street_name + '</h3>' + '<hr>'
    }
    dataDiv.innerHTML = html;
  });
}