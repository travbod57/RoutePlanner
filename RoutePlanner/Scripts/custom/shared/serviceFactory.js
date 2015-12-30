(function (services) {

    services.utils = function () {

        var _getQueryStringParameterByName = function (name) {

            var regexS = "[\\?&]" + name + "=([^&#]*)",
            regex = new RegExp(regexS),
            results = regex.exec(window.location.search);

            if (results == null) {
                return "";
            } else {
                return decodeURIComponent(results[1].replace(/\+/g, " "));
            }
        };

        return {
            getQueryStringParameterByName: _getQueryStringParameterByName
        };

    };

    services.underscore = function ($window) {
        return $window._; // assumes underscore has already been loaded on the page
    };

})(travelTool.shared.services)