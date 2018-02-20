// parallax

function Parallax() {
  

  const THROTTLE_TIMEOUT = 50,
	    frontSection = document.querySelector('#front'),
  	  aboutSection = document.querySelector('#about'),
  	  aboutPicture = document.querySelector('.about__map'),
      navbar = document.querySelector('.navbar');  
  
  return {
    move: function (block, windowScroll, strafeAmount) {
      var strafe = Math.ceil(windowScroll / -strafeAmount) + '%';
      var margin = (parseInt(strafe) / 2) + '%';
      var transformString = 'translate3d(0, '+ strafe +' , 0)';

      this.strafe = strafe;
      
      var style = block.style;      
      style.transform = transformString;
      style.webkitTransform = transformString;  

      aboutPicture.style.marginTop = margin;      
      
    },

    showMenu: function(block) {
      (parseInt(this.strafe) < -30) ?  block.classList.remove('navbar--hidden') : block.classList.add('navbar--hidden');
    },
    
    init: function (wScroll) {
    	// console.log(Date.now() - lastCall);
    	// if (Date.now() - lastCall >= THROTTLE_TIMEOUT && topCoord < 0) {
	      	this.move(frontSection, wScroll, -20);
	      	this.move(aboutSection, wScroll, 15);
          this.showMenu(navbar);
		// }
		// lastCall = Date.now();
    }  
  }

}


// toggle front trigger

const frontTrigger = document.querySelector('#hamburger-10');
const navbar = document.querySelector('.navbar');

frontTrigger.addEventListener('click', function(e){
  e.target.classList.toggle('is-active');
  navbar.classList.toggle('navbar--hidden');
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

const partnerContainer = document.querySelector('.partners');
const partnerImages = $('.partners__img');

partnerImages.on('mousemove', function(evt){
  $(this).addClass('partners__img--active');
  let otherImages = $(this).closest('PICTURE').siblings().find('.partners__img');
  otherImages.each(function(){
    $(this).removeClass('partners__img--active');
  })
});


// navigation

// $(document).ready(function() {
//   $('.nav__link').on('click', function(e) {
//     e.preventDefault();
    
//     showSection($(this).attr('href'), true);
//   });
  
//   showSection(window.location.hash, false)
// });//ready
  
  // $(window).scroll(function() {
  //   checkSection();
  // });


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

function showSection(section, isAnimate) {
  let direction = section.replace(/#/, '');
    let reqSection, reqSectionPos;
    for(let sectionsObj in sectionsObjs){
      if(sectionsObj === direction) {
        reqSectionPos = sectionsObjs[sectionsObj]
      }
    }

  let position  = reqSectionPos;
    if(isAnimate) {
    $('body, html').animate({scrollTop: position}, 500);
  } else {
    $('body, html').animate({scrollTop: position});
  }
}

(function toTop(){
  let logoLink = $('.navbar-toplik');
  logoLink.on('click', function(e) {
    e.preventDefault();
    showSection($(this).attr('href'), true);
  });
})();

  
// function checkSection() {
//     $('section').each(function() {
  
//       let $this = $(this),
//         topEdge = $this.offset().top - 68,
//         bottomEdge = topEdge + $this.height(),
//         wScroll = $(window).scrollTop();
  
//       if(topEdge < wScroll && bottomEdge > wScroll) {
//         let currentId = $this.data('section'),
//         reqlink = $('.nav__link').filter('[href="#' + currentId + '"]');
//         reqlink.closest('.nav__item').addClass('nav__item--active').siblings().removeClass('nav__item--active');
//         window.location.hash = currentId;
//       }
//     })
//   }


// scroll events


  window.onscroll = function() {
    const parallax = new Parallax();
    let wScroll = window.pageYOffset;
    parallax.init(wScroll);
    // checkSection();
  };
