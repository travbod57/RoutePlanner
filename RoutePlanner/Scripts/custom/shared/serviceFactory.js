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

})(travelTool.shared.services)