(function (controllers) {

    controllers.newTripCtrl = function ($scope, $uibModal, CONFIG) {

        $scope.NewTrip = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: CONFIG.TMP_NEW_TRIP,
                controller: 'NewTripModalCtrl',
                size: size
            });
        };
    };

    controllers.newTripModalCtrl = function ($scope, $modalInstance, $http, CONFIG) {

        $scope.TripName;

        $scope.ok = function () {
            
            jQuery.ajax({
                url: CONFIG.SAVE_TRIP_URL,
                type: "POST",
                data: { isNewTrip: 1, tripName: $scope.TripName }
            }).done(function successCallback(response) {
                
                window.location.href = CONFIG.TRIP_URL + response;

            });

        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

})(travelTool.shared.controllers)