app.filter('displayReturnDateFilter', function ($filter) {
    return function (date, scope) {

        if (scope.startDate != "" && scope.startDate != undefined)
            return moment(jQuery("#startDate").datepicker('getDate')).add(scope.getTripLength(), 'Days').format("DD-MMM-YYYY (ddd)");
        else
            return "Please enter a start date";
    };
})