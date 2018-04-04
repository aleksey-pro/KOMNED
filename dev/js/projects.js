/**
 * Функция разбиения массива фотографий на первый 3 и остальные
 * @return {Object} [объект массивов фотографий]
 */
function getImagesArrays(){
	const lazyImages = document.querySelectorAll('.grid__image');
	const lazyImagesCopy = [].slice.call(lazyImages);	
	const lazyActiveImages = [].splice.call(lazyImagesCopy, 3);	
	return {
		firstThreeImg: lazyImagesCopy,
		restImg: lazyActiveImages
	}
}


/**
 * Функция перерасчета высоты блока при загрузке галереи
 * @param {Element} grid [блок с фотографиями]
 */

function recalculateHeight(grid) {
	let wrapper = document.querySelector('.grid-wrrapper');	
	let gridHeight = grid.style.height;
	wrapper.style.height = gridHeight;	

}

/**
 * Функция загрузки 1 фотографии
 */

function loadImage(img, grid) {

	let msnry = new Masonry( grid, {
	  itemSelector: '.grid__item',
	  columnWidth: '.grid__sizer',
	  percentPosition: true,
	});

	img.setAttribute('src', img.getAttribute('data-src'));			
	msnry.layout();	
	img.addEventListener('load', function(){
		this.style.margin = 0;		
		this.parentNode.parentNode.style.zIndex = '1';
	})					
	recalculateHeight(grid);
}

/**
 * Функция проверки наличия элемента в окне
 * @param {Element} el
 * @return {Boolean}
 */

function elementInViewport(el) {
  	let rect = el.getBoundingClientRect();
	if (
   		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	) return true;
};

/**
 * Подгружаем 3 первые фотографии сразу по загрузке страницы
 */

function imgsPreload(imgs) {	
	[].forEach.call(imgs, function(image) {	
		loadImage(image, imgGrid);
	});		
}

/**
 * Подгружаем остальные фотографиия при помощи"ленивой" загрузки
*/

function lazyLoad(imgs) {
	[].forEach.call(imgs, function(image) {
		if(elementInViewport(image)){
			loadImage(image, imgGrid);
		}
	});
};


/**
 * Функция показа кнопки-гамбургера в мобильном меню 
 */

function showMobileTrigger() {
  const menuTrigger = $('#hamburger-9');
  const mobileMenu = $('.navbar__dropdown-menu');
  menuTrigger.on('click', function(){
    mobileMenu.slideToggle();
  });
}

/**
 * Функция изменения координат на карте в зависимости от страницы проекта
 * @return {Object}
 */


/**
 * Полифилл метода includes для IE
 * @return {Boolean} [вхождение подстроки]
 */
(function includesForIE() {
	if (!String.prototype.includes) {
	  String.prototype.includes = function(search, start) {
	    'use strict';
	    if (typeof start !== 'number') {
	      start = 0;
	    }

	    if (start + search.length > this.length) {
	      return false;
	    } else {
	      return this.indexOf(search, start) !== -1;
	    }
	  };
	}	
})();


function changeCoords() {

	let path = window.location.pathname;
	let coords = {
	'center': '',
	'place': '',
	};

	if (path.includes('atoll')) {
		coords.center = [60.031280, 30.402187];
		coords.place = [60.032, 30.404];
	} else if (path.includes('forum')) {
		coords.center = [59.898397, 30.291552];
		coords.place = [59.900254, 30.291281];
	} else if (path.includes('kvartz')) {
		coords.center = [59.994331, 30.432424];
		coords.place = [59.993469, 30.436512];
	} else if (path.includes('landskrona')) {
		coords.center = [60.023059, 29.818790];
		coords.place = [60.023744, 29.822419];
	} else {
		coords.center = [60.032975, 30.32380];
		coords.place = [60.032524, 30.323270];		
	}
	return coords;
}

/**
 * Функция инициализации и настройки параметров карты 
 * @param {Object} [объект координат]
 */

function initMap(coords) {

	/**
	 * передаем параметры через замыкание
	 */
	return function() {
		let myMap, myPlacemark, centerCoords;

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
}


/**
 * Функция-конструктор создания слайдера
 * @constructs Slider
 * @param {Array} sources [массив ссылок с фотографиями]
 */
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

/**
 * Метод показа слайдера при нажатии на фотографию
 * @name Slider#show
 * @param  {number} index [индекс фотографии в массиве]
 */
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

/**
 * Функция установки активной фотографии
 * @name Slider#setActivePicture
 * @param {number} index [индекс фотографии в массиве]
 */
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

/**
 * Функция скрытия слайдера по нажатию на крестик или ESC
 * @name Slider#hide
 */
Slider.prototype.hide = function() {
	this.slidesContainer.classList.add('is-hidden');
	this.closeElement.onclick = null;
	this.leftArrow.onclick = null;
	this.rightArrow.onclick = null;
};

/**
 * Функция перлистывания фотографий влево
 * @name Slider#moveleft 
 */
Slider.prototype.moveleft = function() {
	this.setActivePicture(Math.max(this.activePicture - 1, 0)); // чтобы индекс не был меньше нуля	
};

/**
 * Функция перлистывания фотографий вправо
 * @name Slider#moveright 
 */
Slider.prototype.moveright = function() {
	this.setActivePicture(Math.min(this.activePicture + 1, this.pictures.length - 1)); //чтобы индекс
// не был больше последнего индекса в массиве картинок
};


/**
 * Функция создания массива ссылок на фотографии
 * @return {Array} массив ссылок
 */

function createLinks() {
	let imgs = document.querySelectorAll('.grid__image');
	let sources = [];

	[].forEach.call(imgs, function(source){
		let imgSrc = source.getAttribute('data-src');
		sources.push(imgSrc);
	});

	return sources;
}


/**
 * Функция показа фотографий с слайдере при нажатии
 */

function showImages(){
	let links = document.querySelectorAll('.grid__link');
	let src = createLinks();
	let slider = new Slider(src);	

	[].forEach.call(links, function(link, index) {
		link.onclick = function() {
		  slider.show(index);
		};
	});		
}


/*********************************************************************/
/**********************  При загрузке страницы **********************/
/********************************************************************/ 

$(document).ready(function() {
	let imgArrays = getImagesArrays();	
	imgsPreload(imgArrays.firstThreeImg);
	showImages();
	showMobileTrigger();
	
	/**
	 * Иинициализация карты
	 */
	let newCoords = changeCoords();
	ymaps.ready(initMap(newCoords));

	/**
	 * Иинициализация, настройка и вызов плагина стрелки вверх 
	 */

	$(".arrow-up").ScrollupArrow({
	  bottom: '50%',	
	  right: 'unset',
	  left: 0
	});
});

/*********************************************************************/
/**********************  При прокрутке страницы **********************/
/********************************************************************/

window.onscroll = function() {
	/**
	 * @todo неоптимально и затратно создавать объект каждый раз
	 */
	let imgArrays = getImagesArrays();	
	lazyLoad(imgArrays.restImg);
};

/**
 * Функция для корректной работы masonry в случае битой ссылки
 * @external ./node_modules/imagesloaded/imagesloaded.pkgd.min.js
 * @todo вынести из глоблаьной области видимости 
 */

let imgGrid = document.querySelector('.grid');
imagesLoaded(imgGrid).on( 'done', function(){
	recalculateHeight(imgGrid);
});







