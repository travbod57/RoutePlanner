var myTripsApp = angular.module('MyTrips', ['ui.bootstrap'])
.constant('CONFIG', {
    "GET_MY_TRIPS_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getMyTrips"
});