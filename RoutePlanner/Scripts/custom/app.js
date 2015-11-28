
var app = angular.module('routePlanner', ['ui.bootstrap', 'uiGmapgoogle-maps', 'ngAnimate', 'ngStorage'])
.constant('CONFIG', {
    "START_MARKER_ICON": "/RoutePlanner/Content/images/markers/map-marker-icon-green-darker.png",
    "NUMBER_MARKER_ICON": "/RoutePlanner/Content/images/markers/map-marker-icon-blue-darker.png",
    "END_MARKER_ICON": "/RoutePlanner/Content/images/markers/map-marker-icon-red.png",
    "GET_LOCATIONS_BY_TERM_URL": "http://localhost:81/Slim/getLocationsByTerm",
    "SEND_EMAIL_URL": "http://localhost:81/Slim/sendEmail",
    "SAVE_ROUTE_URL" : "http://localhost:81/Slim/saveRoute"
})
.config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});



