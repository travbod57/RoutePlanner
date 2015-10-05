app.service('PolyPathService', ['$log', function ($log) {

    var polyLineCount = 0;

    function CreateNewPolyLine(polyLines, transport) {
        var stroke;

        if (transport == "Air")
            stroke = { color: '#6060FB', weight: 3 };
        else if (transport == "Land")
            stroke = { color: '#000000', weight: 3 };
        else if (transport == "Sea")
            stroke = { color: '#F6F6F6', weight: 3 };

        var polyLineNumber = ++polyLineCount;
        var polyLine = {
            id: "polyPath" + polyLineNumber,
            path: [],
            stroke: stroke,
            editable: true,
            draggable: true,
            geodesic: true,
            visible: true
        };

        polyLines.push(polyLine);

        return polyLine;
    }

    return {
        CreateNewPolyLine: CreateNewPolyLine
        // changeTransportType
        // changeOrder
        // remove
    };

}])