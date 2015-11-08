app.filter('displayReturnDateFilter', function ($filter) {
    return function (tripLength, scope) {

        if (scope.startDate != "" && scope.startDate != undefined)
            return moment(jQuery("#startDate").datepicker('getDate')).add(tripLength, 'Days').format("DD-MMM-YYYY (ddd)");
        else
            return "Please enter a start date";
    };
})