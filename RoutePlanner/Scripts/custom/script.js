$(function () { //run when the DOM is ready


    $(document).on("click", ".clickable", function () {
        $(".clickable").removeClass("active")
        $(this).addClass("active"); //add the class to the clicked element
    });

});