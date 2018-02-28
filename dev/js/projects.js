// Masonry grid

var grid = document.querySelector('.grid');

var msnry = new Masonry( grid, {
  itemSelector: '.grid-item',
  columnWidth: '.grid-sizer',
  percentPosition: true
});

imagesLoaded( grid ).on( 'progress', function() {
  // layout Masonry after each image loads
  msnry.layout();
});

//map init

ymaps.ready(initMap);

let myMap, myPlacemark, centerCoords;
let path = window.location.pathname;

let coords = {
	'center': '',
	'place': ''
};

(function changeCoords(){
	if(path.includes("atoll")) {
		coords.center = [60.031280, 30.402187];
		coords.place = [60.032, 30.404];
		return coords;
	}else if (path.includes("forum")){
		coords.center = [59.898397, 30.291552];
		coords.place = [59.900254, 30.291281];
		return coords;
	}else if (path.includes("kvartz")){
		coords.center = [59.994331, 30.432424];
		coords.place = [59.993469, 30.436512];
		return coords;
	}else if (path.includes("landskrona")) {
		coords.center = [60.023059, 29.818790];
		coords.place = [60.023744, 29.822419];
		return coords;
	} else {
		coords.center = [60.032975, 30.32380];
		coords.place = [60.032524, 30.323270];
		return coords;
	}
})();

console.log(coords);

function initMap(){ 
    myMap = new ymaps.Map("map", {
        center: coords.center,
        zoom: 15
    }); 
    myMap.behaviors.disable('scrollZoom');
    
    myPlacemark = new ymaps.Placemark(coords.place, {
        hintContent: 'Форум!'
    });
    
    myMap.geoObjects.add(myPlacemark);
}