
app.controller("routePlannerCtrl", function ($scope, $filter, $http, $log, uiGmapGoogleMapApi, myHttpService, PolyPathService) {

    uiGmapGoogleMapApi.then(function (maps) {

        $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 2 };

    });

    $scope.init = function () {

        $http.get('http://localhost:81/Slim/destinations')
        .then(function (response) {
            $scope.destinations = [];
            $scope.destinations.push.apply($scope.destinations, response.data);
        });

    }

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


        //alert(JSON.stringify($scope.route));
        //$httpPromise = myHttpService.postDetails2(angular.toJson($scope.route));

        //$httpPromise.then(
        //function(payload) { 
        // alert(payload.data);
        //},
        //function(errorPayload) {
        // $log.error('failure loading movie', errorPayload);
        // });
    };

    $scope.getDestinationsAsync = function (searchTerm) {

        return $http.get('http://www.rtwpricetag.com/Slim/destination/' + searchTerm)
        .then(function (response) {
            console.log(response.data);
            return response.data;
        });
    };

    $scope.route = [];
    $scope.polyPath = [];

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
        returnDate.setDate($scope.startDate.getDate() + $scope.getTripLength());

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

    function arraymove(arr, fromIndex, toIndex) {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }

    $scope.SwitchRoute = function (fromIndex, toIndex) {
        arraymove($scope.polyPath, fromIndex, toIndex);
    }
    var polyLineCount = 0;
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
              
                var stroke;

                if (prevRoute.transport == "Air")
                    stroke = { color: '#6060FB', weight: 3 };
                else if (prevRoute.transport == "Land")
                    stroke = { color: '#000000', weight: 3 };
                else if (prevRoute.transport == "Sea")
                    stroke = { color: '#F6F6F6', weight: 3 };

                var polyLineNumber = ++polyLineCount;
                var polyLine = {
                    id: "polyPath" + polyLineNumber,
                    path: [{
                        latitude: prevRoute.coords.latitude,
                        longitude: prevRoute.coords.longitude
                    },
                    {
                        latitude: $scope.ChosenDestination.Latitude,
                        longitude: $scope.ChosenDestination.Longitude
                    }],
                    stroke: stroke,
                    editable: true,
                    draggable: true,
                    geodesic: true,
                    visible: true
                };


                $scope.polyPath.push(polyLine);



                //var newPolyLine = PolyPathService.CreateNewPolyLine($scope.polyPath, prevRoute.transport);
                
                //newPolyLine.path.push();
                
                //newPolyLine.path.push({
                //    latitude: $scope.ChosenDestination.Latitude,
                //    longitude: $scope.ChosenDestination.Longitude
                //});

                //$scope.polyPath[0].path.push(
                //{
                //    latitude: $scope.ChosenDestination.Latitude,
                //    longitude: $scope.ChosenDestination.Longitude
                //});
            }
            else
            {
                //var newPolyLine = PolyPathService.CreateNewPolyLine($scope.polyPath, 'Air');

                //newPolyLine.path.push({
                //    latitude: $scope.ChosenDestination.Latitude,
                //    longitude: $scope.ChosenDestination.Longitude
                //});

                //$scope.polyPath.push({
                //    id: 1,
                //    path: [
                //        {
                //            latitude: $scope.ChosenDestination.Latitude,
                //            longitude: $scope.ChosenDestination.Longitude
                //        }
                //    ],
                //    stroke: {
                //        color: '#6060FB',
                //        weight: 3
                //    },
                //    editable: true,
                //    draggable: true,
                //    geodesic: true,
                //    visible: true
                //});
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

    $scope.Remove = function (stop) {
        $scope.route.splice(stop.stop - 1, 1);
        $scope.UpdateStopNumbering(stop.stop - 1);
    }




    $scope.today = function () {
        $scope.startDate = new Date();
    };
    $scope.today();

    $scope.clear = function () {
        $scope.startDate = null;
    };

    // Disable weekend selection
    $scope.disabled = function (date, mode) {
        return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
    };

    $scope.toggleMin = function () {
        $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

    $scope.$watch("SelectedRouteStop", function (value) {
        //console.log("Route: " + value.map(function(e) {

        //return e.days
        //}).join(','));

        //console.log($scope.SelectedRouteStop.name);
    }, true);



    // watch, use 'true' to also receive updates when values
    // change, instead of just the reference
    $scope.$watch("route", function (value) {
        //console.log("Route: " + value.map(function(e) {

        //return e.days
        //}).join(','));

    }, true);


});

app.factory("myHttpService", function ($http) {
    return {
        postDetails: function (data) {
            return $http.post('http://localhost:81/Slim/test', data, { "headers": { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" } });
        },
        postDetails2: function (data) {
            return $http.post('http://localhost:81/Slim/test', { "routeData": data }, { "headers": { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" } });
        }
    }
});



// transforms the request into name value pairs
angular.module('routePlanner').config(function ($httpProvider) {
    //$httpProvider.defaults.transformRequest = function (data) {
    //   var str = [];
    // for (var p in data) {
    //   data[p] !== undefined && str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
    //}
    //return str.join('&');
    //  };


    //$httpProvider.defaults.headers.put['Content-Type'] = $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
});
