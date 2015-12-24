myTripsApp.controller("myTripsCtrl", function ($scope, $http, CONFIG) {

    $http.get(CONFIG.GET_MY_TRIPS_URL)
    .then(function successCallback(response) {

        $scope.MyTrips = response.data;

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

});

travelTool.shared.controllers.newTripCtrl.$inject = ['$scope', '$uibModal'];
myTripsApp.controller('NewTripCtrl', travelTool.shared.controllers.newTripCtrl);

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$modalInstance', '$http'];
myTripsApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);