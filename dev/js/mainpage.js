/**
 * Полифилл использования Array.prototype.forEach в IE
 */

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
}

/**
 * Функция создания объекта с координатами секций
 * @param {Object} obj [пустой объект координат секций страницы]
 * @return {Object} [заполненный объект координат секций страницы]
 */

function createDimensionsMap(obj) {

  const sections = document.querySelectorAll('section');
  /**
   * Функция, создющая объект координат
   * @param {Element} sekcia
   * @param {number} top
   * @param {number} bottom
   * @param {number} height
   */
  function storeDimensions(sekcia, top, bottom, height) {
    obj[sekcia] = {top: top, bottom: bottom};
  }

  sections.forEach(function(elem){
    let gbr = elem.getBoundingClientRect();
    return storeDimensions(elem.id, gbr.top, gbr.bottom);
  })
}

/**
 * Функция чтения объекта с координатами секций
 * @return {Object} [объект с координатами секций]
 */

function getDms() {

  /**
   * Объект хранения координат секций
   * @type {Object}
   */
  let sectionsDms = {};

  /**
   * Копия объекта хранения координат для localstorage кеширования
   * @type {Object}
   */
  let cachedDms = {};

  /**
   * Если в хранилище уже есть объект координат - берем его от туда.
   * Иначе создаем новый объект координат, сохраняем в хранилище
   * и возвращаем для использования на главной странице, записывая 
   * в копию объекта хранения координат. 
   */

  if (localStorage.getItem("dms")) {
    cachedDms = JSON.parse(localStorage.getItem("dms"));
  } else {
    createDimensionsMap(sectionsDms);
    localStorage.setItem("dms", JSON.stringify(sectionsDms)); 
    cachedDms = JSON.parse(localStorage.getItem("dms"));   
  }

  return cachedDms;
}

/**
 * Функция выделения соответствующего пункта меню шапки при прокрутке документа и добавления хеша
 * @param {Object} obj [объект координат секций страницы]
 */

function checkSection(obj) {
    let wScroll = window.pageYOffset;
    for(let section in obj) {
    if( (obj[section].top - 100) < wScroll && obj[section].bottom > wScroll) {     
      reqlink = $('.nav__link').filter('[href=".\/#' + section + '"]');
      reqlink.closest('.nav__item').addClass('nav__item--active').siblings().removeClass('nav__item--active');

      /**@todo Смена хеша заставляет браузер дергатся при его смене. 
      */
      if (navigator.userAgent.search(/Firefox/) > 0) {
        history.pushState(null, null, '#' + section);
      } else {
        //https://toster.ru/q/116757
        let thisSec = document.querySelector('#' + section);
        let id = thisSec.getAttribute('id');
        thisSec.removeAttribute(id);
        window.location.hash = section;
        thisSec.setAttribute('id', id);
      }
    }
  }
}

/**
 * Функция прокрутки к секции 
 * @param {Object} obj [объект координат секций страницы]
 * @param {Element} section [id секции]
 * @param {boolean} isAnimate анимировать
 */

