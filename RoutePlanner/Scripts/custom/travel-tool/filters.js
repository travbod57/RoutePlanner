travelToolApp.filter('displayReturnDateFilter', function ($filter) {
    return function (tripLength, scope) {

        if (scope.startDate != "" && scope.startDate != undefined)
            return moment(scope.startDate).add(tripLength, 'Days').format("DD-MMM-YYYY (ddd)");
        else
            return "Please enter a start date";
    };
})


travelToolApp.filter('float', function () {
    return function (input) {
        return parseFloat(input).toFixed(2);
    };
});

travelToolApp.filter('int', function () {
    return function (input) {
        return parseInt(input, 10);
    };
});