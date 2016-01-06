
var travelToolApp = angular.module('routePlanner', ['ui.bootstrap', 'uiGmapgoogle-maps', 'ngAnimate', 'ngStorage'])
.constant('CONFIG', {
    "START_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-green-darker.png",
    "NUMBER_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-blue-darker.png",
    "END_MARKER_ICON": "http://localhost:81/wp_thinkbackpacking/wp-content/themes/devdmbootstrap3-child/images/travel-tool/map-marker-icon-red.png",
    "GET_LOCATIONS_BY_TERM_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getLocationsByTerm",
    "SEND_EMAIL_URL": "http://localhost:81/wp_thinkbackpacking/Slim/sendEmail",
    "SAVE_TRIP_URL": "http://localhost:81/wp_thinkbackpacking/Slim/saveTrip",
    "GET_TRIP_URL": "http://localhost:81/wp_thinkbackpacking/Slim/getTrip",
    "IS_AUTHENTICATED_URL": "http://localhost:81/wp_thinkbackpacking/Slim/isAuthenticated",
    "GET_TRIP_NAME_ALREADY_EXISTS": "http://localhost:81/wp_thinkbackpacking/Slim/tripNameAlreadyExists?tripName=",
    "TMP_NEW_TRIP": "http://localhost/RoutePlanner/angularjs-templates/shared/newTripModal.html",
    "TRIP_URL": "/RoutePlanner/Home/Index?tripId=",
    "LOGIN_URL": "http://localhost:81/wp_thinkbackpacking/login",
    "REGISTER_URL": "http://localhost:81/wp_thinkbackpacking/register",
    "MY_TRIPS_URL": "http://localhost:81/RoutePlanner/MyTrips"
})
.config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});

// Register Services

travelToolApp.service('utilService', travelTool.shared.services.utils);

travelTool.shared.services.authentication.$inject = ['$http', 'CONFIG'];
travelToolApp.service('authenticationService', travelTool.shared.services.authentication);

travelTool.shared.services.underscore.$inject = ['$window'];
travelToolApp.service('_', travelTool.shared.services.underscore);

// Register Controllers

