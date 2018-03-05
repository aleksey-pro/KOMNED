// window.console.clear();

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			let container, stats, clock;
			let camera, scene, renderer, logo;
			init();
			animate();
			function init() {
				container = document.getElementById( 'front' );
				container.style.height = window.innerHeight + 'px';
				// camera = new THREE.PerspectiveCamera( 67.5, window.innerWidth / window.innerHeight, 0.1, 1000 );
				camera = new THREE.PerspectiveCamera( 67.5, window.innerWidth / window.innerHeight, 0.1, 1000 );
				camera.position.set( -200, 100, 280 );
     
        //
				scene = new THREE.Scene();
				clock = new THREE.Clock();
				// loading manager
				let loadingManager = new THREE.LoadingManager( function() {
					scene.add( logo );
				} );
        
				// loader
				let loader = new THREE.ColladaLoader( loadingManager );
				// loader.load( 'https://raw.githubusercontent.com/davegahn/test/master/scripts/F34.dae', function( collada ) {
				loader.load( 'https://raw.githubusercontent.com/davegahn/test2/master/F0.dae', function( collada ) {
					logo = collada.scene;
				} );
        
				// lights
				let ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );// 0xcccccc
				scene.add( ambientLight );
				let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
				directionalLight.position.set( -3, 0, 5 ).normalize();
				scene.add( directionalLight );
        
        // let spotLight = new THREE.PointLight( 0xffffff, 0.6, 100 );
        // light.position.set( 0, 0, 0 );
        // scene.add( spotLight );
        
				// renderer
				renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.domElement.style.position = "absolute";
				renderer.domElement.style.left = 0;
				container.appendChild( renderer.domElement );
        
        // helpers
        let directionalLighthelper = new THREE.DirectionalLightHelper( directionalLight, 200 );
        // scene.add( directionalLighthelper );
        
        // var CameraHelper = new THREE.CameraHelper( camera );
        // scene.add( CameraHelper );

        // var axesHelper = new THREE.AxesHelper( 400 );
        // scene.add( axesHelper );

//         var size = 300;
//         var divisions = 300;

//         var gridHelper = new THREE.GridHelper( size, divisions );
//         scene.add( gridHelper );
        
       
        // orbit
        let orbit = new THREE.OrbitControls( camera, renderer.domElement );
        orbit.enableZoom = false;
				
        // stats
				// stats = new Stats();
				// container.appendChild( stats.dom );
        
		// resize
			window.addEventListener( 'resize', onWindowResize, false );
		}

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		}
      // animate
      function animate() {
        requestAnimationFrame( animate );
        render();
        // stats.update();
      }
      function render() {
        let delta = clock.getDelta();
        if ( logo !== undefined ) {
          // logo.rotation.z += delta * 0.4;
          logo.rotation.y += delta * 0.1;
        }
        renderer.render( scene, camera );
      }

// --------------------------------------------------star sky-----------------------------------//
// ---------------------------------------------------------------------------------------------//

let canvas;
var context;
var screenH;
var screenW;
var stars = [];
var staticStars = [];
var staticSMStars = [];
var bigStaticStars = [];
var fps = 60;
var numStars = 300;
var numSMStaticStars = 940;
var numBigStaticStars = 50;

$('document').ready(function() {
  
  // Calculate the screen size
	screenH = $(window).height();
	screenW = $(window).width();
  
	
	// Get the canvas
	canvas = $('#space');
	
	// Fill out the canvas
	canvas.attr('height', screenH);
	canvas.attr('width', screenW);
	context = canvas[0].getContext('2d');

	context.globalCompositeOperation='destination-over';
  
  // Create static small stars
  
    for (let i = 0; i < numSMStaticStars; i++) {
		let x = Math.round(Math.random() * screenW);
		let y = Math.round(Math.random() * screenH);
    	// var length = 1 + Math.random() * 1.5;
    	var size = 1;
      
    var staticSMStar = new Star(x, y, size);
    staticSMStars.push(staticSMStar);
  }


  // Create big static stars
	
  for (let i = 0; i < numBigStaticStars; i++) {
		let x = Math.round(Math.random() * screenW);
		let y = Math.round(Math.random() * screenH);
    	// var length = 3 + Math.random() * 1.5;
    	var size = 3;
    
    var bigStaticStar = new Star(x, y, size);
    bigStaticStars.push(bigStaticStar);
  }
  
	// Create dynamic stars
	for (let i = 0; i < numStars; i++) {
		let x = Math.round(Math.random() * screenW);
		let y = Math.round(Math.random() * screenH);
		let opacity = Math.random();
    	// var length = 5 + Math.random() * 1.5;
    	let size = 4;
		let star = new Star(x, y, size, opacity);
		
		// Add the the stars array
		stars.push(star);
	}
  
  // console.log(stars);
  // console.log(staticStars);
  // console.log(staticSMStars);
	
	animateInterval = setInterval(animateStars, 1000 / fps);
});

