// window.console.clear();


if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
      let container, stats, clock;
      let camera, scene, renderer, logo, spotLight;

      if (navigator.userAgent.search(/Trident/) < 0) {
        init();
        animate();
      }


      function init() {
        container = document.getElementById( 'front' );
        container.style.height = window.innerHeight + 'px';
        camera = new THREE.PerspectiveCamera( 67.5 , window.innerWidth / window.innerHeight, 0.1, 1000 );//45
        camera.position.set( -550, 100, 280 ); //-200

        scene = new THREE.Scene();
        clock = new THREE.Clock();

        // loading manager

        let loadingManager = new THREE.LoadingManager( function() {
          scene.add( logo );
        } );

        // loader

        let loader = new THREE.ColladaLoader( loadingManager );
        // let textureLoader = new THREE.TextureLoader();
        // let texture = textureLoader.load('img/texture.jpg');

        // console.log(material);

        // loader.load( 'https://raw.githubusercontent.com/davegahn/test2/master/F4.dae', function( collada ) {
        //   logo = collada.scene;
            // collada.scene.traverse(function (node) {
            //   if (node instanceof THREE.Mesh) {
            //     node.material = material;
            //     node.material.magFilter = 5;
            //     // node.material.map = texture;
            //     console.log(node.material);
            //       // node.castShadow = true;
              // // node.receiveShadow = true;
            //     // node.material.flatShading = true;
            //   }
            // });
        // });

        loader.load( 'https://raw.githubusercontent.com/davegahn/test2/master/F4.dae', function( collada ) {
          logo = collada.scene;
          mesh = logo.children[0].children[2];

          var children = [];
          mesh.traverse(function(child){
            if(child.geometry && child.geometry.attributes.uv){
              if(child.geometry.attributes.uv.count != child.geometry.attributes.position.count){
                children.push(child);
              }
            }
          });

          for(var i = 0; i < children.length; i++){
            mesh.remove(children[i]);
          }

          console.log(children);
        });


        // lights

        let ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );// 0xcccccc
        scene.add( ambientLight );

        let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
        directionalLight.position.set( -3, 0, 5 ).normalize();
        scene.add( directionalLight );

            spotLight = new THREE.PointLight( 0xffffff, 3, 170); //0xffffff, 0.6, 100
            spotLight2 = new THREE.PointLight( 0xffffff, 2, 170 ); //0xffffff, 0.6, 100
            spotLight3 = new THREE.PointLight( 0xffffff, 2, 150 ); //0xffffff, 0.6, 100
            spotLight4 = new THREE.PointLight( 0xff0040, 3, 170 ); //0xffffff, 0.6, 100

            spotLight.position.set( 200, -200, 170 );
            spotLight2.position.set( -150, -150, 150 );
            spotLight3.position.set( -170, 170, 150 );
            spotLight4.position.set( -200, -200, 170 );

            spotLight.castShadow = true;
            spotLight2.castShadow = true;
            spotLight3.castShadow = true;
            spotLight4.castShadow = true;
        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;

        // spotLight.shadow.camera.near = 500;
        // spotLight.shadow.camera.far = 4000;
        // spotLight.shadow.camera.fov = 30;

            scene.add( spotLight );
            scene.add( spotLight2 );
            scene.add( spotLight3 );
            scene.add( spotLight4 );

        // var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
        // directionalLight.position.set( 1, 1, 0 ).normalize();
        // scene.add( directionalLight );

        // renderer
        renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio( window.devicePixelRatio );
        var containerSecWidth = $('#front').width();
        renderer.setSize( containerSecWidth, window.innerHeight );
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.left = 0;
        container.appendChild( renderer.domElement );

        renderer.shadowMapEnabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMapDarkness = 0.5;

        // helpers

        // let directionalLighthelper = new THREE.DirectionalLightHelper( directionalLight, 200 );
        // scene.add( directionalLighthelper );

    // var sphereSize = 5;
    // var pointLightHelper = new THREE.PointLightHelper( spotLight, sphereSize );
    // scene.add( pointLightHelper );

    // var sphereSize2 = 5;
    // var pointLightHelper2 = new THREE.PointLightHelper( spotLight2, sphereSize2 );
    // scene.add( pointLightHelper2 );

    // var sphereSize3 = 5;
    // var pointLightHelper3 = new THREE.PointLightHelper( spotLight3, sphereSize3 );
    // scene.add( pointLightHelper3 );

    // var sphereSize4 = 5;
    // var pointLightHelper4 = new THREE.PointLightHelper( spotLight4, sphereSize4 );
    // scene.add( pointLightHelper4 );

        // var CameraHelper = new THREE.CameraHelper( camera );
        // scene.add( CameraHelper );

  //       spotLight4.shadow.mapSize.width = 512;  // default
    // spotLight4.shadow.mapSize.height = 512; // default
    // spotLight4.shadow.camera.near = 1;       // default
    // spotLight4.shadow.camera.far = 200;
    // spotLight4.shadow.bias = - 0.005;     // default


  //       var spotHelper = new THREE.CameraHelper( spotLight3.shadow.camera );
    // scene.add( spotHelper );


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

    var stopAnimate= false;


  function animate(stopAnimate) {
    spin();
    requestAnimationFrame( animate );
    // stats.update();
  }





      function spin() {
        let time = Date.now() * 0.001;
        let delta = clock.getDelta();
        if ( logo !== undefined ) {
          // logo.rotation.z += delta * 0.4;
          logo.rotation.y += delta * 0.2;

          spotLight.position.x = -Math.sin( time * 0.7 ) * 100;
          spotLight.position.y = -Math.cos( time * 0.5 ) * 100;
      // spotLight.position.z = Math.cos( time * 0.3 ) * 150;


          // spotLight2.position.x = Math.sin( time * 0.6 ) * 100;
          spotLight2.position.y = Math.sin( time * 0.8 ) * 100;
      spotLight2.position.z = Math.cos( time * 0.5 ) * 100;

          // spotLight3.position.x = -Math.cos( time * 0.7 ) * 100;
          spotLight3.position.y = -Math.sin( time * 0.8 ) * 100;
      spotLight3.position.z = -Math.cos( time * 0.5 ) * 100;

          // spotLight4.position.x = Math.cos( time * 0.7 ) * 120;
          spotLight4.position.y = Math.sin( time * 0.8 ) * 150;
      spotLight4.position.z = Math.sin( time * 0.5 ) * 150;

          if(stopAnimate) {
            return;
      }
        }
        renderer.render( scene, camera );
      }

      // logo controls

  // let playBtn = document.querySelector('.control-play');
  // let stopBtn = document.querySelector('.control-pause');

  // playBtn.addEventListener('click', function(evt) {
  //   stopBtn.classList.remove('control-active');
  //   playBtn.classList.add('control-active');
  //   stopAnimate = false;
  //   animate(stopAnimate);
  // }, false);
  // stopBtn.addEventListener('click',function() {
  //   playBtn.classList.remove('control-active');
  //   stopBtn.classList.add('control-active');
  //   stopAnimate = true;
  // }, false);

  // const gl = $('canvas')[1].getContext('webgl');
  // var ext = gl.getExtension("OES_texture_float");
  // console.log(ext);