function showSection(obj, section, isAnimate) {
  let direction = section.replace(/.\/#/, '');
    let reqSection, reqSectionPos;
    for(let sekcia in obj){      
      if(sekcia === direction) {
        reqSectionPos = obj[sekcia].top;
      }
    }

  if(isAnimate) {
    $('body, html').animate({scrollTop: reqSectionPos}, 300);
  } else {
    $('body, html').animate({scrollTop: reqSectionPos});
  }
  /**
   * В случае неиспользования скролла 
   */
  animateTextInAbout(obj);
}

/**
 * Функция вызова прокрутки к секции при нажатии на кнопку
 */

function toSection(dmsObj) {  

  const navlink = $('.nav__link');
  navlink.on('click', function(e) {
    e.preventDefault();
    showSection(dmsObj, $(this).attr('href'), true);
  });   
}

/**
 * Функция прокрутки в начало страницы по нажатию на логотип 
 */

function toTop(dmsObj) {
  const logoLink = $('.navbar-toplik');
  logoLink.on('click', function(e) {
    e.preventDefault();
    showSection(dmsObj, $(this).attr('href'), true);
  });
}

/**
 * Функция прокрутки к карте
 */

function toMap() {
  $('.map-btn').on('click', function(e) {
    e.preventDefault();
    const dest = $('#map').offset().top - 100;
    $('body, html').animate({scrollTop: dest}, 2000);
  });
}


/**
 * Функция показа меню при уходе с главной секции
 * @param {Object} obj [объект изменения координат секций страницы]
 * @param {String} blockID
 * @param {Element} elem
 * @param {number} point
 */

/**
 * @todo вынести переменную из глобалной области но чтобы работало и при загрузке и скролле
 */
let triggered = false;

function showMenu(obj, blockID, elem, point) {
  let navbarHeight = elem[0].getBoundingClientRect().height;

  if(triggered) {
    -parseInt(obj[blockID].top) < navbarHeight ? elem.fadeOut() : elem.fadeIn();
    triggered = false;
  }
  parseInt(obj[blockID].bottom) < point ? elem.fadeIn() : elem.fadeOut();
}

/**
 * Анимация текста в секции О компании
 * @param {Object} obj [объект изменения координат секций страницы]
 */


function animateTextInAbout(obj) {
  let wScroll = window.pageYOffset;
  if (obj['about'].top < wScroll && obj['about'].bottom > wScroll) {
    const paragraphs = document.querySelectorAll('.description__par');
    [].forEach.call(paragraphs, function(par){
      let $par = $(par);
      $par.animate({opacity: 1}, 1000);
    });
  }
}

/**
 * Анимация текста в секции Галерея
 * @param {Object} obj [объект изменения координат секций страницы]
 */


function animateTextInGallery(obj) {
  let wScroll = window.pageYOffset;
  if (obj['gallery'].top < wScroll && obj['gallery'].bottom > wScroll) {
    const paragraphs = document.querySelectorAll('.gallery-desc__item');
    [].forEach.call(paragraphs, function(par){
      let $par = $(par);
      $par.animate({opacity: 1}, 5000);
    });
  }
}

/**
 * Функция показа/скрытия кнопки-гамбургера на главной странице при достижении верха
 * @param {Object} obj [объект изменения координат секций страницы]
 * @param {Element} blockID
 * @param {String} elem
 */

function showTrigger(obj, blockID, elem) {
  parseInt(obj[blockID].top) == 0  ? elem.classList.add('d-inline-block') : elem.classList.remove('d-inline-block');
}

/**
 * Функция показа/скрытия по клику кнопки-гамбургера, и показа меню на главной странице
 * @param {Element} elem
 */

function toggleClickTrigger(elem, nav) {

  elem.addEventListener('click', function(e){
    this.classList.remove('d-inline-block');
    nav.css('display', 'block');
    triggered = true;
  }); 
}


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
 * Функция активации блоков проектов при наведении
 */

function activateProjectBlocks() {
  const projectImages = document.querySelectorAll('.projects-gallery__item');
  [].forEach.call(projectImages, function(image){
    const projectCaption = image.querySelector('.projects-gallery__caption');
      image.addEventListener('mouseenter', function(){
        projectCaption.classList.add('projects-gallery__caption--active');
      }); 
      image.addEventListener('mouseleave', function(){
        projectCaption.classList.remove('projects-gallery__caption--active');
      }); 
  });  
}

/**
 * Функция затемнения блоков с партнерами при движении курсора
 */

function changePartnerOpacity(container) {
  
  const partnerImages = container.find('img');
  partnerImages.on('mousemove', function(){
    $(this).addClass('partners__img--active');
    $(this).removeClass('partners__img--darkened');
    const otherImages = $(this).closest('PICTURE').siblings().find('.partners__img');
    otherImages.each(function(){
      $(this).removeClass('partners__img--active');    
      $(this).addClass('partners__img--darkened');       
    })
  });  
}

/**
 * Функция дезактивации затемнения
 */

function disablePartnerOpacity(container) {

container.on('mouseleave', function(evt){ 
    let that = $(this);
    setTimeout(function(){    
      const images = that.find('.partners__img');
      images.each(function(i, image){
        $(image).removeClass('partners__img--active');
        $(image).removeClass('partners__img--darkened');
      });
    }, 500);
  });  
}

/**
 * Функция инициализации и настройки параметров карты
 */

function initMap() { 
  let myMap, myPlacemark;
  myMap = new ymaps.Map("map", {
      center: [60.032975, 30.323807],
      zoom: 15
  }); 
  myMap.behaviors.disable('scrollZoom');
  
  myPlacemark = new ymaps.Placemark([60.032524, 30.323270], {
      hintContent: 'Форум!',
      balloonContent: 'Энгельса 109'
  });
  
  myMap.geoObjects.add(myPlacemark);
}

/**
 * Функция настройки отображения для IE (с учетом того, что анимация логотипа отключена)
 */

function IETune() {
  if (navigator.userAgent.search(/Trident/) >= 0) {
    $('#front').css('display', 'none');
    $('.navbar').css('display', 'block');
    const paragraphs = document.querySelectorAll('.description__par');
    [].forEach.call(paragraphs, function(par){
      $(par).css('opacity', 1);
    });    
    $('.contacts-form__logo').css('width', '83px');
  }
}

/*********************************************************************/
/**********************  При загрузке страницы **********************/
/********************************************************************/ 

$(document).ready(function() {

  const partnerContainer = $('.partners');
  const navbar = $('.navbar');
  const frontTrigger = document.querySelector('#hamburger-10');

  let DMS = getDms();  
  toSection(DMS);
  activateProjectBlocks();
  changePartnerOpacity(partnerContainer);
  disablePartnerOpacity(partnerContainer);
  showMobileTrigger();
  toggleClickTrigger(frontTrigger, navbar);  
  toTop(DMS);
  toMap();
  ymaps.ready(initMap);
  IETune();

});

/*********************************************************************/
/**********************  При прокрутке страницы **********************/
/********************************************************************/ 
 
/**
 * Функция-декоратор для проряжения прослушки скроллинга
 * @param {Function} func
 * @param {number} ms
 */

function throttle(func, ms) {
  var isThrottled = false,
    savedArgs,
    savedThis;
  function wrapper() {
    if (isThrottled) { 
      savedArgs = arguments;
      savedThis = this;
      return;
    }
    func.apply(this, arguments);
    setTimeout(function() {
      isThrottled = false; 
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }
  return wrapper;
}

window.addEventListener('scroll', function() { 

  /**
  * @todo
  * затратно
  */
  let DMS = getDms(); 

  let dynamicSectionsDms = {};
  const navbar = $('.navbar');
  const frontSectionID = document.querySelector('#front').getAttribute('id');
  const frontTrigger = document.querySelector('#hamburger-10');

  throttle(createDimensionsMap(dynamicSectionsDms), 100);
  throttle(checkSection(DMS), 100);
  /**
   * Показ меню при скролле, для IE функция отключается.
   */
  if (navigator.userAgent.search(/Trident/) < 0) {
    throttle(showMenu(dynamicSectionsDms, frontSectionID, navbar, 200), 100);
  }  
  throttle(showTrigger(dynamicSectionsDms, frontSectionID, frontTrigger), 100);
  throttle(animateTextInAbout(dynamicSectionsDms), 100);
  
});
