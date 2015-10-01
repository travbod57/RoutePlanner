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
        $(element[0]).sortable({
            items: 'tr',
            start: function (event, ui) {

                // align the placeholder with the size of the list item
                ui.placeholder.height(ui.item.height());

                // on start we define where the item is dragged from
                startIndex = ($(ui.item).index());
            },
            stop: function (event, ui) {

                // on stop we determine the new index of the
                // item and store it there
                var newIndex = ($(ui.item).index());

                // assuiming the item in the list actually moved somewhere
                if (startIndex != newIndex) {
                    var toMove = toUpdate[startIndex];
                    toUpdate.splice(startIndex, 1);
                    toUpdate.splice(newIndex, 0, toMove);

                    // to cater for drag up or down the list
                    // start renumber from lowest positioned item in list, either start position or final position
                    var indexToRenumberFrom = (startIndex < newIndex) ? startIndex : newIndex;
                    scope.UpdateStopNumbering(indexToRenumberFrom);
                    
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