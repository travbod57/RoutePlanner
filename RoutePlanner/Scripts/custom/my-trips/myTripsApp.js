﻿var myTripsApp = angular.module('MyTrips', ['ui.bootstrap', 'ngStorage'])
.constant('CONFIG', {
    "GET_MY_TRIPS_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getMyTrips",
    "GET_TRIP_NAME_ALREADY_EXISTS": "http://localhost:81/wp_thinkbackpacking/Slim/tripNameAlreadyExists?tripName=",
    "DELETE_TRIP": "http://localhost:81/wp_thinkbackpacking/Slim/deleteTrip",
    "NAME_TRIP": "http://localhost/RoutePlanner/angularjs-templates/shared/nameTripModal.html",
    "SAVE_TRIP_URL": "http://localhost:81/wp_thinkbackpacking/Slim/saveTrip",
    "TRIP_URL": "/RoutePlanner/Home/Index?tripId=",
    "RENAME_TRIP_URL": "http://localhost:81/wp_thinkbackpacking/Slim/renameTrip?tripId="
});

// Register Services

travelTool.shared.services.underscore.$inject = ['$window'];
myTripsApp.service('_', travelTool.shared.services.underscore);

travelTool.shared.services.utils.$inject = ['$localStorage'];
myTripsApp.service('utilService', travelTool.shared.services.utils);

travelTool.shared.services.data.$inject = ['$http', 'CONFIG', '_'];
myTripsApp.service('dataService', travelTool.shared.services.data);

travelTool.shared.services.modals.$inject = ['$http', '$uibModal', 'CONFIG'];
myTripsApp.service('modalsService', travelTool.shared.services.modals);

// Register Controllers

myTripsApp.controller("myTripsCtrl", function ($scope, $http, $uibModal, $controller, $localStorage, utilService, modalsService, dataService, CONFIG, _) {

    var promise = dataService.myTrips();

    promise.then(function successCallback(response) {
        
        $scope.$storage = $localStorage;        

        var trip = $scope.$storage['trip'];
        
        if (trip != undefined) {
            response.data.splice(0, 0, { Id: trip.id, Name: "", StartDate: trip.StartDate, EndDate: trip.EndDate, TotalCost: trip.TotalCost, NumberOfStops: trip.NumberOfStops, Symbol: trip.SelectedCurrencyDropdownValue.symbol, IsSaved: 0 });
        }    

        $scope.MyTrips = response.data;

    }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

    $scope.DeleteTrip = function (size, tripId) {

        var deleteTripModalInstance = modalsService.deleteTrip(size, tripId);

        deleteTripModalInstance.result.then(function () {

            var indexOfDeletedTrip = _.findIndex($scope.MyTrips, { Id: tripId });
            $scope.MyTrips.splice(indexOfDeletedTrip, 1);
            $scope.NumberOfTrips--;
        });
    };

    $scope.NewTrip = function (size, saveTripOnOk, saveTripFromStorage) {

        var trip;
        
        if (saveTripFromStorage)
            trip = utilService.transformSessionTrip();
        else
            trip = {};
        
        modalsService.newTrip(size, saveTripOnOk, trip, saveTripFromStorage);
    };

    $scope.RenameTrip = function (size, tripId) {

        var renameTripModalInstance = modalsService.renameTrip(size, tripId);

        renameTripModalInstance.result.then(function (newTripName) {

            var trip = _.findWhere($scope.MyTrips, { Id: tripId });
            trip.Name = newTripName;
        });
    };
});

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$http', '$localStorage', 'dataService', 'CONFIG', 'saveTripOnOk', 'trip', 'saveTripFromStorage'];
myTripsApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);

travelTool.shared.controllers.deleteTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$localStorage', 'dataService', 'CONFIG', 'tripId'];
myTripsApp.controller('DeleteTripModalCtrl', travelTool.shared.controllers.deleteTripModalCtrl);

travelTool.shared.controllers.renameTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$http', 'dataService', 'CONFIG', 'tripId'];
myTripsApp.controller('RenameTripModalCtrl', travelTool.shared.controllers.renameTripModalCtrl);

// Register Directives

travelTool.shared.directives.UniqueTripName.$inject = ['$http', '$q', 'CONFIG'];
myTripsApp.directive('uniqueTripName', travelTool.shared.directives.UniqueTripName);

// Register Filters

myTripsApp.filter('standardDateFormat', function myDateFormat($filter) {
    return function (text) {

        if (text != null) {

            var tempdate = new Date(text.replace(/-/g, "/"));
            return $filter('date')(tempdate, "dd-MMM-yyyy");
        }
        else
            return "-";
  }
});

myTripsApp.filter('auditDateFormat', function myDateFormat($filter) {
    return function (text) {

        if (text != null) {

            var tempdate = new Date(text.replace(/-/g, "/"));
            return $filter('date')(tempdate, "dd-MMM-yyyy 'at' HH:mm:ss");
        }
        else
            return "-";
  }
});