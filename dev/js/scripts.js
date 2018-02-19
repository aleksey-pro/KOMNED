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


  window.onscroll = function() {
    const parallax = new Parallax();
    let wScroll = window.pageYOffset;
    parallax.init(wScroll);
  };

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

