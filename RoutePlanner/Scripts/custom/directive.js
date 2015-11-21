// directive for a single list
app.directive('dndList', function () {

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

app.directive('datepicker', function () {

    var linkFn = function link(scope, element, attrs) {
        element.datepicker({
            format: "dd-M-yyyy",
            clearBtn: true,
            autoclose: true,
            todayHighlight: true
        }).on('clearDate', function (e) {

            scope.$apply();
        });
    };

    return {
        restrict: 'A',
        link : linkFn
    }
});

app.directive('inputGroupBtnClick', function () {

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

app.directive("loginModalShow", function ($window) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {

            scope.Register = function() {
                $window.location.href = 'index.php?page_id=752';
            }

            scope.Login = function () {
                $window.location.href = 'index.php?page_id=750';
            }

            //Hide or show the modal
            scope.showModal = function (visible) {
                if (visible) {
                    element.modal("show");
                }
                else {
                    element.modal("hide");
                }
            }

            //Check to see if the modal-visible attribute exists
            if (!jQuery("body").hasClass("logged-in")) {

                //The attribute isn't defined, show the modal by default
                scope.showModal(true);

            }
            else {

                //Watch for changes to the modal-visible attribute
                scope.$watch("modalVisible", function (newValue, oldValue) {
                    scope.showModal(newValue);
                });

                //Update the visible value when the dialog is closed through UI actions (Ok, cancel, etc.)
                element.bind("hide.bs.modal", function () {
                    scope.modalVisible = false;
                    if (!scope.$$phase && !scope.$root.$$phase)
                        scope.$apply();
                });

            }

        }
    };

});