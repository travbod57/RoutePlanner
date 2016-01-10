(function (services) {

    services.utils = function ($sessionStorage) {

        var _getQueryStringParameterByName = function (name) {

            var regexS = "[\\?&]" + name + "=([^&#]*)",
            regex = new RegExp(regexS),
            results = regex.exec(window.location.search);

            if (results == null) {
                return undefined;
            } else {
                return decodeURIComponent(results[1].replace(/\+/g, " "));
            }
        };

        var _transformSessionTrip = function () {

            var trip;
            var sessionTrip = $sessionStorage['trip'];

            if (sessionTrip != undefined) {

                trip = {
                    Id: sessionTrip.id,
                    StartDate: sessionTrip.StartDate,
                    EndDate: sessionTrip.EndDate,
                    NumberOfNights: sessionTrip.NumberOfNights,
                    NumberOfStops: sessionTrip.NumberOfStops,
                    TotalCost: sessionTrip.TotalCost,
                    Route: angular.fromJson(sessionTrip.Route),
                    CurrencyId: sessionTrip.SelectedCurrencyDropdownValue.id,
                    SessionStorage: 1
                };
            }
            else {
                trip = {};
            }

            return trip;
        }

        return {
            getQueryStringParameterByName: _getQueryStringParameterByName,
            transformSessionTrip : _transformSessionTrip
        };

    };

    services.underscore = function ($window) {
        return $window._; // assumes underscore has already been loaded on the page
    };

    services.authentication = function ($http, CONFIG) {

        var _isAuthenticated = function () {

            return $http.get(CONFIG.IS_AUTHENTICATED_URL);
        }

        return {
            isAuthenticated: _isAuthenticated
        }

    };

    services.data = function ($http, CONFIG) {

        var _saveTripRemotely = function (trip) {

            return jQuery.ajax({
                url: CONFIG.SAVE_TRIP_URL,
                type: "POST",
                dataType: "text",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: {
                    tripData: angular.toJson(trip)
                }
            });
        }

        return {
            saveTripRemotely: _saveTripRemotely
        }

    };

    services.modals = function ($http, $uibModal, CONFIG) {

        var _newTrip = function (size, saveTripOnOk, trip) {

                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: CONFIG.TMP_NEW_TRIP,
                    controller: 'NewTripModalCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    size: size,
                    resolve: {
                        saveTripOnOk: function () {
                            return saveTripOnOk;
                        },
                        trip: function () {
                            return trip;
                        }
                    }
                });

                return modalInstance;
        };

        var _saveTrip = function (size, trip) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'saveTripModal.html',
                controller: 'SaveTripModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: size,
                resolve: {
                    trip: function () {
                        return trip;
                    }
                }
            });

            return modalInstance;
        };

        return {
            newTrip: _newTrip,
            saveTrip: _saveTrip
        }
    };

})(travelTool.shared.services)