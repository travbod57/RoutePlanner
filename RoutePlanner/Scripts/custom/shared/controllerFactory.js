(function (controllers) {

    controllers.newTripCtrl = function ($scope, $uibModal, CONFIG) {

        $scope.NewTrip = function (size, saveTripAfterNameGiven) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: CONFIG.TMP_NEW_TRIP,
                controller: 'NewTripModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: size,
                resolve: {
                        saveTripAfterNameGiven: function () {
                        return saveTripAfterNameGiven;
                    }
                }
            });

            return modalInstance;
        };
    };

    controllers.newTripModalCtrl = function ($scope, $uibModalInstance, $http, CONFIG, saveTripAfterNameGiven) {

        $scope.TripName;

        $scope.ok = function () {

            jQuery.ajax({
                url: CONFIG.SAVE_TRIP_URL,
                type: "POST",
                data: { isNewTrip: 1, tripName: $scope.TripName }
            }).done(function successCallback(response) {

                if (saveTripAfterNameGiven)
                    $uibModalInstance.close();
                else
                    window.location.href = CONFIG.TRIP_URL + response;
            });

        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };

})(travelTool.shared.controllers)