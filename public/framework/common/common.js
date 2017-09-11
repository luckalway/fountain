$(document).ready(function() {
	$.fn.editable.defaults.mode = 'inline';
	$.fn.editable.defaults.ajaxOptions = {type: "PUT"};
	
	$('.editable').editable();

	$(".date").datepicker({
		dateFormat : "yy-mm-dd"
	});

});
