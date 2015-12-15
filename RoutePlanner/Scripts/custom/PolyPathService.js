app.service('PolyPathService', ['$log', function ($log) {

    var polyLineCount = 0;

    function CreateNewPolyLine(polyLines, currentRoute, previousRoute) {

        var polyLineNumber = ++polyLineCount;
        var polyLine = {
            id: "polyPath" + polyLineNumber,
            path: [{
                latitude: previousRoute.coords.latitude,
                longitude: previousRoute.coords.longitude
            },
                {
                    latitude: currentRoute.Latitude,
                    longitude: currentRoute.Longitude
                }],
            routeName: {
                prev: previousRoute.location.Name,
                current: currentRoute.Name
            },
            stroke: {},
            editable: true,
            draggable: true,
            geodesic: true,
            visible: true
        };

        UpdateStrokeColour(previousRoute.transport, polyLine);

        polyLines.push(polyLine);

        return polyLine;
    }

    function UpdateStrokeColour(transport, polyLine) {
        if (transport == "Air")
            polyLine.stroke = { color: '#6060FB', weight: 3 };
        else if (transport == "Land")
            polyLine.stroke = { color: '#000000', weight: 3 };
        else if (transport == "Sea")
            polyLine.stroke = { color: '#cb2d22', weight: 3 };
    }

    function MendPolyLines(polyLines, routes, from, to) {

        var isSwitchingLastRoute = (from == routes.length - 1) || (to == routes.length - 1);

        var loopFrom = (from < to ? from : to) - 1;
        var loopTo = (to > from ? to : from);

        loopTo += isSwitchingLastRoute ? -1 : 0;

        if (loopFrom == -1) loopFrom += 1;

        for (i = loopFrom; i <= loopTo; i++) {

            polyLines[i].path[0].latitude = routes[i].coords.latitude;
            polyLines[i].path[0].longitude = routes[i].coords.longitude;
            polyLines[i].routeName.prev = routes[i].location.Name;

            polyLines[i].path[1].latitude = routes[i + 1].coords.latitude;
            polyLines[i].path[1].longitude = routes[i + 1].coords.longitude;
            polyLines[i].routeName.current = routes[i + 1].location.Name;

            UpdateStrokeColour(routes[i].transport, polyLines[i]);
        }
    }

    return {
        CreateNewPolyLine: CreateNewPolyLine,
        UpdateStrokeColour: UpdateStrokeColour,
        MendPolyLines: MendPolyLines
        // changeTransportType
        // changeOrder
        // remove
    };

}])