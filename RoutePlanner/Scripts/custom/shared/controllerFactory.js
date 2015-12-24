(function (controllers) {

    controllers.newTripCtrl = function ($scope, $uibModal) {

        $scope.NewTrip = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'http://localhost/RoutePlanner/Scripts/custom/shared/templates/newTripModal.html',
                controller: 'NewTripModalCtrl',
                size: size
            });
        };
    };

    controllers.newTripModalCtrl = function ($scope, $modalInstance, $http) {

        $scope.TripName;

        $scope.ok = function () {
            
            jQuery.ajax({
                url: "http://localhost:81/wp_thinkbackpacking/Slim/saveTrip",
                type: "POST",
                data: { isNewTrip: 1, tripName: $scope.TripName }
            }).done(function successCallback(response) {
                
                window.location.href = "/RoutePlanner/Home/Index?tripId=" + response;

            });

        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

})(travelTool.shared.controllers)