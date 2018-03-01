// Masonry grid

let grid = document.querySelector('.grid');
let wrapper = document.querySelector('.grid-wrrapper');

let msnry = new Masonry( grid, {
  itemSelector: '.grid__item',
  columnWidth: '.grid__sizer',
  // gutter: '.gutter-width',
  percentPosition: true,
});

// imagesLoaded( grid ).on( 'progress', function() {
//   // layout Masonry after each image loads
//   msnry.layout();
// });

function recalculateHeight(){
	let gridHeight = grid.style.height;
	wrapper.style.height = gridHeight;	
}

imagesLoaded( grid ).on( 'done', recalculateHeight);

// Lazy loading

window.onscroll = function(ev) {	
	lazyLoad();
};

function lazyLoad() {	
	let lazyImages = document.querySelectorAll('.grid__image');	
	[].forEach.call(lazyImages, function(image) {
		if(elementInViewport(image)){
			image.setAttribute('src', image.getAttribute('data-src'));			
			msnry.layout();	
			image.addEventListener('load', function(){
				this.style.margin = 0;
			})					
			recalculateHeight();
		}
	});
};

function elementInViewport(el) {
  	var rect = el.getBoundingClientRect();
	if (
   		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	) return true;
};


// map init

ymaps.ready(initMap);

let myMap, myPlacemark, centerCoords;
let path = window.location.pathname;

let coords = {
	'center': '',
	'place': '',
};

(function changeCoords() {
	if (path.includes('atoll')) {
		coords.center = [60.031280, 30.402187];
		coords.place = [60.032, 30.404];
		return coords;
	} else if (path.includes('forum')) {
		coords.center = [59.898397, 30.291552];
		coords.place = [59.900254, 30.291281];
		return coords;
	} else if (path.includes('kvartz')) {
		coords.center = [59.994331, 30.432424];
		coords.place = [59.993469, 30.436512];
		return coords;
	} else if (path.includes('landskrona')) {
		coords.center = [60.023059, 29.818790];
		coords.place = [60.023744, 29.822419];
		return coords;
	} else {
		coords.center = [60.032975, 30.32380];
		coords.place = [60.032524, 30.323270];
		return coords;
	}
})();

function initMap() {
    myMap = new ymaps.Map('map', {
        center: coords.center,
        zoom: 15,
    });
    myMap.behaviors.disable('scrollZoom');

    myPlacemark = new ymaps.Placemark(coords.place, {
        hintContent: 'Форум!',
    });

    myMap.geoObjects.add(myPlacemark);
}