travelToolApp.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $controller, $uibModal, $window, $sessionStorage, CONFIG, utilService, authenticationService) {

    $controller('NewTripCtrl', { $scope: $scope });

    uiGmapGoogleMapApi.then(function (maps) {
        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };
    });

    var _trip = {};
    var _transport;
    var _isAuthenticated;
    
    authenticationService.isAuthenticated().then(function (response) {

        _isAuthenticated = response.data != 1 ? false : true;

    }, function (response) {

    });

    $scope.TripName;
    $scope.ChosenLocation;
    $scope.SelectedRouteStop;
    $scope.StartDate;
    $scope.Route = [];
    $scope.PolyLines = [];
    $scope.MaxLocations = 50;
    $scope.ShowLoginDialog = false;
    $scope.$storage = $sessionStorage;
    $scope.SelectedCurrencyDropdownValue;

    InitialiseTrip();

    /* ACTIONS */

    //$scope.Save = function () {

    //$http({
    //    method: 'POST',
    //    url: "http://localhost:81/Slim/saveRoute",
    //    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //    transformRequest: function (obj) {
    //        var str = [];
    //        for (var p in obj)
    //            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    //        return str.join("&");
    //    },
    //    data: { routeData: angular.toJson($scope.Route) }
    //}).then(function (response) {
    //    alert("this callback will be called asynchronously");
    //    // this callback will be called asynchronously
    //    // when the response is available
    //}, function (response) {
    //    alert(response + "called asynchronously if an error occurs");
    //    // called asynchronously if an error occurs
    //    // or server returns response with an error status.
    //});
    //};

    function _saveDataLocally() {

        _trip.Route = angular.toJson($scope.Route);
        _trip.PolyLines = angular.toJson($scope.PolyLines);
        _trip.StartDate = $scope.StartDate;
        _trip.SelectedCurrencyDropdownValue = $scope.SelectedCurrencyDropdownValue;

        $scope.$storage['trip'] = _trip;

        $scope.ShowLoginDialog = true;
    }

    function _saveDataRemotely() {

        $scope.$storage['trip'] = undefined;

        _trip.StartDate = $scope.StartDate;
        _trip.CurrencyId = $scope.SelectedCurrencyDropdownValue.id;

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
            data: { routeData: angular.toJson($scope.Route), tripData: angular.toJson(_trip), isNewTrip: _trip.Id != 0 ? 0 : 1 }
        });
    }

    $scope.Choose = function () {

        if ($scope.ChosenLocation !== undefined) {

            $scope.Route.push({
                id: $scope.ChosenLocation.Id,
                location: $scope.ChosenLocation,
                coords: {
                    latitude: $scope.ChosenLocation.Latitude,
                    longitude: $scope.ChosenLocation.Longitude
                },
                options: {
                    labelAnchor: '15 45'
                    //animation: google.maps.Animation.DROP
                },
                nights: 0,
                transportId: 1,
                transportName: function () {

                    var transportItem = _.findWhere(_transport, { id: this.transportId });

                    return transportItem.name;
                },
                dailyCost: $scope.ChosenLocation.DailyCost,
                totalCost: '0.00',
                stopNumberDivClass: '',
                stopNumberSpanClass: ''
            });

            CreatePolyLine($scope.Route.length - 1);

            $scope.UpdateStopNumbering();

            $scope.ChosenLocation = undefined;
        }
    }

    $scope.Remove = function (location) {

        var isFirstStop, isSecondStop, isLastLocation, index;

        if (location.stop == 'Start') {
            isFirstStop = true;
            index = 0;
        }
        else if (location.stop == 1) {
            isSecondStop = true;
            index = 1;
        }
        else if (location.stop == 'End') {
            isLastLocation = true;
            index = $scope.Route.length - 1;
        }
        else
            index = location.stop;

        // remove from route array
        $scope.Route.splice(index, 1);

        if (isFirstStop) {
            $scope.PolyLines.splice(0, 1); // remove first
        }
        else if (isLastLocation) {
            $scope.PolyLines.splice(index - 1, 1); // remove last
        }
        else if (isSecondStop) {
            var nextPolyPath = $scope.PolyLines[index];
            nextPolyPath.path[0].longitude = $scope.PolyLines[0].path[0].longitude;
            nextPolyPath.path[0].latitude = $scope.PolyLines[0].path[0].latitude;

            var prevLocation = $scope.Route[index - 1];

            PolyPathService.UpdateStrokeColour(prevLocation.transportId, nextPolyPath);

            $scope.PolyLines.splice(0, 1); // remove first
        }
        else {
            var prevPolyPath = $scope.PolyLines[index - 2];
            var nextPolyPath = $scope.PolyLines[index];

            nextPolyPath.path[0].longitude = prevPolyPath.path[1].longitude;
            nextPolyPath.path[0].latitude = prevPolyPath.path[1].latitude;

            var prevLocation = $scope.Route[index - 1];

            PolyPathService.UpdateStrokeColour(prevLocation.transportId, nextPolyPath);

            // remove poly line
            $scope.PolyLines.splice(index - 1, 1);
        }

        $scope.UpdateStopNumbering();
    }

    function InitialiseTrip() {

        _trip.id = utilService.getQueryStringParameterByName('tripId');

        // TODO: use AJAX call here
        $scope.CurrencyDropdownValues = [{ id: 1, label: 'POUND', symbol: '£' }, { id: 2, label: 'DOLLAR', symbol: '$' }, { id: 3, label: 'EURO', symbol: '€' }, { id: 4, label: "YEN", symbol: '¥' }];

        // TODO: use AJAX call here
        _transport = [{ id: 1, name: 'Air' }, { id: 2, name: 'Land' }, { id: 3, name: 'Sea' }];

        $http.get(CONFIG.GET_TRIP_URL, {
            params: {
                tripId: _trip.id
            }
        }).then(function (response) {

            // IF AUTHENTICATED retrieve from database
            _trip = response.data.Trip;
            $scope.TripName = _trip.Name;
            
            // set a default if not retrieved
            $scope.SelectedCurrencyDropdownValue = _.findWhere($scope.CurrencyDropdownValues, { id: parseInt(_trip.CurrencyId) || 1 });
            $scope.StartDate = _trip.StartDate;

            $scope.Route = response.data.Route;
            $scope.UpdateStopNumbering();

            for (var i = 0; i < $scope.Route.length; i++) {

                $scope.Route[i].transportId = parseInt($scope.Route[i].transportId);

                CreatePolyLine(i);
            }
            
        }, function errorCallback(response) {

            // IF NOT AUTHENTICATED by WordPress then use Session Storage
            if (response.status == '401') {

                // Authorised but not for the trip
                if (response.data[0] == "Trip_Unauthorised") {
                    
                    var tripUnauthorisedModalInstance = OpenTripUnauthorisedModal('lg');

                    tripUnauthorisedModalInstance.result.then(function () {

                        $scope.NewTrip('lg', true);

                    }, function () {
                        // Cancel and don't save trip
                    });

                } // unauthorised but trying to get to a valid trip URL
                else if (response.data[0] == "WP_Unauthorised" && _trip.id != "") {

                    var modalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: 'loginModal.html',
                        controller: 'loginModalCtrl',
                        backdrop: 'static',
                        size: 'lg'
                    });
                }
                else if (response.data[0] == "WP_Unauthorised" || response.data[0] == "TripId_Not_Provided") {

                    var sessionData = $scope.$storage['trip'];

                    // If there is data in session storage then fetch it
                    if (sessionData != undefined) {
                        $scope.Route = angular.fromJson(sessionData.Route);
                        $scope.PolyLines = angular.fromJson(sessionData.PolyLines);
                        $scope.StartDate = sessionData.startDate;
                        $scope.SelectedCurrencyDropdownValue = sessionData.SelectedCurrencyDropdownValue;
                    }
                    else {
                        // load page for first time use
                        $scope.SelectedCurrencyDropdownValue = $scope.CurrencyDropdownValues[0];
                    }
                }
            }
        });
    }

    function CreatePolyLine(index) {

        if (index > 0) {
            var prevRoute = $scope.Route[index - 1];
            PolyPathService.CreateNewPolyLine($scope.PolyLines, $scope.Route[index].location, prevRoute);
        }
    }

    /* DATE PICKER */

    $scope.today = function () {
        $scope.StartDate = new Date();
    };

    $scope.clear = function () {
        $scope.StartDate = null;
    };

    $scope.open = function ($event) {
        $scope.status.opened = true;
    };

    $scope.setDate = function (year, month, day) {
        $scope.StartDate = new Date(year, month, day);
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1,
        showWeeks: false,
    };

    $scope.format = 'dd-MMM-yyyy';

    $scope.status = {
        opened: false
    };

    /* GETTERS */

    $scope.getLocationsByTerm = function (val) {
        return $http.get(CONFIG.GET_LOCATIONS_BY_TERM_URL, {
            params: {
                searchTerm: val
            }
        }).then(function (response) {
            return response.data.map(function (item) {
                return item;
            });
        });
    };

    $scope.HasRoute = function () {
        return $scope.Route.length > 0 ? true : false;
    }

    $scope.ReturnDate = function () {

        if ($scope.StartDate != '' && $scope.StartDate != undefined) {

            var returnDate = moment($scope.StartDate).add($scope.getTripLength(), 'Days');
            _trip.EndDate = returnDate.format("YYYY-MM-DD");
            return returnDate.format("DD-MMM-YYYY (ddd)");
        }
        else
            return "Please enter a start date";
    }

    $scope.getTotalRouteCost = function () {
        var total = 0;

        for (i = 0; i < $scope.Route.length; i++)
            total += parseFloat($scope.Route[i].totalCost);

        _trip.TotalCost = total.toFixed(2);

        return _trip.TotalCost;
    }

    $scope.getTripLength = function () {
        var total = 0;

        for (i = 0; i < $scope.Route.length; i++)
            total += parseInt($scope.Route[i].nights);

        _trip.NumberOfNights = total;

        return _trip.NumberOfNights;
    }

    $scope.getNumberOfStops = function () {

        _trip.NumberOfStops = $scope.Route.length;

        return _trip.NumberOfStops;
    }

    /* FUNCTIONS */

    $scope.AddNights = function (e) {
        $scope.SelectedRouteStop.nights++;
    };

    $scope.SubtractNights = function (e) {

        if ($scope.SelectedRouteStop.nights > 0)
            $scope.SelectedRouteStop.nights--;
    };

    $scope.TrackSelectedRouteStop = function (routeItem) {
        $scope.SelectedRouteStop = routeItem.location;
    }

    $scope.UpdateStopNumbering = function () {

        for (i = 0; i < $scope.Route.length; i++) {

            var child = i + 1;
            var routeItem = $scope.Route[i];

            if (i == 0) {
                routeItem.stop = 'Start';
                routeItem.stopNumberDivClass = 'startCircle';
                routeItem.stopNumberSpanClass = 'startEndCircleText';
                routeItem.options.labelClass = 'markerLabelStartStyle';
                routeItem.icon = CONFIG.START_MARKER_ICON;
            }
            else if (i == $scope.Route.length - 1) {
                routeItem.stop = 'End';
                routeItem.stopNumberDivClass = 'endCircle';
                routeItem.stopNumberSpanClass = 'startEndCircleText';
                routeItem.options.labelClass = 'markerLabelEndStyle';
                routeItem.icon = CONFIG.END_MARKER_ICON;
            }
            else {
                routeItem.stop = i;
                routeItem.stopNumberDivClass = 'numberCircle';
                routeItem.icon = CONFIG.NUMBER_MARKER_ICON;

                if (routeItem.stop < 10) {
                    routeItem.options.labelClass = 'markerLabelSingleDigitNumberStyle';
                    routeItem.stopNumberSpanClass = 'singleDigitNumberCircleText';
                }
                else {
                    routeItem.options.labelClass = 'markerLabelDoubleDigitNumberStyle';
                    routeItem.stopNumberSpanClass = 'doubleDigitNumberCircleText';
                }
            }

            routeItem.options.labelContent = routeItem.stop;
        }
    }

    $scope.SwitchRoute = function (fromIndex, toIndex) {

        PolyPathService.MendPolyLines($scope.PolyLines, $scope.Route, fromIndex, toIndex);
    }

    $scope.CalculateLocationCost = function (routeItem) {
        routeItem.totalCost = (routeItem.nights * routeItem.dailyCost).toFixed(2);
    }

    //$scope.onMarkerClick = function (model) {
    //    model.show = !model.show;
    //};

    $scope.markersEvents = {
        mouseover: function (gMarker, eventName, model) {
            model.show = true;
            $scope.$apply();
        },
        mouseout: function (gMarker, eventName, model) {
            model.show = false;
            $scope.$apply();
        }
    };

    $scope.OnChangeTransport = function (val) {

        if (val.item.stop == 'Start')
            index = 0;
        else if (val.item.stop != 'End')
            index = val.item.stop;

        if ($scope.PolyLines.length > index) {
            var polyPath = $scope.PolyLines[index];

            PolyPathService.UpdateStrokeColour(val.item.transportId, polyPath);
        }
    }

    $scope.Reset = function () {
        $scope.Route = [];
        $scope.PolyLines = [];
    };

    /* MODAL */

    $scope.Email = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'sendEmailModal.html',
            controller: 'SendEmailModalCtrl',
            backdrop: 'static',
            size: size,
            resolve: {
                route: function () {
                    return $scope.Route;
                }
            }
        });
    };

    $scope.Reset = function (size) {

        $uibModal.open({
            animation: true,
            templateUrl: 'resetModalTemplate.html',
            controller: 'resetModalCtrl',
            backdrop: 'static',
            size: size,
            resolve: {
                yes: function () {
                    return function () {
                        $scope.Route = [];
                        $scope.PolyLines = [];
                    }
                }
            }
        });
    };

    $scope.SaveTrip = function (size) {

        if (_isAuthenticated) {

            var hasTripName = $scope.TripName != null;

            if (hasTripName) {

                // if trip name exists and authenticated, save to remote storage
                OpenSaveTripModal(size);
            }
            else {

                // if trip name DOES NOT exist and authenticated, ASK for trip name THEN SAVE to remote storage
                var newTripModalInstance = $scope.NewTrip(size, true);

                newTripModalInstance.result.then(function () {

                    OpenSaveTripModal(size);

                }, function () {
                    // Cancel and don't save trip
                });
            }
        }
        else {

            // if NOT authenticated save data locally

            _saveDataLocally();

            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                templateUrl: 'loginOrRegisterModal.html',
                controller: 'loginOrRegisterModalCtrl',
                size: size
            });
            
        }  
    };

    function OpenSaveTripModal(size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'saveTripModal.html',
            controller: 'SaveTripModalCtrl',
            backdrop: 'static',
            size: size,
            resolve: {
                saveDataRemotely: function () {
                    return _saveDataRemotely;
                },
                isAuthenticated: function () {
                    return authenticationService.isAuthenticated;
                }
            }
        });
    }

    function OpenRouteLengthExceeded(size) {

        $uibModal.open({
            animation: true,
            templateUrl: 'routeLengthExceededModalTemplate.html',
            controller: 'routeLengthExceededModalCtrl',
            backdrop: 'static',
            size: size,
            resolve: {
                maxLocations: function () {
                    return $scope.MaxLocations;
                }
            }
        });
    }

    function OpenTripUnauthorisedModal(size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'tripUnauthorisedModal.html',
            controller: 'tripUnauthorisedModalCtrl',
            backdrop: 'static',
            size: size
        });

        return modalInstance;
    }

});

