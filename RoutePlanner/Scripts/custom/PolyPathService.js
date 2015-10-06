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

    function UpdateStrokeColour(transport, polyLine)
    {
        if (transport == "Air")
            polyLine.stroke = { color: '#6060FB', weight: 3 };
        else if (transport == "Land")
            polyLine.stroke = { color: '#000000', weight: 3 };
        else if (transport == "Sea")
            polyLine.stroke = { color: '#F6F6F6', weight: 3 };
    }


    return {
        CreateNewPolyLine: CreateNewPolyLine,
        UpdateStrokeColour: UpdateStrokeColour
        // changeTransportType
        // changeOrder
        // remove
    };

}])