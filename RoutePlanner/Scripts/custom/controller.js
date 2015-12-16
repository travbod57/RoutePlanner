app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal, $window, $localStorage, $sessionStorage, CONFIG) {

    uiGmapGoogleMapApi.then(function (maps) {
        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };
    });

    var trip = {};

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

    $scope.Save = function () {

        var isUserLoggedIn = IsAuthenticated();

        isUserLoggedIn.then(function (response) {

            if (response.data != 1) {

                $scope.$storage['route'] = angular.toJson($scope.route);
                $scope.$storage['polyLines'] = angular.toJson($scope.PolyLines);

                trip.route = angular.toJson($scope.route);
                trip.polyLines = angular.toJson($scope.PolyLines);
                trip.startDate = startDate;

                $scope.$storage['trip'] = trip;

                $scope.ShowLoginDialog = true;
            }
            else {
                $scope.$storage['trip'] = undefined;

                trip.id = 1;
                trip.startDate = moment($scope.startDate).format("YYYY-MM-DD");
                trip.currencyId = $scope.SelectedCurrencyDropdownValue.id;

                jQuery.ajax({
                    url: CONFIG.SAVE_ROUTE_URL,
                    type: "POST",
                    dataType: "text",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    transformRequest: function (obj) {
                        var str = [];
                        for (var p in obj)
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        return str.join("&");
                    },
                    data: { routeData: angular.toJson($scope.route), tripData: angular.toJson(trip) }
                }).done(function () {
                    alert("ROUTE SAVED");
                }).
                fail(function (jqXHR, textStatus, error) {
                    alert("ROUTE SAVED FAILED");
                });
            }

        }, function errorCallback(response) {
            alert("ERROR");
        });

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
    };

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
                transport: 'Air',
                transportId: 1,
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

            PolyPathService.UpdateStrokeColour(prevLocation.transport, nextPolyPath);

            $scope.PolyLines.splice(0, 1); // remove first
        }
        else {
            var prevPolyPath = $scope.PolyLines[index - 2];
            var nextPolyPath = $scope.PolyLines[index];

            nextPolyPath.path[0].longitude = prevPolyPath.path[1].longitude;
            nextPolyPath.path[0].latitude = prevPolyPath.path[1].latitude;

            var prevLocation = $scope.route[index - 1];

            PolyPathService.UpdateStrokeColour(prevLocation.transport, nextPolyPath);

            // remove poly line
            $scope.PolyLines.splice(index - 1, 1);
        }

        $scope.UpdateStopNumbering();
    }

    function IsAuthenticated() {

        return $http.get(CONFIG.IS_AUTHENTICATED_URL);
    }

    function InitialiseTrip() {

        $scope.CurrencyDropdownValues = [{ id: 1, label: 'POUND', symbol: '£' }, { id: 2, label: 'DOLLAR', symbol: '$'},{ id: 3, label: 'EURO', symbol: '€'},{ id: 4, label: "YEN", symbol: '¥'}];

        //$http.get(CONFIG.GET_TRIP_URL, {
        //    params: {
        //        tripId: 1
        //    }
        //}).then(function (response) {

        //    // retrieve from database
        //    $scope.trip = response.data.Trip;

        //    var lookup = {};
        //    for (var i = 0, len = $scope.CurrencyDropdownValues.length; i < len; i++) {
        //        lookup[$scope.CurrencyDropdownValues[i].id] = $scope.CurrencyDropdownValues[i];
        //    }

        //    $scope.SelectedCurrencyDropdownValue = lookup[$scope.trip.CurrencyId];

        //    $scope.route = response.data.Route;
        //    $scope.UpdateStopNumbering();

        //    if ($scope.route.length > 1) {
        //        for (var i = 1; i < $scope.route.length; i++) {
        //            CreatePolyLine($scope.route[i].location);
        //        }
        //    }

        //}, function errorCallback(response) {

        //    // if not logged into WordPress then use Session Storage
        //    if (response.status == '401') {

        //        var sessionData = $scope.$storage['trip'];

        //        if (sessionData != undefined) {
        //            $scope.route = angular.fromJson(sessionData.route);
        //            $scope.PolyLines = angular.fromJson(sessionData.polyLines);
        //            //$scope.startDate = sessionData.startDate;
        //        }
        //        else
        //        {
        //            // load page for first time use
        //            $scope.SelectedCurrencyDropdownValue = $scope.CurrencyDropdownValues[0];
        //        }
        //    }
        //});
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

        if ($scope.startDate != '' && $scope.startDate != undefined)
        {
            var returnDate = moment(jQuery("#startDate").datepicker('getDate')).add($scope.getTripLength(), 'Days');
            trip.endDate = returnDate.format("YYYY-MM-DD");
            return returnDate.format("DD-MMM-YYYY (ddd)");
        }  
        else
            return "Please enter a start date";
    }

    $scope.getTotalRouteCost = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += parseFloat($scope.route[i].totalCost);

        trip.totalCost = total.toFixed(2);

        return trip.totalCost;
    }

    $scope.getTripLength = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += parseInt($scope.route[i].nights);

        trip.numberOfNights = total;

        return trip.numberOfNights;
    }

    $scope.getNumberOfStops = function () {

        trip.numberOfStops = $scope.route.length;

        return trip.numberOfStops;
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
        routeItem.totalCost = (routeItem.nights * routeItem.location.DailyCost).toFixed(2);
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

            PolyPathService.UpdateStrokeColour(val.item.transport, polyPath);
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
app.controller('SendEmailModalCtrl', function ($scope, $modalInstance, route) {

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

app.controller('resetModalCtrl', function ($scope, $modalInstance, yes) {

    $scope.yes = function () {
        yes();
        $modalInstance.dismiss('cancel');
    };

    $scope.no = function () {
        $modalInstance.dismiss('cancel');
    };
});

app.controller('routeLengthExceededModalCtrl', function ($scope, $modalInstance, maxLocations) {

    $scope.MaxLocations = maxLocations;

    $scope.ok = function () {
        $modalInstance.dismiss('cancel');
    };

});