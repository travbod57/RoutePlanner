app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal, $window, $localStorage, $sessionStorage) {

    uiGmapGoogleMapApi.then(function (maps) {
        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };
    });

    $scope.ChosenDestination;
    $scope.SelectedRouteStop;
    $scope.startDate;
    $scope.MaxDestinations = 50;
    $scope.ShowLoginDialog = false;
    $scope.$storage = $sessionStorage;
    $scope.route = [];
    $scope.PolyLines = [];
    
    var sessionData = $scope.$storage['myTrip'];

    if (sessionData != undefined)
    {
        $scope.route = angular.fromJson(sessionData.route);
        $scope.PolyLines = angular.fromJson(sessionData.polyLines);
        //$scope.startDate = sessionData.startDate;
    }

    $scope.CurrencyDropdownValues = [{
        id: 1,
        label: 'POUND',
        symbol: '£'
    }, {
        id: 2,
        label: 'DOLLAR',
        symbol: '$'
    },
    {
        id: 3,
        label: 'EURO',
        symbol: '€'
    },
    {
        id: 4,
        label: "YEN",
        symbol: '¥'
    }
    ];

    $scope.SelectedCurrencyDropdownValue = $scope.CurrencyDropdownValues[0];

    /* ACTIONS */

    $scope.save = function () {

        $http({
            method: 'POST',
            url: "http://localhost:81/Slim/saveRoute",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: { routeData: angular.toJson($scope.route) }
        }).then(function (response) {
            alert("this callback will be called asynchronously");
            // this callback will be called asynchronously
            // when the response is available
        }, function (response) {
            alert(response + "called asynchronously if an error occurs");
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.Choose = function () {

        if ($scope.ChosenDestination !== undefined) {

            if (($scope.route.length - 1) == $scope.MaxDestinations) {
                OpenRouteLengthExceeded('lg');
            }
            else {

                $scope.route.push({
                    id: $scope.ChosenDestination.Id,
                    destination: $scope.ChosenDestination,
                    coords: {
                        latitude: $scope.ChosenDestination.Latitude,
                        longitude: $scope.ChosenDestination.Longitude
                    },
                    options: {
                        labelAnchor: '15 45'
                        //animation: google.maps.Animation.DROP
                    },
                    nights: 0,
                    transport: 'Air',
                    get totalCost() { return this.destination.DailyCost * this.nights; },
                    stopNumberDivClass: '',
                    stopNumberSpanClass: ''
                });

                if ($scope.route.length > 1) {
                    var prevRoute = $scope.route[$scope.route.length - 2];
                    PolyPathService.CreateNewPolyLine($scope.PolyLines, $scope.ChosenDestination, prevRoute);
                }

                $scope.UpdateStopNumbering();

                $scope.ChosenDestination = undefined;
            }
        }
    }

    $scope.Remove = function (destination) {

        var isFirstStop, isSecondStop, isLastDestination, index;

        if (destination.stop == 'Start') {
            isFirstStop = true;
            index = 0;
        }
        else if (destination.stop == 1) {
            isSecondStop = true;
            index = 1;
        }
        else if (destination.stop == 'End') {
            isLastDestination = true;
            index = $scope.route.length - 1;
        }
        else
            index = destination.stop;

        // remove from route array
        $scope.route.splice(index, 1);

        if (isFirstStop) {
            $scope.PolyLines.splice(0, 1); // remove first
        }
        else if (isLastDestination) {
            $scope.PolyLines.splice(index - 1, 1); // remove last
        }
        else if (isSecondStop) {
            var nextPolyPath = $scope.PolyLines[index];
            nextPolyPath.path[0].longitude = $scope.PolyLines[0].path[0].longitude;
            nextPolyPath.path[0].latitude = $scope.PolyLines[0].path[0].latitude;

            var prevDestination = $scope.route[index - 1];

            PolyPathService.UpdateStrokeColour(prevDestination.transport, nextPolyPath);

            $scope.PolyLines.splice(0, 1); // remove first
        }
        else {
            var prevPolyPath = $scope.PolyLines[index - 2];
            var nextPolyPath = $scope.PolyLines[index];

            nextPolyPath.path[0].longitude = prevPolyPath.path[1].longitude;
            nextPolyPath.path[0].latitude = prevPolyPath.path[1].latitude;

            var prevDestination = $scope.route[index - 1];

            PolyPathService.UpdateStrokeColour(prevDestination.transport, nextPolyPath);

            // remove poly line
            $scope.PolyLines.splice(index - 1, 1);
        }

        $scope.UpdateStopNumbering();
    }

    $scope.Save = function (isUserLoggedIn) {

        if (isUserLoggedIn != 1) {

            $scope.$storage['route'] = angular.toJson($scope.route);
            $scope.$storage['polyLines'] = angular.toJson($scope.PolyLines);

            var myTrip = {
                route: angular.toJson($scope.route),
                polyLines: angular.toJson($scope.PolyLines),
                startDate: startDate
            }

            $scope.$storage['myTrip'] = myTrip;

            $scope.ShowLoginDialog = true;
        }
        else {
            $scope.$storage['myTrip'] = undefined;
            // make ajax request
        }
    }

    /* GETTERS */

    $scope.getLocation = function (val) {
        return $http.get('http://www.thinkbackpacking.com/Slim/asyncDestinations', {
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
            return moment(jQuery("#startDate").datepicker('getDate')).add($scope.getTripLength(), 'Days').format("DD-MMM-YYYY (ddd)");
        else
            return "Please enter a start date";
    }

    $scope.getTotalRouteCost = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += $scope.route[i].totalCost;

        return total;
    }

    $scope.getTripLength = function () {
        var total = 0;

        for (i = 0; i < $scope.route.length; i++)
            total += $scope.route[i].nights;

        return total;
    }

    $scope.getNumberOfStops = function () {

        if ($scope.route.length > 0)
            return $scope.route.length - 1;
        else
            return 0;
    }

    /* FUNCTIONS */

    $scope.AddNights = function (e) {
        $scope.SelectedRouteStop.nights++;
        $scope.SelectedRouteStop.totalCost = $scope.SelectedRouteStop.nights
    };

    $scope.SubtractNights = function (e) {

        if ($scope.SelectedRouteStop.nights > 0)
            $scope.SelectedRouteStop.nights--;
    };

    $scope.TrackSelectedRouteStop = function (routeItem) {
        $scope.SelectedRouteStop = routeItem.destination;
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
                routeItem.icon = "/RoutePlanner/Content/images/markers/map-marker-icon-green-darker.png";
            }
            else if (i == $scope.route.length - 1) {
                routeItem.stop = 'End';
                routeItem.stopNumberDivClass = 'endCircle';
                routeItem.stopNumberSpanClass = 'startEndCircleText';
                routeItem.options.labelClass = 'markerLabelEndStyle';
                routeItem.icon = "/RoutePlanner/Content/images/markers/map-marker-icon-red.png";
            }
            else {
                routeItem.stop = i;
                routeItem.stopNumberDivClass = 'numberCircle';
                routeItem.icon = "/RoutePlanner/Content/images/markers/map-marker-icon-blue-darker.png";

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

    $scope.Register = function () {
        $window.location.href = 'index.php?page_id=743';
    }

    $scope.Login = function () {
        $window.location.href = 'index.php?page_id=741';
    }

    /* MODALS */

    $scope.Email = function (size) {

        $uibModal.open({
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
                maxDestinations: function () {
                    return $scope.MaxDestinations;
                }
            }
        });
    }
});

// to do: change to $http service
app.controller('SendEmailModalCtrl', function ($scope, $modalInstance, route) {

    $scope.ContactDetails = { details: { Email: "" }};
    $scope.route = route;
    $scope.ok = function () {

        jQuery.ajax({
            url: "http://www.thinkbackpacking.com/Slim/sendEmail",
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

app.controller('routeLengthExceededModalCtrl', function ($scope, $modalInstance, maxDestinations) {

    $scope.MaxDestinations = maxDestinations;

    $scope.ok = function () {
        $modalInstance.dismiss('cancel');
    };

});