// parallax

// function Parallax() {
  

//   const frontSection = document.querySelector('#front'),
//   	  aboutSection = document.querySelector('#about'),
//   	  aboutPicture = document.querySelector('.about__map');
      
//       // this.marg = marg; 
  
//   return {
//     move: function (block, windowScroll, strafeAmount) {
//       let strafe = Math.ceil(windowScroll / -strafeAmount) + '%';
//       let margin = (parseInt(strafe) / 2) + '%';
//       let transformString = 'translate3d(0, '+ strafe +' , 0)';

//       this.strafe = strafe;
//       // this.margin = margin;
      
//       const style = block.style;      
//       style.transform = transformString;
//       style.webkitTransform = transformString;  

//       // aboutPicture.style.marginTop = margin;
//       // this.marg = margin;      
//     },

//     showMenu: function(block) {
//       (parseInt(this.strafe) < -30) ?  block.classList.remove('navbar--hidden') : block.classList.add('navbar--hidden');
//     },

//     showTrigger: function(trigger, block) {
//       if (parseInt(this.strafe) < -10){
//         trigger.classList.add('is-hidden');
//         block.classList.remove('navbar--hidden');
//       } else{
//         trigger.classList.remove('is-hidden');
//         block.classList.add('navbar--hidden');  
//       }
//     },
    
//     init: function (wScroll) {
//     	this.move(frontSection, wScroll, -30);
//     	this.move(aboutSection, wScroll, 15);          
//     }  
//   }

// }


// const frontSection = document.querySelector('#front'),
//       aboutSection = document.querySelector('#about');

// window.onscroll = function() {
//   if(elementInViewport(frontSection)){
//     console.log('front section in VP')
//   }else if (elementInViewport(aboutSection)){
//     console.log('about section in VP')
//   }
// }



// pop-up menu

function showMenu(block, menu) {
  let bottomCord = block.getBoundingClientRect().bottom;
  parseInt(bottomCord) < 200 ? menu.classList.remove('navbar--hidden') : menu.classList.add('navbar--hidden');
}


// navigation

$(document).ready(function() {


$('.nav__link').on('click', function(e) {
  e.preventDefault();
  showSection($(this).attr('href'), true); //
});

  
showSection(window.location.hash, true); //

toTop();
toMap();

$('img[usemap]').imageMap();

});//ready

const frontSection = document.querySelector('#front'),
  navbar = document.querySelector('.navbar');
  
$(window).scroll(function() {
  showMenu(frontSection, navbar);
  checkSection();
});


function toMap(){
  $('.map-btn').on('click', function(e) {
    e.preventDefault();
    var dest = $('#map').offset().top-200;
    console.log(dest);
    $('body, html').animate({scrollTop: dest}, 2000);
  });
}

function toTop(){
  let logoLink = $('.navbar-toplik');
  logoLink.on('click', function(e) {
    e.preventDefault();
    showSection($(this).attr('href'), true);
  });
};

// init section offsets

let sectionsObjs = {};

(function createOffsetsMap () {  
  function storeOffsets(sekcia, offset) {
    sectionsObjs[sekcia] = offset;
  }
  $('section').each(function(i, elem){
     return storeOffsets(elem.id, elem.offsetTop);
  })
})();


// on scroll

function showSection(section, isAnimate, off) {
  let direction = section.replace(/.\/#/, '');
    let reqSection, reqSectionPos;
    for(let sectionsObj in sectionsObjs){
      if(sectionsObj === direction) {
        reqSectionPos = sectionsObjs[sectionsObj]
      }
    }

  let position  = reqSectionPos;
    if(isAnimate) {
    $('body, html').animate({scrollTop: position}, 500); // + $(window).height()/(parseInt(off)/100)
  } else {
    $('body, html').animate({scrollTop: position}); // + $(window).height()/(parseInt(off)/100)
  }
}

  
function checkSection() {
    $('section').each(function() {
  
      let $this = $(this),
        topEdge = $this.offset().top - 68,
        bottomEdge = topEdge + $this.height(),
        wScroll = $(window).scrollTop();
  
      if(topEdge < wScroll && bottomEdge > wScroll) {
        let currentId = $this.attr('id');        
        reqlink = $('.nav__link').filter('[href=".\/#' + currentId + '"]');
        reqlink.closest('.nav__item').addClass('nav__item--active').siblings().removeClass('nav__item--active');
        window.location.hash = currentId;
      }
    })
  }


// scroll events

// const THROTTLE_TIMEOUT = 20;
// let lastCall = Date.now();

// window.onscroll = function() {
  // console.log(triggered);
  // const parallax = new Parallax();       
  // let wScroll = window.pageYOffset;  
  // if (Date.now() - lastCall >= THROTTLE_TIMEOUT) {
    // console.log('action');
    // parallax.init(wScroll);
  // };
  // lastCall = Date.now();  
  // const navbar = document.querySelector('.navbar');
  // const menuTrigger = document.querySelector('.menu-trigger');
  // if(triggered){
  //   delete parallax.showMenu;
  //   parallax.showTrigger(menuTrigger, navbar);
  // } else {
  //   parallax.showMenu(navbar); 
  // }

  // goToSection();
  // console.log(parallax.marg);
  // checkSection();
// };





// toggle front trigger

const frontTrigger = document.querySelector('#hamburger-10');
let triggered = false;

frontTrigger.addEventListener('click', function(e){
  // e.target.classList.toggle('is-hidden');
  this.classList.add('is-hidden');
  navbar.classList.remove('navbar--hidden');
  triggered = true;
});

// hover project images

let projectImages = document.querySelectorAll('.projects-gallery__item');

[].forEach.call(projectImages, function(image){
  let projectCaption = image.querySelector('.projects-gallery__caption');
    image.addEventListener('mouseenter', function(){
      projectCaption.classList.add('projects-gallery__caption--active');
    }); 
    image.addEventListener('mouseleave', function(){
      projectCaption.classList.remove('projects-gallery__caption--active');
    }); 
});

// hover partners images

const partnerContainer = $('.partners');
const partnerImages = $('.partners__img');

partnerImages.on('mousemove', function(){
  $(this).addClass('partners__img--active');
  $(this).removeClass('partners__img--darkened');
  let otherImages = $(this).closest('PICTURE').siblings().find('.partners__img');
  otherImages.each(function(){
    $(this).removeClass('partners__img--active');    
    $(this).addClass('partners__img--darkened');       
  })
});

partnerContainer.on('mouseleave', function(evt){ 
  let that = $(this);
  setTimeout(function(){    
    let images = that.find('.partners__img');
    images.each(function(i, image){
      $(image).removeClass('partners__img--active');
      $(image).removeClass('partners__img--darkened');
    });
  }, 1000);
});


//map init

ymaps.ready(initMap);
var myMap, 
    myPlacemark;

function initMap(){ 
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


