jQuery(document).ready(function () {
    jQuery("input#startDate").datepicker({
        format: "dd-M-yyyy",
        clearBtn: true,
        autoclose: true,
        todayHighlight: true
    });
});