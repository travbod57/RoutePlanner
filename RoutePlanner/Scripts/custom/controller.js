app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal) {

    uiGmapGoogleMapApi.then(function (maps) {
        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };
    });

    $scope.ChosenDestination;
    $scope.SelectedRouteStop;
    $scope.destinations = [];
    $scope.startDate;
    $scope.route = [];
    $scope.PolyLines = [];

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

            $scope.route.push({
                id: $scope.ChosenDestination.Id,
                destination: $scope.ChosenDestination,
                coords: {
                    latitude: $scope.ChosenDestination.Latitude,
                    longitude: $scope.ChosenDestination.Longitude
                },
                options: {
                    //labelAnchor: '15 0'
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
        
        if ($scope.startDate != undefined)
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
        return $scope.route.length;
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
            if (i == 0) {
                $scope.route[i].stop = 'Start';
                $scope.route[i].stopNumberDivClass = 'startCircle';
                $scope.route[i].stopNumberSpanClass = 'startEndCircleText';
                //$scope.route[i].options.labelClass = 'markerLabelStartStyle';
            }
            else if (i == $scope.route.length - 1) {
                $scope.route[i].stop = 'End';
                $scope.route[i].stopNumberDivClass = 'endCircle';
                $scope.route[i].stopNumberSpanClass = 'startEndCircleText';
                //$scope.route[i].options.labelClass = 'markerLabelEndStyle';
            }
            else {
                $scope.route[i].stop = i;
                $scope.route[i].stopNumberDivClass = 'numberCircle';
                $scope.route[i].stopNumberSpanClass = 'numberCircleText';
                //$scope.route[i].options.labelClass = 'markerLabelNumberStyle';
            }

            //$scope.route[i].options.labelContent = $scope.route[i].stop;
            //$scope.route[i].options.labelInBackground = true;
        }
    }

    $scope.SwitchRoute = function (fromIndex, toIndex) {

        PolyPathService.MendPolyLines($scope.PolyLines, $scope.route, fromIndex, toIndex);
    }

    $scope.onMarkerClick = function (model) {
        model.show = !model.show;
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

    /* MODAL */

    $scope.open = function (size) {

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

});

app.controller('SendEmailModalCtrl', function ($scope, $modalInstance, route) {

    $scope.ContactDetails = { details: { Email: "" }};
    $scope.route = route;
    $scope.ok = function () {

        $.ajax({
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