// --------------------------------------------------star sky-----------------------------------//
// ---------------------------------------------------------------------------------------------//

let canvas;
var context;
var screenH;
var screenW;
var stars = [];
var staticSMStars = [];
var bigStaticStars = [];
var fps = 60;
var numStars = 400;
var numSMStaticStars = 1240;
var numBigStaticStars = 200;

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
    // staticSMStars.push(staticSMStar);
  }


 //  // Create big static stars

  for (let i = 0; i < numBigStaticStars; i++) {
    let x = Math.round(Math.random() * screenW);
    let y = Math.round(Math.random() * screenH);
      // var length = 3 + Math.random() * 1.5;
      var size = 3;

    var bigStaticStar = new Star(x, y, size);
    // bigStaticStars.push(bigStaticStar);
  }

  // // Create dynamic stars
  for (let i = 0; i < numStars; i++) {
    let x = Math.round(Math.random() * screenW);
    let y = Math.round(Math.random() * screenH);
    let opacity = Math.random();
      // var length = 5 + Math.random() * 1.5;
      let size = 4;
    let star = new Star(x, y, size, opacity);

    // Add the the stars array
    // stars.push(star);
  }

 //  // console.log(stars);
 //  // console.log(staticStars);
 //  // console.log(staticSMStars);

  // animateInterval = setInterval(animateStars, 1000 / fps);
  // if (navigator.userAgent.search(/Trident/) < 0) {
  //   (function animateSky(){
  //     requestAnimationFrame ( animateSky );
  //     animateStars();
  //   })();
  // }

});

/**
 * Animate the canvas
 */
function animateStars() {
  context.clearRect(0, 0, screenW, screenH); //
    context.clearRect(0, 0, canvas.width, canvas.height);
  // $.each(stars, function() {
  //  this.draw(context);
  // });
    $.each(bigStaticStars, function() {
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
  //  context.lineTo(0, this.length);
  //  context.translate(0, this.length);
  //  context.rotate((Math.PI * 2 / 10));
  //  context.lineTo(0, - this.length);
  //  context.translate(0, - this.length);
  //  context.rotate(-(Math.PI * 6 / 10));
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
  //  context.lineTo(0, this.length);
  //  context.translate(0, this.length);
  //  context.rotate((Math.PI * 2 / 10));
  //  context.lineTo(0, - this.length);
  //  context.translate(0, - this.length);
  //  context.rotate(-(Math.PI * 6 / 10));
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