/**
 * Animate the canvas
 */
function animateStars() {
	context.clearRect(0, 0, screenW, screenH); //
    context.clearRect(0, 0, canvas.width, canvas.height);
	$.each(stars, function() {
		this.draw(context);
	});
  	$.each(staticStars, function() {
		this.drawStatic(context);
	});
  	$.each(staticSMStars, function() {
		this.drawStatic(context);
	});
}

/* stop Animation */
function stopAnimation() {
     clearInterval(animateInterval);
}

// stopAnimation();

function Star(x, y, size, opacity) {
	this.x = parseInt(x);
	this.y = parseInt(y);
	this.opacity = opacity;
  	// this.length = parseInt(length);
  	this.size = size;
	this.factor = 1;
	this.increment = Math.random() * .03;
}

Star.prototype.draw = function() {
context.rotate((Math.PI * 1 / 10));
	
	context.save();
	context.translate(this.x, this.y);
	
	// Change the opacity
	if(this.opacity > 1) {
		this.factor = -1;
	}
	else if(this.opacity <= 0) {
		this.factor = 1;
		
		this.x = Math.round(Math.random() * screenW);
		this.y = Math.round(Math.random() * screenH);
		
	}
	this.opacity += this.increment * this.factor;
	
	// context.beginPath();
	// context.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
	// context.shadowColor = '#fff';
	// context.shadowBlur = 30;
	// // context.shadowOffsetX = 10;
 // //    context.shadowOffsetY = 10;	
	// for (var i = 5; i--;) {
	// 	context.lineTo(0, this.length);
	// 	context.translate(0, this.length);
	// 	context.rotate((Math.PI * 2 / 10));
	// 	context.lineTo(0, - this.length);
	// 	context.translate(0, - this.length);
	// 	context.rotate(-(Math.PI * 6 / 10));
	// }
	// context.lineTo(0, this.length);	
	// context.closePath();
	context.beginPath();
	context.arc(10, 10, this.size, 0, Math.PI*2, true);
	context.closePath();
	context.fillStyle = "rgba(255, 255, 200, " + this.opacity + ")";
	context.shadowColor = "#fff";
	context.shadowBlur = 30;
	context.fill();


	context.fill();
	
	context.restore();

};

Star.prototype.drawStatic = function() {
context.rotate((Math.PI * 1 / 10));
	
	// Save the context
	// context.save();	
	// move into the middle of the canvas, just to make room
	// context.translate(this.x, this.y);	
	// context.beginPath();
	// for (var i = 5; i--;) {
	// 	context.lineTo(0, this.length);
	// 	context.translate(0, this.length);
	// 	context.rotate((Math.PI * 2 / 10));
	// 	context.lineTo(0, - this.length);
	// 	context.translate(0, - this.length);
	// 	context.rotate(-(Math.PI * 6 / 10));
	// }
	// context.lineTo(0, this.length);
	// context.closePath();
	// context.fillStyle = "rgba(255, 255, 200, 1)";
	// context.fill();	
	// context.restore();

	context.save();
	context.translate(this.x, this.y);  
	context.beginPath();
  	context.arc(10, 10, this.size, 0, Math.PI*2, true);
  	context.closePath();
  	context.fillStyle = "rgba(255, 255, 200, 1)";  
  	context.fill();  
	context.restore(); 

};