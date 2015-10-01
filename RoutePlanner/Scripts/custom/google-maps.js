

$(document).ready(function () {

    initialize();
    rad = function (x) { return x * Math.PI / 180; }

    //$("#DistanceConversions").buttonset();

    var whichConversion = "kmToMiles"; // to prevent a double click on the distance conversion property

    $("#km").click(function () {

        if (whichConversion != "kmToMiles") {
            var result = milesToKm(parseFloat(remCommas($("#TotalDistance").text())));
            $("#TotalDistance").text(addCommas(result.toFixed(2)));
        }
        else {
        }
        whichConversion = "kmToMiles";
    });

    $("#miles").click(function () {

        if (whichConversion != "MilesToKm") {
            var result = kmToMiles(parseFloat(remCommas($("#TotalDistance").text())));
            $("#TotalDistance").text(addCommas(result.toFixed(2)));
        }
        else {
        }
        whichConversion = "MilesToKm";
    });

});

/*----------------------------------------------------------
Global variables
----------------------------------------------------------*/

var markers = [];
var iterator = 0;
var placeNames = [];
var myRoute = [];
var plotLeg = [];
var map;
var imageLocationStem = '../../RoutePlanner/Content/images/markers/';

/*----------------------------------------------------------
Distance Functions
----------------------------------------------------------*/

function kmToMiles(km) {

    return km * 0.621371192237;
}

function milesToKm(miles) {

    return miles * 1.609344;
}

distHaversine = function (p1, p2) {
    var R = 6371; // earth's mean radius in km
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d.toFixed(2);
}

function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function remCommas(nStr) {

    nStr = nStr.replace(/,/g, '');
    return nStr;

}

/*----------------------------------------------------------
Map Functions
----------------------------------------------------------*/

function initialize() {

    var latlng = new google.maps.LatLng(51.50015, -0.12624);
    var prevPoint, currentPoint;
    var totalDistance = 0;
    var numAddOne;
    var count = 1;
    var myOptions = {
        zoom: 2,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);


    var tripId = $("#tripId").val();

    $.ajax({
        url: 'http://localhost:81/Slim/destinations',
        method: "GET",
        success: function (data) {

            for (i = 0; i < data.length; i++) {

                numAddOne = (i * 1) + 1;
                myRoute.push(new google.maps.LatLng(data[i].Latitude, data[i].Longitude));

                if (i + 1 < data.length) { // to stop going out of the array outside the array

                    plotLeg =
					[
						new google.maps.LatLng(data[i].Latitude, data[i].Longitude),
						new google.maps.LatLng(data[numAddOne].Latitude, data[numAddOne].Longitude)
					];

                    poly = new google.maps.Polyline({
                        path: plotLeg,
                        strokeColor: "#FF0000", // Red
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });

                    currentPoint = plotLeg[1];
                    prevPoint = plotLeg[0];
                    totalDistance = parseFloat(totalDistance) + parseFloat(distHaversine(currentPoint, prevPoint));

                    count++;
                }

                placeNames.push(data[i].PlaceFull);

                drop();
                poly.setMap(map);

            }

            $("#TotalDistance").text(addCommas(totalDistance.toFixed(2)));
        }


    });


}

function getImage() {

    var imageNumber = (iterator * 1);
    var imageName;

    if (imageNumber == 0) {
        imageName = 'StartIcon.png';
    }
    else {
        imageName = 'icon' + imageNumber + '.png';
    }

    console.log(imageLocationStem + imageName);
    return imageLocationStem + imageName;
}

function addMarker(image) {

    var newMarker = new google.maps.Marker({
        position: myRoute[iterator],
        map: map,
        draggable: false,
        //animation: google.maps.Animation.DROP,
        title: placeNames[iterator],
        icon: image
    });

    attachToMark(newMarker, iterator);

    markers.push(newMarker);

    //var sidebar = document.getElementById('sidebar');
    //var sidebarEntry = createSidebarEntry(newMarker, iterator);
    //sidebar.appendChild(sidebarEntry);

    iterator++;
}

// this needs to happen after the marker has been dropped. See the order of events in the loop for Holland and Barratt
function createSidebarEntry(newMarker, name) {
    var div = document.createElement('div');
    var html = '<b>' + name + '</b>';
    div.innerHTML = html;
    div.style.cursor = 'pointer';
    div.style.marginBottom = '5px';
    div.style.border = '1px';

    google.maps.event.addDomListener(div, 'click', function () {
        google.maps.event.trigger(newMarker, 'click');
    });
    google.maps.event.addDomListener(div, 'mouseover', function () {
        div.style.backgroundColor = '#eee';
    });
    google.maps.event.addDomListener(div, 'mouseout', function () {
        div.style.backgroundColor = '#fff';
    });
    return div;
}


var infowindow = new google.maps.InfoWindow();

// for binding the event to the marker. To highlight the destination hovered over
function attachToMark(marker, number) {
    var content = "<b>" + number + "</b>" + "<br />" + "Content for this marker";
    google.maps.event.addListener(marker, "mouseover", function (e) {
        $("table#Route tr#" + number).addClass("markerRollover");
        infowindow.setContent(content);
        infowindow.open(map, marker);
    });

    google.maps.event.addListener(marker, "mouseout", function (e) {
        $("table#Route tr#" + number).removeClass("markerRollover");
    });

    google.maps.event.addListener(marker, "click", function (e) {
        $("table#Route tr#" + number).removeClass("markerRollover");
    });
}

function drop() {

    //setTimeout(function () {

    var image = getImage();

    addMarker(image);
    //}, i * 200);
}



var myRoute = [];

function initialize() {

    var latlng = new google.maps.LatLng(51.50015, -0.12624);
    var prevPoint, currentPoint;
    var totalDistance = 0;
    var numAddOne;
    var count = 1;
    var myOptions = {
        zoom: 2,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("googleMap"), myOptions);


    $.ajax({
        url: 'http://localhost:81/Slim/destinations',
        method: "GET",
        success: function (data) {

            for (i = 0; i < data.length; i++) {

                numAddOne = (i * 1) + 1;
                myRoute.push(new google.maps.LatLng(data[i].Latitude, data[i].Longitude));

                if (i + 1 < data.length) { // to stop going out of the array outside the array

                    plotLeg =
					[
						new google.maps.LatLng(data[i].Latitude, data[i].Longitude),
						new google.maps.LatLng(data[numAddOne].Latitude, data[numAddOne].Longitude)
					];


                    poly = new google.maps.Polyline({
                        path: plotLeg,
                        strokeColor: "#FF0000", // Red
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });



                    currentPoint = plotLeg[1];
                    prevPoint = plotLeg[0];
                    totalDistance = parseFloat(totalDistance) + parseFloat(distHaversine(currentPoint, prevPoint));

                    count++;
                }

                placeNames.push(data[i].PlaceFull);

                drop();
                poly.setMap(map);

            }

            $("#TotalDistance").text(addCommas(totalDistance.toFixed(2)));
        }


    });

}