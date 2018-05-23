/**
 * Вызов карты
 */
function initMap() {
	let myMap = new ymaps.Map("map", {
		center: [60.032975, 30.323807],
		zoom: 15
	});

	myMap.behaviors.disable("scrollZoom");

	let myPlacemark = new ymaps.Placemark([60.032524, 30.32327], {
		hintContent: "Форум!",
		balloonContent: "Энгельса 109"
	});

	myMap.geoObjects.add(myPlacemark);
}

/**
 * Слайдер для страницы объекта
 */
function initSwiper() {
	const swiper = new Swiper("#slider-object", {
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

/**
 * Слайдер для футера
 */
function initFooterSwiper() {
	let spase;
	window.matchMedia("(min-width: 1200px)").matches
		? (spase = 100)
		: (spase = 30);

	const swiper = new Swiper("#slider-footer", {
		slidesPerView: "auto",
		loop: true,
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev"
		},
		autoplay: {
			delay: 3000,
			disableOnInteraction: false
		},
		spaceBetween: spase,
		pagination: {
			el: ".swiper-pagination",
			clickable: true
		}
	});
}

/**
 * Открытие по кнопке Больше объектов
 * @btn Node кнопка нажатия
 * @el Node элемент раскрытия
 */
function showObjects(btn, el) {
	btn.click(function() {
		el
			.eq(1)
			.removeClass("d-none")
			.slideDown(600);
	});
}

$(document).ready(function() {
	let loc = window.location.toString();
	loc.includes("contacts") || loc.includes("object")
		? ymaps.ready(initMap)
		: null;
	initFooterSwiper();
	initSwiper();
	let btn = $(".more-btn");
	let el = $(".objects");
	showObjects(btn, el);
});
