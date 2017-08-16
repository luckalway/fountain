(function($) {
	var defaults = {
		animateSpeed:'fast'
	};
	
	var getWindowHeight = function() {
		return $(window).height();
	}

	var ElimGallery = function(container) {
		this.container = container;
	};

	ElimGallery.prototype.init = function() {
		var self = this;
		var container = this.container;
		container.tabs();

		var allLiElements = container.find("div li");
		allLiElements.addClass("unfocus");

		allLiElements.mouseover(function() {
			$(this).removeClass("unfocus").addClass("focus");
		});

		allLiElements.mouseout(function() {
			$(this).removeClass("focus").addClass("unfocus");
		});

		allLiElements.click(function() {
			self.openSlider();
		});
	};

	ElimGallery.prototype.openSlider = function() {
		var self = this;

		var sliderContainer = $(".elim-gallery-slider");
		if (sliderContainer.size() == 0) {
			sliderContainer = $('<div class="elim-gallery-slider"></div>');
			$(document.body).append(sliderContainer);
		}
		var activeGalleryId = this.container.find("ul>.ui-tabs-active").attr(
				'aria-controls');
		sliderContainer.empty();
		sliderContainer.height(getWindowHeight());
		var containerInner = $("<ul/>")
		$("#" + activeGalleryId).find("img").each(function(i,element){
			var liElement = $("<li/>")
			var imageElement = $("<img/>");
			imageElement.attr('src',element.src.replace("_160x160.jpg",""));
			imageElement.width(sliderContainer.innerWidth());
			liElement.append(imageElement);
			containerInner.append(liElement);
		});
		sliderContainer.append(containerInner);
		sliderContainer.show();

		if ($(".elim-gallery-cover-shade").size() == 0) {
			$(document.body).append($('<div class="elim-gallery-cover-shade"></div><div class="elim-gallery-close"></div>'));
			$('.elim-gallery-cover-shade').click(function(){
				self.closeSlider();
			});
			$(".elim-gallery-close").click(function(){
				self.closeSlider();
			});
		}
		$(".elim-gallery-cover-shade").show();
		$(".elim-gallery-close").show();
		

		var perMove = getWindowHeight() / 2;

		var lock = false;
		var bottomNone = false;
		$(document.body).mousewheel(function(event, delta, deltaX, deltaY) {
			if (lock)
				return false;

			var animateDone = function() {
				lock = false;
			}

			var containerInner = sliderContainer.children("ul:first");
			if (delta == -1) {
				var top = containerInner.position().top;
				var availableSteps = containerInner.height()-Math.abs(top)-getWindowHeight();
				var moveSteps = availableSteps <= perMove?availableSteps:perMove;
				if(moveSteps <= 0)
					return false;

				lock = true;
				containerInner.animate({
					top : '-=' + moveSteps
				}, defaults.animateSpeed, animateDone);
			} else if (delta == 1) {
				var availableSteps = -containerInner.position().top;
				var moveSteps = availableSteps < perMove ? availableSteps : perMove;

				lock = true;
				containerInner.animate({
					top : '+=' + moveSteps
				}, defaults.animateSpeed, animateDone);
			}
			return false;
		});
	};
	
	ElimGallery.prototype.closeSlider = function(){
		var self = this;
		$(".elim-gallery-slider").remove();
		$('.elim-gallery-cover-shade').hide();
		$(".elim-gallery-close").hide();
		$(document.body).unbind('mousewheel');
	}


}(jQuery));