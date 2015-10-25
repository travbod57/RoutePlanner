
app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal) {

    uiGmapGoogleMapApi.then(function (maps) {

        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2 } };

    });

    $scope.init = function () {

        //$scope.startDate = moment().format("DD-MMM-YYYY"); //new Date();
    }

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
    $scope.init();

    $scope.ChosenDestination;
    $scope.SelectedRouteStop;

    $scope.destinations = [];

    $scope.CurrencyDropdownValues = [{
        id: 1,
        label: 'GBP',
        symbol: '£'
    }, {
        id: 2,
        label: 'USD',
        symbol: '$'
    },
    //{
    //    id: 3,
    //    label: 'EURO',
    //    symbol: '&euro;'
    //}
    ];

    $scope.SelectedCurrencyDropdownValue = $scope.CurrencyDropdownValues[0];


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

    $scope.getDestinationsAsync = function (searchTerm) {

        return $http.get('http://www.rtwpricetag.com/Slim/destination/' + searchTerm)
        .then(function (response) {
            console.log(response.data);
            return response.data;
        });
    };

    $scope.startDate;

    $scope.$watch('startDate', function (newValue, oldValue) {
        console.log('oldValue=' + oldValue);
        console.log('newValue=' + newValue);
    });

    $scope.route = [];
    $scope.PolyLines = [];

    $scope.HasRoute = function () {
        return $scope.route.length > 0 ? true : false;
    }

    $scope.HasStartDate = function () {
        return $scope.startDate !== undefined ? true : false;
    }

    $scope.ShowTotalCost = function () {
        return $scope.HasRoute;
    }

    $scope.ShowReturnDate = function () {
        return $scope.HasRoute && $scope.HasStartDate;
    }

    $scope.ReturnDate = function () {
        
        if ($scope.startDate != undefined) {
            var returnDate = new Date($scope.startDate);
            return moment(returnDate.setDate(returnDate.getDate() + $scope.getTripLength())).format("DD-MMM-YYYY (ddd)");
        }
        else
            return "Please enter a start date";
        //return $filter('date')(returnDate, 'fullDate');
    }

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

    $scope.UpdateStopNumbering = function (indexToRenumberFrom) {

        for (i = indexToRenumberFrom; i < $scope.route.length; i++) {
            $scope.route[i].stop = i + 1;
            //$("#routeTable tbody tr:nth-child(" + (i + 1) + ") td:first").find("div").addClass("numberCircle").find("span").addClass("numberCircleText");
        }

        //for (i = 0; i < $scope.route.length; i++) {

        //    if (i == 0)
        //        $scope.route[i].stop = 'Start';
        //    else if (i == $scope.route.length - 1)
        //        $scope.route[i].stop = 'End';
        //    else {
        //        //$("#routeTable tbody tr:nth-child(" + (i + 1) + ") td:first").find("div").addClass("numberCircle").find("span").addClass("numberCircleText");
        //        $scope.route[i].stop = i;
        //    }
        //}
    }

    $scope.SwitchRoute = function (fromIndex, toIndex) {

        PolyPathService.MendPolyLines($scope.PolyLines, $scope.route, fromIndex, toIndex);
    }

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

    $scope.onMarkerClick = function (model) {
        model.show = !model.show;
    };

    $scope.Choose = function () {

        if ($scope.ChosenDestination !== undefined) {
            $scope.route.push({
                id: $scope.ChosenDestination.Id,
                destination: $scope.ChosenDestination,
                coords : {
                    latitude: $scope.ChosenDestination.Latitude,
                    longitude: $scope.ChosenDestination.Longitude
                },
                options: {
                    //animation: google.maps.Animation.DROP
                },
                nights: 0,
                transport: 'Air',
                get totalCost() { return this.destination.DailyCost * this.nights; },
            });

            if ($scope.route.length > 1)
            {
                var prevRoute = $scope.route[$scope.route.length - 2];
                PolyPathService.CreateNewPolyLine($scope.PolyLines, $scope.ChosenDestination, prevRoute);
            }

            $scope.UpdateStopNumbering($scope.route.length - 1);
            
            $scope.ChosenDestination = undefined;
        }
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

    $scope.OnChangeTransport = function (val) {
        
        if (val.item.stop > 0 && $scope.PolyLines.length >= val.item.stop) {
            var polyPath = $scope.PolyLines[val.item.stop - 1];

            PolyPathService.UpdateStrokeColour(val.item.transport, polyPath);
        }
    }

    $scope.Remove = function (destination) {

        var isFirstStop = destination.stop == 1;
        var isSecondStop = destination.stop == 2;
        var isLastDestination = destination.stop == $scope.route.length;

        // remove from route array
        $scope.route.splice(destination.stop - 1, 1);

        if (isFirstStop) {
            $scope.PolyLines.splice(0, 1); // remove first
        }
        else if (isLastDestination) {
            $scope.PolyLines.splice(destination.stop - 2, 1); // remove last
        }
        else if (isSecondStop) {
            var nextPolyPath = $scope.PolyLines[destination.stop - 1];
            nextPolyPath.path[0].longitude = $scope.PolyLines[0].path[0].longitude;
            nextPolyPath.path[0].latitude = $scope.PolyLines[0].path[0].latitude;

            var prevDestination = $scope.route[destination.stop - 2];

            PolyPathService.UpdateStrokeColour(prevDestination.transport, nextPolyPath);

            $scope.PolyLines.splice(0, 1); // remove first
        }
        else
        {
            var prevPolyPath = $scope.PolyLines[destination.stop - 3];
            var nextPolyPath = $scope.PolyLines[destination.stop - 1];

            nextPolyPath.path[0].longitude = prevPolyPath.path[1].longitude;
            nextPolyPath.path[0].latitude = prevPolyPath.path[1].latitude;

            var prevDestination = $scope.route[destination.stop - 2];

            PolyPathService.UpdateStrokeColour(prevDestination.transport, nextPolyPath);

            // remove poly line
            $scope.PolyLines.splice(destination.stop - 2, 1);
        }

        $scope.UpdateStopNumbering(destination.stop - 1);
    }


    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
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