﻿// directive for a single list
travelToolApp.directive('dndList', function () {

    return function (scope, element, attrs) {

        // variables used for dnd
        var toUpdate;
        var startIndex = -1;

        // watch the model, so we always know what element
        // is at a specific position
        scope.$watch(attrs.dndList, function (value) {
            toUpdate = value;
        }, true);

        // use jquery to make the element sortable (dnd). This is called
        // when the element is rendered
        jQuery(element[0]).sortable({
            items: 'tr',
            start: function (event, ui) {

                // align the placeholder with the size of the list item
                ui.placeholder.height(ui.item.height());

                // on start we define where the item is dragged from
                startIndex = (jQuery(ui.item).index());
            },
            stop: function (event, ui) {

                // on stop we determine the new index of the
                // item and store it there
                var newIndex = (jQuery(ui.item).index());

                // assuiming the item in the list actually moved somewhere
                if (startIndex != newIndex) {
                    var toMove = toUpdate[startIndex];
                    toUpdate.splice(startIndex, 1);
                    toUpdate.splice(newIndex, 0, toMove);

                    // to cater for drag up or down the list
                    // start renumber from lowest positioned item in list, either start position or final position
                    scope.UpdateStopNumbering();

                    // change the Route lines
                    scope.SwitchRoute(startIndex, newIndex);

                    // we move items in the array, if we want
                    // to trigger an update in angular use $apply()
                    // since we're outside angulars lifecycle
                    scope.$apply(scope.route);
                }
            },
            axis: 'y'
        });
    }
});

travelToolApp.directive('inputGroupBtnClick', function () {

    var linkFn = function link(scope, element, attrs) {

        element.keypress(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                scope.Choose();
                scope.$apply();
            }
        });

    };

    return {
        restrict: 'A',
        link: linkFn
    }
});

travelToolApp.directive('int', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {

            //format text going to user (model to view)
            ngModel.$formatters.push(function (value) {
                return parseInt(value, 10);
            });

            //format text from the user (view to model)
            ngModel.$parsers.push(function (value) {
                return value.toString();
            });
        }
    }
});

//travelToolApp.directive('float', function () {
//    return {
//        restrict: 'A',
//        require: 'ngModel',
//        link: function (scope, element, attrs, ngModel) {

//            //format text going to user (model to view)
//            ngModel.$formatters.push(function (value) {
//                return parseFloat(value).toFixed(2);
//            });

//            //format text from the user (view to model)
//            ngModel.$parsers.push(function (value) {
//                return value.toString();
//            });
//        }
//    }
//});


