$(document).ready(function() {
	if($.fn.editable){
		$.fn.editable.defaults.mode = 'inline';
		$.fn.editable.defaults.ajaxOptions = {type: "PUT"};
		
		$('.editable').editable();
	}

	$(".date").datepicker({
		dateFormat : "yy-mm-dd"
	});

});
