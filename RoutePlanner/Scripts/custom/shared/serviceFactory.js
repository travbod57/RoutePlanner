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

    services.data = function ($http, CONFIG, _) {

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

        var _deleteTrip = function (tripId) {

            if (tripId == undefined) {
                return undefined;
            }
            else {
                return jQuery.ajax({
                    url: CONFIG.DELETE_TRIP,
                    type: "POST",
                    dataType: "text",
                    data: { tripId: tripId }
                });
            }
        };

        var _myTrips = function () {

            return $http.get(CONFIG.GET_MY_TRIPS_URL);
        };

        var _getTrip = function (tripId) {

            return $http.get(CONFIG.GET_TRIP_URL, {
                params: {
                    tripId: tripId
                }
            });
        };

        var _getLocationsByTerm = function (term) {

            return $http.get(CONFIG.GET_LOCATIONS_BY_TERM_URL, {
                params: {
                    searchTerm: term
                }
            });
        };

        return {
            saveTripRemotely: _saveTripRemotely,
            deleteTrip: _deleteTrip,
            myTrips: _myTrips,
            getTrip: _getTrip,
            getLocationsByTerm: _getLocationsByTerm
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

        var _deleteTrip = function (size, tripId) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'deleteTripModalTemplate.html',
                controller: 'DeleteTripModalCtrl',
                backdrop: 'static',
                size: size,
                resolve: {
                    tripId: function () {
                        return tripId;
                    }
                }
            });

            return modalInstance;
        }

        var _loginModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'loginModal.html',
                controller: 'LoginModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: 'lg'
            });

            return modalInstance;
        }

        var _email = function (size, route) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'sendEmailModal.html',
                controller: 'SendEmailModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: size,
                resolve: {
                    route: function () {
                        return route;
                    }
                }
            });

            return modalInstance;
        };

        var _reset = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'resetModalTemplate.html',
                controller: 'ResetModalCtrl',
                backdrop: 'static',
                size: size
            });

            return modalInstance;
        };

        var _loginOrRegister = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                templateUrl: 'loginOrRegisterModal.html',
                controller: 'LoginOrRegisterModalCtrl',
                size: size
            });

            return modalInstance;
        };

        var _routeLengthExceededModal = function (size, maxLocations) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'routeLengthExceededModalTemplate.html',
                controller: 'RouteLengthExceededModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: size,
                resolve: {
                    maxLocations: function () {
                        return maxLocations;
                    }
                }
            });

            return modalInstance;
        };

        var _tripUnauthorisedModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'tripUnauthorisedModal.html',
                controller: 'TripUnauthorisedModalCtrl',
                backdrop: 'static',
                keyboard: false,
                size: size
            });
            
            return modalInstance;
        }

        return {
            newTrip: _newTrip,
            saveTrip: _saveTrip,
            deleteTrip: _deleteTrip,
            loginModal: _loginModal,
            email:_email,
            reset: _reset,
            loginOrRegister: _loginOrRegister,
            routeLengthExceededModal: _routeLengthExceededModal,
            tripUnauthorisedModal: _tripUnauthorisedModal
        }
    };

})(travelTool.shared.services)