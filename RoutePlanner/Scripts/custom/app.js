
var app = angular.module('routePlanner', ['ui.bootstrap', 'uiGmapgoogle-maps', 'ngAnimate', 'ngStorage'])
.constant('CONFIG', {
    "START_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-green-darker.png",
    "NUMBER_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-blue-darker.png",
    "END_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-red.png",
    "GET_LOCATIONS_BY_TERM_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getLocationsByTerm",
    "SEND_EMAIL_URL": "http://localhost:81/wp_thinkbackpacking/Slim/sendEmail",
    "SAVE_ROUTE_URL": "http://localhost:81/wp_thinkbackpacking/Slim/saveRoute",
    "GET_TRIP_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getTrip",
    "IS_AUTHENTICATED_URL": "http://localhost:81/wp_thinkbackpacking/Slim/isAuthenticated"
})
.config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});



