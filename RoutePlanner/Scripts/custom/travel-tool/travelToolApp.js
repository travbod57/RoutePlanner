
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

travelTool.shared.services.utils.$inject = ['$sessionStorage'];
travelToolApp.service('utilService', travelTool.shared.services.utils);

travelTool.shared.services.data.$inject = ['$http', 'CONFIG'];
travelToolApp.service('dataService', travelTool.shared.services.data);

travelTool.shared.services.modals.$inject = ['$http', '$uibModal', 'CONFIG'];
travelToolApp.service('modalsService', travelTool.shared.services.modals);

travelTool.shared.services.authentication.$inject = ['$http', 'CONFIG'];
travelToolApp.service('authenticationService', travelTool.shared.services.authentication);

travelTool.shared.services.underscore.$inject = ['$window'];
travelToolApp.service('_', travelTool.shared.services.underscore);

// Register Controllers

travelToolApp.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $controller, $uibModal, $window, $sessionStorage, CONFIG, utilService, authenticationService, modalsService, dataService) {

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

        _trip.Id = utilService.getQueryStringParameterByName('tripId');

        // TODO: use AJAX call here
        $scope.CurrencyDropdownValues = [{ id: 1, label: 'POUND', symbol: '£' }, { id: 2, label: 'DOLLAR', symbol: '$' }, { id: 3, label: 'EURO', symbol: '€' }, { id: 4, label: "YEN", symbol: '¥' }];

        // TODO: use AJAX call here
        _transport = [{ id: 1, name: 'Air' }, { id: 2, name: 'Land' }, { id: 3, name: 'Sea' }];

        var promise = dataService.getTrip(_trip.Id);
        
        promise.then(function (response) {

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
                    
                    OpenTripUnauthorisedModal('lg');

                } // unauthorised but trying to get to a valid trip URL
                else if (response.data[0] == "WP_Unauthorised" && _trip.Id != "") {

                    var modalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: 'loginModal.html',
                        controller: 'loginModalCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        size: 'lg'
                    });
                }
                else if (response.data[0] == "WP_Unauthorised" || response.data[0] == "TripId_Not_Provided") {

                    var sessionData = $scope.$storage['trip'];

                    // If there is data in session storage then fetch it
                    if (sessionData != undefined) {
                        _loadTripFromSessionStorage(sessionData);
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

    function _loadTripFromSessionStorage(sessionData) {
        $scope.Route = angular.fromJson(sessionData.Route);
        $scope.PolyLines = angular.fromJson(sessionData.PolyLines);
        $scope.StartDate = sessionData.StartDate;
        $scope.SelectedCurrencyDropdownValue = sessionData.SelectedCurrencyDropdownValue;
    }

    function _buildTripForTransfer() {

        _trip.CurrencyId = $scope.SelectedCurrencyDropdownValue.id;
        _trip.StartDate = $scope.StartDate;
        _trip.Route = $scope.Route;
    };

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

    $scope.getLocationsByTerm = function (term) {
        return dataService.getLocationsByTerm(term).then(function (response) {
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

    $scope.OnChangeTransport = function (routeItem, index) {

        if ($scope.PolyLines.length > index) {
            var polyPath = $scope.PolyLines[index];

            PolyPathService.UpdateStrokeColour(routeItem.transportId, polyPath);
        }
    }

    $scope.Reset = function () {
        $scope.Route = [];
        $scope.PolyLines = [];
    };

    $scope.NewTrip = function (size, saveTripOnOk) {

        var trip = {};
        trip.Id = 0;

        modalsService.newTrip(size, saveTripOnOk, trip);

        // $scope.$storage['trip'] = undefined;


    };

    /* MODAL */

    $scope.Email = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'sendEmailModal.html',
            controller: 'SendEmailModalCtrl',
            backdrop: 'static',
            keyboard: false,
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

            if (_trip.Id != undefined) {

                // if trip name exists and authenticated, save to remote storage
                _buildTripForTransfer();

                modalsService.saveTrip(size, _trip);
            }
            else {

                // if trip name DOES NOT exist and authenticated, ASK for trip name THEN SAVE to remote storage
                // when doming from trip planner info page????

                _trip.Id = 0;
                _trip.SessionStorage = 1;
                _buildTripForTransfer();

                var newTripModalInstance = modalsService.newTrip(size, false, _trip);

                newTripModalInstance.result.then(function (tripName) {

                    _trip.Name = tripName;
                    
                    var saveTripModalInstance = modalsService.saveTrip(size, _trip);

                    saveTripModalInstance.result.then(function (trip) {
                        window.location.href = CONFIG.TRIP_URL + trip.Id;
                    });

                }, function () {
                    // Cancel and no new trip or transfer
                });
            }
        }
        else {

            // if NOT authenticated save data locally

            _saveDataLocally();

            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                templateUrl: 'loginOrRegisterModal.html',
                controller: 'loginOrRegisterModalCtrl',
                size: size
            });
            
        }  
    };

    function OpenRouteLengthExceeded(size) {

        $uibModal.open({
            animation: true,
            templateUrl: 'routeLengthExceededModalTemplate.html',
            controller: 'routeLengthExceededModalCtrl',
            backdrop: 'static',
            keyboard: false,
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
            keyboard: false,
            size: size
        });
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

});

travelToolApp.controller('loginModalCtrl', function ($scope, $window, $uibModalInstance, CONFIG) {

    $scope.Login = function () {
        $window.location.href = CONFIG.LOGIN_URL;
    };
});

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$http', '$sessionStorage', 'dataService', 'CONFIG', 'saveTripOnOk', 'trip'];
travelToolApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);

travelTool.shared.controllers.saveTripModalCtrl.$inject = ['$scope', '$uibModalInstance', '$sessionStorage', 'authenticationService', 'dataService', 'trip'];
travelToolApp.controller('SaveTripModalCtrl', travelTool.shared.controllers.saveTripModalCtrl);

// Register Directives

travelTool.shared.directives.UniqueTripName.$inject = ['$http', '$q', 'CONFIG'];
travelToolApp.directive('uniqueTripName', travelTool.shared.directives.UniqueTripName);