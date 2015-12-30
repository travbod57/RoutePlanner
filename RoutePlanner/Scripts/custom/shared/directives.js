(function (directives) {

    directives.UniqueTripName = function ($http, $q, CONFIG) {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {

                ctrl.$asyncValidators.unique = function (modelValue, viewValue) {

                    return $http({
                        method: 'GET',
                        url: CONFIG.GET_TRIP_NAME_ALREADY_EXISTS + modelValue
                    }).then(function successCallback(response) {

                        if (response.data == 1) {
                            return $q.reject();
                        }
                        else {
                            return true;
                        }

                    }, function errorCallback(response) {
                        return $q.reject();
                    });
                }
            }
        }
    };

})(travelTool.shared.directives);