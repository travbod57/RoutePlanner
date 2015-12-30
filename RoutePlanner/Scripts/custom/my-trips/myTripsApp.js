var myTripsApp = angular.module('MyTrips', ['ui.bootstrap'])
.constant('CONFIG', {
    "GET_MY_TRIPS_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getMyTrips",
    "GET_TRIP_NAME_ALREADY_EXISTS": "http://localhost:81/wp_thinkbackpacking/Slim/tripNameAlreadyExists?tripName=",
    "DELETE_TRIP": "http://localhost:81/wp_thinkbackpacking/Slim/deleteTrip"
});

// Register Services

travelTool.shared.services.underscore.$inject = ['$window'];
myTripsApp.service('_', travelTool.shared.services.underscore);

// Register Controllers

myTripsApp.controller("myTripsCtrl", function ($scope, $http, $uibModal, CONFIG, _) {

    $http.get(CONFIG.GET_MY_TRIPS_URL)
    .then(function successCallback(response) {

        $scope.MyTrips = response.data;

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

    $scope.DeleteTrip = function (size, tripId) {

        $uibModal.open({
            animation: true,
            templateUrl: 'deleteTripModalTemplate.html',
            controller: 'deleteTripModalCtrl',
            size: size,
            resolve: {
                yes: function () {
                    return function () {
                        deleteTrip(tripId);
                    }
                }
            }
        });
    };

    function deleteTrip(tripId) {

        jQuery.ajax({
            url: CONFIG.DELETE_TRIP,
            type: "POST",
            dataType: "text",
            data: { tripId: tripId }
        }).done(function () {

            var indexOfDeletedTrip = _.findIndex($scope.MyTrips, { Id: tripId });

            $scope.$apply(function () {
                $scope.MyTrips.splice(indexOfDeletedTrip, 1);
            });

        }).
        fail(function (jqXHR, textStatus, error) {
            alert('failed');

        });
    };
});

travelTool.shared.controllers.newTripCtrl.$inject = ['$scope', '$uibModal'];
myTripsApp.controller('NewTripCtrl', travelTool.shared.controllers.newTripCtrl);

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$modalInstance', '$http'];
myTripsApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);

myTripsApp.controller('deleteTripModalCtrl', function ($scope, $modalInstance, yes) {

    $scope.yes = function () {
        yes();
        $modalInstance.dismiss('cancel');
    };

    $scope.no = function () {
        $modalInstance.dismiss('cancel');
    };
});

// Register Directives

travelTool.shared.directives.UniqueTripName.$inject = ['$http', '$q', 'CONFIG'];
myTripsApp.directive('uniqueTripName', travelTool.shared.directives.UniqueTripName);