// to do: change to $http service
travelToolApp.controller('SendEmailModalCtrl', function ($scope, $uibModalInstance, route) {

    $scope.ContactDetails = { details: { Email: "" } };
    $scope.Route = route;
    $scope.ok = function () {

        jQuery.ajax({
            url: "http://localhost:81/wp_thinkbackpacking/Slim/sendEmail",
            type: "POST",
            dataType: "text",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: { address: $scope.ContactDetails.details.Email, routeData: angular.toJson($scope.Route) }
        }).done(function () {
            $scope.$apply(function () {
                $scope.showEmailError = false;
            });
            $uibModalInstance.close();
        }).
        fail(function (jqXHR, textStatus, error) {
            $scope.$apply(function () {
                $scope.showEmailError = true;
            });

        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('resetModalCtrl', function ($scope, $uibModalInstance, yes) {

    $scope.yes = function () {
        yes();
        $uibModalInstance.dismiss('cancel');
    };

    $scope.no = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('routeLengthExceededModalCtrl', function ($scope, $uibModalInstance, maxLocations) {

    $scope.MaxLocations = maxLocations;

    $scope.ok = function () {
        $uibModalInstance.dismiss('cancel');
    };

});

travelToolApp.controller('SaveTripModalCtrl', function ($scope, $uibModalInstance, saveDataRemotely, isAuthenticated) {

    var progressBarTypes = ['danger', 'info', 'warning', 'success'];
    var isUserLoggedIn = isAuthenticated();

    isUserLoggedIn.then(function (response) {

        if (response.data == 1) {

            $scope.type = progressBarTypes[1];
            $scope.showProgressBar = true;
            $scope.title = "Saving trip ...";

            var promise = saveDataRemotely();

            promise.done(function () {
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
        $uibModalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('loginOrRegisterModalCtrl', function ($scope, $window, $uibModalInstance, CONFIG) {

    $scope.Login = function () {
        $window.location.href = CONFIG.LOGIN_URL;
    };

    $scope.Register = function () {
        $window.location.href = CONFIG.REGISTER_URL;
    };

    $scope.Cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('tripUnauthorisedModalCtrl', function ($scope, $window, $uibModalInstance, CONFIG) {

    $scope.MyTrips = function () {
        $window.location.href = CONFIG.MY_TRIPS_URL;
    };

    $scope.NewTrip = function () {
        $uibModalInstance.close();
    };
});

travelToolApp.controller('loginModalCtrl', function ($scope, $window, $uibModalInstance, CONFIG) {

    $scope.Login = function () {
        $window.location.href = CONFIG.LOGIN_URL;
    };
});



travelTool.shared.controllers.newTripCtrl.$inject = ['$scope', '$uibModal', 'CONFIG'];
travelToolApp.controller('NewTripCtrl', travelTool.shared.controllers.newTripCtrl);

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$http', 'CONFIG'];
travelToolApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);

// Register Directives

travelTool.shared.directives.UniqueTripName.$inject = ['$http', '$q', 'CONFIG'];
travelToolApp.directive('uniqueTripName', travelTool.shared.directives.UniqueTripName);