(function (controllers) {

    controllers.newTripModalCtrl = function ($scope, $uibModalInstance, $http, $sessionStorage, dataService, CONFIG, saveTripOnOk, trip) {

        $scope.$storage = $sessionStorage;
        $scope.TripName;

        $scope.ok = function () {

            trip.Name = $scope.TripName;

            if (saveTripOnOk) {

                var promise = dataService.saveTripRemotely(trip);

                promise.done(function successCallback(response) {

                    if (saveTripOnOk) {
                        delete $scope.$storage['trip'];
                        window.location.href = CONFIG.TRIP_URL + response;
                    }
                    else
                        $uibModalInstance.close(response);
                });
            }
            else {
                $uibModalInstance.close(trip.Name);
            }
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };

    controllers.saveTripModalCtrl = function ($scope, $uibModalInstance, $sessionStorage, authenticationService, dataService, trip) {

        $scope.$storage = $sessionStorage;

        var progressBarTypes = ['danger', 'info', 'warning', 'success'];
        var isUserLoggedIn = authenticationService.isAuthenticated();

        isUserLoggedIn.then(function (response) {

            if (response.data == 1) {

                $scope.type = progressBarTypes[1];
                $scope.showProgressBar = true;
                $scope.title = "Saving trip ...";

                var promise = dataService.saveTripRemotely(trip);

                promise.done(function (tripId) {

                    delete $scope.$storage['trip'];
                    trip.Id = tripId;

                    $scope.type = progressBarTypes[3];
                    $scope.title = "Trip saved successfully";
                    $scope.information = "You can now continue adding more locations";
                }).
                fail(function (jqXHR, textStatus, error) {
                    $scope.title = "Trip failed to save";
                    $scope.information = "Please check your connectivity or try again later.";
                    $scope.type = progressBarTypes[0];
                })
                .then(function () {

                    $scope.$apply(function () {
                        $scope.showProgressBar = false;
                        $scope.showInformation = true;
                        $scope.showOkBtn = true;
                    });

                });
            }

        }, function errorCallback(response) {
            $scope.title = "Trip failed to save";
            $scope.information = "We were unable to determine whether you are logged. Please check your connectivity or try again later.";
            $scope.type = progressBarTypes[0];
        });

        $scope.title;
        $scope.information;
        $scope.showProgressBar = false;
        $scope.showInformation = false;
        $scope.type = false;
        $scope.showOkBtn = false;

        $scope.ok = function () {
            $uibModalInstance.close(trip);
        };

    };

    controllers.deleteTripModalCtrl = function ($scope, $uibModalInstance, $sessionStorage, dataService, CONFIG, tripId) {

        $scope.yes = function () {

            var promise = dataService.deleteTrip(tripId);

            if (promise == undefined) {

                $scope.$storage = $sessionStorage;
                delete $scope.$storage['trip'];

                $uibModalInstance.close();
            }
            else {
                promise.done(function () {
                    $uibModalInstance.close();
                }).
                fail(function (jqXHR, textStatus, error) {
                    $uibModalInstance.dismiss('cancel');
                });
            }
        };

        $scope.no = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };


})(travelTool.shared.controllers)