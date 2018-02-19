window.console.clear();

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			let container, stats, clock;
			let camera, scene, renderer, logo;
			init();
			animate();
			function init() {
				container = document.getElementById( 'front' );
				container.style.height = window.innerHeight + 'px';
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
				loader.load( 'https://raw.githubusercontent.com/davegahn/test/master/scripts/F34.dae', function( collada ) {
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
				stats = new Stats();
				container.appendChild( stats.dom );
        
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
        stats.update();
      }
      function render() {
        let delta = clock.getDelta();
        if ( logo !== undefined ) {
          logo.rotation.z += delta * 0.4;
          logo.rotation.y += delta * 0.1;
        }
        renderer.render( scene, camera );
      }

// --------------------------------------------------star sky-----------------------------------
// ------------------------------------------------------------------------------------------------

let canvas;
var context;
var screenH;
var screenW;
var stars = [];
var staticStars = [];
var staticSMStars = [];
var fps = 60;
var numStars = 40;
var numStaticStars = 100;
var numSMStaticStars = 60;

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
  
  // Create static stars
	
  for (var i = 0; i < numStaticStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
    var size = 2;
    
    var staticStar = new Star(x, y, size);
    staticStars.push(staticStar);
  }
  
  // Create static small stars
  
    for (var i = 0; i < numSMStaticStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
    var size = 1;
      
    var staticSMStar = new Star(x, y, size);
    staticSMStars.push(staticSMStar);
  }
  
	// Create dynamic stars
	for (var i = 0; i < numStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
		let opacity = Math.random();
    var size = 3;
		var star = new Star(x, y, size, opacity);
		
		// Add the the stars array
		stars.push(star);
	}
  
  // console.log(star);
  // console.log(staticStar);
  // console.log(staticSMStar);
	
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
  	this.size = size;
	this.factor = 1;
	this.increment = Math.random() * .03;
}

Star.prototype.draw = function() {
	context.rotate((Math.PI * 1 / 10));
	
	// Save the context
	context.save();
	
	// move into the middle of the canvas, just to make room
	context.translate(this.x, this.y);
	
	// Change the opacity
	if (this.opacity > 1) {
		this.factor = -1;
	}
	else if (this.opacity <= 0) {
		this.factor = 1;
		
		this.x = Math.round(Math.random() * screenW);
		this.y = Math.round(Math.random() * screenH);
	}
	
	this.opacity += this.increment * this.factor;


	context.beginPath();
  	context.arc(10, 10, this.size, 0, Math.PI*2, true);
  	context.closePath();
  	context.fillStyle = 'rgba(255, 255, 200, ' + this.opacity + ')';
  	context.shadowColor = '#fff';
  	context.shadowBlur = 20;
  	context.shadowOffsetX = 2;
  	context.shadowOffsetY = 2;
  	context.fill();
	context.restore();
};

Star.prototype.drawStatic = function() {
	context.rotate((Math.PI * 1 / 10));
	context.save();
	context.translate(this.x, this.y);
	context.beginPath();
    context.arc(10, 10, this.size, 0, Math.PI*2, true);
    context.closePath();
    context.fillStyle = 'rgba(255, 255, 200, 1)';
    context.fill();
	context.restore();
};