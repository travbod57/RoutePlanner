
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
    "GET_TRIP_NAME_ALREADY_EXISTS": "http://localhost:81/wp_thinkbackpacking/Slim/tripNameAlreadyExists?tripName="
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

travelTool.shared.services.underscore.$inject = ['$window'];
travelToolApp.service('_', travelTool.shared.services.underscore);

// Register Controllers

travelToolApp.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal, $window, $sessionStorage, CONFIG, utilService) {

    uiGmapGoogleMapApi.then(function (maps) {
        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };
    });

    var _trip = {};
    var _transport;

    $scope.TripName;
    $scope.ChosenLocation;
    $scope.SelectedRouteStop;
    $scope.startDate;
    $scope.route = [];
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
    //    data: { routeData: angular.toJson($scope.route) }
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

        $scope.$storage['route'] = angular.toJson($scope.route);
        $scope.$storage['polyLines'] = angular.toJson($scope.PolyLines);

        _trip.route = angular.toJson($scope.route);
        _trip.polyLines = angular.toJson($scope.PolyLines);
        _trip.startDate = startDate;

        $scope.$storage['trip'] = _trip;

        $scope.ShowLoginDialog = true;
    }

    function _saveDataRemotely() {

        $scope.$storage['trip'] = undefined;

        _trip.startDate = moment($scope.startDate).format("YYYY-MM-DD");
        _trip.currencyId = $scope.SelectedCurrencyDropdownValue.id;

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
            data: { routeData: angular.toJson($scope.route), tripData: angular.toJson(_trip), isNewTrip: 0 }
        });
    }

    $scope.Choose = function () {

        if ($scope.ChosenLocation !== undefined) {

            $scope.route.push({
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
                totalCost: '',
                stopNumberDivClass: '',
                stopNumberSpanClass: ''
            });

            CreatePolyLine($scope.ChosenLocation);

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
            index = $scope.route.length - 1;
        }
        else
            index = location.stop;

        // remove from route array
        $scope.route.splice(index, 1);

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

            var prevLocation = $scope.route[index - 1];

            PolyPathService.UpdateStrokeColour(prevLocation.transportId, nextPolyPath);

            $scope.PolyLines.splice(0, 1); // remove first
        }
        else {
            var prevPolyPath = $scope.PolyLines[index - 2];
            var nextPolyPath = $scope.PolyLines[index];

            nextPolyPath.path[0].longitude = prevPolyPath.path[1].longitude;
            nextPolyPath.path[0].latitude = prevPolyPath.path[1].latitude;

            var prevLocation = $scope.route[index - 1];

            PolyPathService.UpdateStrokeColour(prevLocation.transportId, nextPolyPath);

            // remove poly line
            $scope.PolyLines.splice(index - 1, 1);
        }

        $scope.UpdateStopNumbering();
    }

    function IsAuthenticated() {

        return $http.get(CONFIG.IS_AUTHENTICATED_URL);
    }

    function InitialiseTrip() {

        _trip.id = utilService.getQueryStringParameterByName('tripId');

        // TODO: use AJAX call here
        $scope.CurrencyDropdownValues = [{ id: 1, label: 'POUND', symbol: '£' }, { id: 2, label: 'DOLLAR', symbol: '$' }, { id: 3, label: 'EURO', symbol: '€' }, { id: 4, label: "YEN", symbol: '¥' }];

        // TODO: use AJAX call here
        _transport = [{ id: 1, name: 'Air' }, { id: 2, name: 'Land' }, { id: 3, name: 'Sea' }];

        var nowTemp = new Date();
        var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate() + 1, 0, 0, 0, 0);

        

        //var mtStartDate = moment(now);
       // jQuery("#startDate").datepicker('setDate', '01-Jan-2016');
        //$scope.StartDate = mtStartDate.format("DD-MMM-YYYY");
        
        $http.get(CONFIG.GET_TRIP_URL, {
            params: {
                tripId: _trip.id
            }
        }).then(function (response) {

            // IF AUTHENTICATED retrieve from database
            _trip = response.data.Trip;
            $scope.TripName = _trip.Name;
            
            $scope.SelectedCurrencyDropdownValue = _.findWhere($scope.CurrencyDropdownValues, { id: _trip.CurrencyId || 1 });

            $scope.route = response.data.Route;
            $scope.UpdateStopNumbering();

            if ($scope.route.length > 1) {
                for (var i = 1; i < $scope.route.length; i++) {
                    CreatePolyLine($scope.route[i].location);
                }
            }

        }, function errorCallback(response) {

            // IF NOT AUTHENTICATED by WordPress then use Session Storage
            if (response.status == '401') {

                var sessionData = $scope.$storage['_trip'];

                // If there is data in session storage then fetch it
                if (sessionData != undefined) {
                    $scope.route = angular.fromJson(sessionData.route);
                    $scope.PolyLines = angular.fromJson(sessionData.polyLines);
                    //$scope.startDate = sessionData.startDate;
                }
                else
                {
                    // load page for first time use
                    $scope.SelectedCurrencyDropdownValue = $scope.CurrencyDropdownValues[0];
                }
            }
        });
    }

    function CreatePolyLine(location) {

        if ($scope.route.length > 1) {
            var prevRoute = $scope.route[$scope.route.length - 2];
            PolyPathService.CreateNewPolyLine($scope.PolyLines, location, prevRoute);
        }
    }

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
        return $scope.route.length > 0 ? true : false;
    }

    $scope.ReturnDate = function () {

        if ($scope.startDate != '' && $scope.startDate != undefined) {
            var returnDate = moment(jQuery("#startDate").datepicker('getDate')).add($scope.getTripLength(), 'Days');
            _trip.endDate = returnDate.format("YYYY-MM-DD");
            return returnDate.format("DD-MMM-YYYY (ddd)");
        }
        else
            return "Please enter a start date";
    }

    $scope.getTotalRouteCost = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += parseFloat($scope.route[i].totalCost);

        _trip.totalCost = total.toFixed(2);

        return _trip.totalCost;
    }

    $scope.getTripLength = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += parseInt($scope.route[i].nights);

        _trip.numberOfNights = total;

        return _trip.numberOfNights;
    }

    $scope.getNumberOfStops = function () {

        _trip.numberOfStops = $scope.route.length;

        return _trip.numberOfStops;
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

        for (i = 0; i < $scope.route.length; i++) {

            var child = i + 1;
            var routeItem = $scope.route[i];

            if (i == 0) {
                routeItem.stop = 'Start';
                routeItem.stopNumberDivClass = 'startCircle';
                routeItem.stopNumberSpanClass = 'startEndCircleText';
                routeItem.options.labelClass = 'markerLabelStartStyle';
                routeItem.icon = CONFIG.START_MARKER_ICON;
            }
            else if (i == $scope.route.length - 1) {
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

        PolyPathService.MendPolyLines($scope.PolyLines, $scope.route, fromIndex, toIndex);
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
        $scope.route = [];
        $scope.PolyLines = [];
    };

    /* MODAL */

    $scope.Email = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'sendEmailModal.html',
            controller: 'SendEmailModalCtrl',
            size: size,
            resolve: {
                route: function () {
                    return $scope.route;
                }
            }
        });
    };

    $scope.Reset = function (size) {

        $uibModal.open({
            animation: true,
            templateUrl: 'resetModalTemplate.html',
            controller: 'resetModalCtrl',
            size: size,
            resolve: {
                yes: function () {
                    return function () {
                        $scope.route = [];
                        $scope.PolyLines = [];
                    }
                }
            }
        });
    };

    $scope.SaveTrip = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'saveTripModal.html',
            controller: 'SaveTripModalCtrl',
            size: size,
            resolve: {
                saveDataLocally: function () {
                    return _saveDataLocally;
                },
                saveDataRemotely: function () {
                    return _saveDataRemotely;
                },
                authenticate: function () {
                    return IsAuthenticated;
                }
            }
        });
    };

    function OpenRouteLengthExceeded(size) {

        $uibModal.open({
            animation: true,
            templateUrl: 'routeLengthExceededModalTemplate.html',
            controller: 'routeLengthExceededModalCtrl',
            size: size,
            resolve: {
                maxLocations: function () {
                    return $scope.MaxLocations;
                }
            }
        });
    }
});

