/**
 * Вызов карты
 */
function initMap() {
	let myMap = new ymaps.Map("map", {
		center: [60.032975, 30.323807],
		zoom: 15
	});

	let myPlacemark = new ymaps.Placemark([60.032524, 30.32327], {
		hintContent: "Форум!",
		balloonContent: "Энгельса 109"
	});

	myMap.geoObjects.add(myPlacemark);
}

/**
 * Вызов слайдера
 */
function initSwiper() {
	console.log("init");
	var swiper = new Swiper(".swiper-container", {
		slidesPerView: 1,
		spaceBetween: 30,
		loop: true,
		autoplay: {
			delay: 3000,
			disableOnInteraction: false
		},
		pagination: {
			el: ".swiper-pagination",
			clickable: true
		},
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev"
		}
	});
}

$(document).ready(function() {
	console.log("ready");
	// $(document).find("#map") ? ymaps.ready(initMap) : null;
	initSwiper();
});
