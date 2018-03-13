// Masonry grid

let grid = document.querySelector('.grid');
let wrapper = document.querySelector('.grid-wrrapper');

let msnry = new Masonry( grid, {
  itemSelector: '.grid__item',
  columnWidth: '.grid__sizer',
  percentPosition: true,
});

function recalculateHeight(){
	let gridHeight = grid.style.height;
	wrapper.style.height = gridHeight;	
}


function loadImage(img){
	img.setAttribute('src', img.getAttribute('data-src'));			
	msnry.layout();	
	img.addEventListener('load', function(){
		this.style.margin = 0;		
		this.parentNode.parentNode.style.zIndex = '1';
	})					
	recalculateHeight();	
}


imagesLoaded( grid ).on( 'done', recalculateHeight);

// Lazy loading

let lazyImages = document.querySelectorAll('.grid__image');
let lazyImagesCopy = [].slice.call(lazyImages);	
let lazyActiveImages = [].splice.call(lazyImagesCopy, 3);

// Load first 3 images at once

[].forEach.call(lazyImagesCopy, function(image) {	
	loadImage(image);
});

function elementInViewport(el) {
  	var rect = el.getBoundingClientRect();
	if (
   		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	) return true;
};

function lazyLoad() {	

	[].forEach.call(lazyActiveImages, function(image) {
		if(elementInViewport(image)){
			loadImage(image);
		}
	});
};

window.onscroll = function(ev) {	
	lazyLoad();
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


// Slider

const Slider = function(sources) {
	this.ENTER_KEYCODE = 27;
	this.LEFT_KEYCODE = 37;
	this.RIGHT_KEYCODE = 39;
	this.slidesContainer = document.querySelector('.slide-modal__overlay');
	this.closeElement = this.slidesContainer.querySelector('.slide-modal__close');
	this.leftArrow = this.slidesContainer.querySelector('.slide-modal__left-arrow');
	this.rightArrow = this.slidesContainer.querySelector('.slide-modal__right-arrow');
	this.picturesContainer = this.slidesContainer.querySelector('.slide-modal__image');
	this.pictures = sources;
};

Slider.prototype.show = function(index) {
	this.slidesContainer.classList.remove('is-hidden');
	this.setActivePicture(index);
	let self = this;
	this.closeElement.onclick = function() {
	  self.hide();
	};
	this.leftArrow.onclick = function() {
	  self.moveleft();
	};
	this.rightArrow.onclick = function() {
	  self.moveright();
	};
    window.addEventListener('keyup', function(e) {   
      	if( e.keyCode == self.ENTER_KEYCODE ) {
      		self.hide();
      	} else if (e.keyCode == self.LEFT_KEYCODE) {
      		self.moveleft();
      	} else if (e.keyCode == self.RIGHT_KEYCODE) {
      		self.moveright();
      	}
    });
};

Slider.prototype.setActivePicture = function(index) {
	this.activePicture = index;
	if (this.activePictureImage) {
	  this.activePictureImage.parentNode.removeChild(this.activePictureImage);
	}
	this.activePictureImage = new Image();
	this.activePictureImage.src = this.pictures[index];
	this.activePictureImage.classList.add('big-image');
	this.picturesContainer.appendChild(this.activePictureImage);
};

Slider.prototype.hide = function() {
	this.slidesContainer.classList.add('is-hidden');
	this.closeElement.onclick = null;
	this.leftArrow.onclick = null;
	this.rightArrow.onclick = null;
};

Slider.prototype.moveleft = function() {
	this.setActivePicture(Math.max(this.activePicture - 1, 0)); // чтобы индекс не был меньше нуля	
};

Slider.prototype.moveright = function() {
	this.setActivePicture(Math.min(this.activePicture + 1, this.pictures.length - 1)); //чтобы индекс
// не был больше последнего индекса в массиве картинок
};

var pictureSection = document.querySelector('.grid');
var links = pictureSection.querySelectorAll('.grid__link');
var imgs = pictureSection.querySelectorAll('.grid__image');
var sources = [];

[].forEach.call(imgs, function(source){
	let imgSrc = source.getAttribute('data-src');
	sources.push(imgSrc);
});

const slider = new Slider(sources);

[].forEach.call(links, function(link, index) {
	link.onclick = function() {
	  slider.show(index);
	};
});


//scroll adaptive arrow

var arr = $('.arrow-up');

arr.on('click', function(e) {
e.preventDefault();
$('html, body').animate({
   scrollTop: 0
}, 1000)
});

function hideScroll() {
 $(window).on('scroll',function() {
  if( $(this).scrollTop() < 500) {
  arr.fadeOut();
} else
  arr.fadeIn();
});
}

hideScroll();


function hideArr() {
if($(window).width() < 768) {
  arr.hide();
  $(window).off('scroll');
}else {
  hideScroll();
}
};

hideArr();

$(window).on('resize', hideArr);