// to do: change to $http service
travelToolApp.controller('SendEmailModalCtrl', function ($scope, $modalInstance, route) {

    $scope.ContactDetails = { details: { Email: "" } };
    $scope.route = route;
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
            data: { address: $scope.ContactDetails.details.Email, routeData: angular.toJson($scope.route) }
        }).done(function () {
            $scope.$apply(function () {
                $scope.showEmailError = false;
            });
            $modalInstance.close();
        }).
        fail(function (jqXHR, textStatus, error) {
            $scope.$apply(function () {
                $scope.showEmailError = true;
            });

        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('resetModalCtrl', function ($scope, $modalInstance, yes) {

    $scope.yes = function () {
        yes();
        $modalInstance.dismiss('cancel');
    };

    $scope.no = function () {
        $modalInstance.dismiss('cancel');
    };
});

travelToolApp.controller('routeLengthExceededModalCtrl', function ($scope, $modalInstance, maxLocations) {

    $scope.MaxLocations = maxLocations;

    $scope.ok = function () {
        $modalInstance.dismiss('cancel');
    };

});

travelToolApp.controller('SaveTripModalCtrl', function ($scope, $modalInstance, saveDataLocally, saveDataRemotely, authenticate) {

    var progressBarTypes = ['danger', 'info', 'warning', 'success'];
    var isUserLoggedIn = authenticate();

    isUserLoggedIn.then(function (response) {

        if (response.data != 1) {
            $modalInstance.dismiss('cancel');
            saveDataLocally();
        }
        else {

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
        $modalInstance.dismiss('cancel');
    };
});

travelTool.shared.controllers.newTripCtrl.$inject = ['$scope', '$uibModal'];
travelToolApp.controller('NewTripCtrl', travelTool.shared.controllers.newTripCtrl);

travelTool.shared.controllers.newTripModalCtrl.$inject = ['$scope', '$modalInstance', '$http'];
travelToolApp.controller('NewTripModalCtrl', travelTool.shared.controllers.newTripModalCtrl);

// Register Directives

travelTool.shared.directives.UniqueTripName.$inject = ['$http', '$q', 'CONFIG'];
travelToolApp.directive('uniqueTripName', travelTool.shared.directives.UniqueTripName);