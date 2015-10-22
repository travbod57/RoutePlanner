
app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, PolyPathService, $uibModal) {

    uiGmapGoogleMapApi.then(function (maps) {

        $scope.map = { center: { latitude: 15, longitude: 0 }, zoom: 2, options: { minZoom: 2} };

    });

    $scope.init = function () {

        $scope.startDate = moment().format("DD-MMM-YYYY"); //new Date();
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
        var returnDate = new Date();
        //returnDate.setDate($scope.startDate.getDate() + $scope.getTripLength());

        return $filter('date')(returnDate, 'fullDate');
    }

    $scope.AddDays = function (e) {
        $scope.SelectedRouteStop.days++;
        $scope.SelectedRouteStop.totalCost = $scope.SelectedRouteStop.days
    };

    $scope.SubtractDays = function (e) {

        if ($scope.SelectedRouteStop.days > 0)
            $scope.SelectedRouteStop.days--;
    };

    $scope.TrackSelectedRouteStop = function (routeItem) {
        $scope.SelectedRouteStop = routeItem.destination;
    }

    $scope.UpdateStopNumbering = function (indexToRenumberFrom) {

        for (i = indexToRenumberFrom; i < $scope.route.length; i++) {
            $scope.route[i].stop = i + 1;
        }
    }

    $scope.SwitchRoute = function (fromIndex, toIndex) {

        PolyPathService.MendPolyLines($scope.PolyLines, $scope.route, fromIndex, toIndex);
    }

    $scope.open = function (size) {

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            size: size,
            resolve: {
                route: function () {
                    return $scope.route;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
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
                days: 0,
                transport: 'Air',
                get totalCost() { return this.destination.DailyCost * this.days; },
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
            total += $scope.route[i].days;

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

app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, route) {

    $scope.ContactDetails = { details: { Email: "" }};

    $scope.route = route;
    $scope.ok = function () {

        $.ajax({
            url: "/RoutePlanner/Home/MockSendEmail",
            type: "GET"
        }).done(function () {
            alert('done');
            // send email by calling SLIM
        }).
        fail(function () {
            alert('fail');
        });

        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});