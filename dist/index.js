import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import {FlyControls} from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/FlyControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.127.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.127.0/examples/jsm/postprocessing/RenderPass.js';


// import Stats from 'three/examples/jsm/libs/stats.module.js';


// import './style.css'

// import * as dat from 'dat.gui'
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js'

// Debug
// const gui = new dat.GUI()

const canvas = document.querySelector('canvas.webgl')

const radius = 6371;
const tilt = 0.41;
const rotationSpeed = 0.02;

const cloudsScale = 1.005;
const moonScale = 0.23;

let SCREEN_HEIGHT = window.innerHeight;
let SCREEN_WIDTH = window.innerWidth;

let camera, camera2, controls, scene, renderer, stats;
let geometry, meshPlanet, meshClouds, meshMoon;
let dirLight;
let dirLight2;

let composer;

const textureLoader = new THREE.TextureLoader();
const gltfloader = new GLTFLoader();

let d, dPlanet, dMoon, starship;
const dMoonVec = new THREE.Vector3();

const clock = new THREE.Clock();

let basePositionY = 4;
let basePositionZ = 50;
let basePositionX = 0;

let baseSpacecraftY = -20
class Spacecraft {
    constructor(){
        gltfloader.load("static/starship_light.gltf",
        ( gltf ) => {
            camera.add( gltf.scene );
            gltf.scene.scale.set(1, 1, 1);
            gltf.scene.position.set(-0.23, -7, -50);
            gltf.scene.rotation.set(0, 4.7, 7.5);
            
            // var starshipbox = gui.addFolder('starship position');
            // starshipbox.add(gltf.scene.position, 'x', 0, 100).name('X').listen();
            // starshipbox.add(gltf.scene.position, 'y', -50, 200).name('Y').listen();
            // starshipbox.add(gltf.scene.position, 'z', 31000, 33000).name('Z').listen();
            
            // starshipbox.add(gltf.scene.rotation, 'x', 0, 0.1).name('Rotation X').listen();
            // starshipbox.add(gltf.scene.rotation, 'y', 4.6, 4.8).name('Rotation Y').listen();
            // starshipbox.add(gltf.scene.rotation, 'z', -2, 2).name('Rotation Z').listen();

            // starshipbox.add(gltf.scene.scale, 'x', 1, 200).name('scale X').listen();
            // starshipbox.add(gltf.scene.scale, 'y', 1, 200).name('scale Y').listen();
            // starshipbox.add(gltf.scene.scale, 'z', 1, 200).name('scale Z').listen();
            // starshipbox.open();
            
            this.spacecraft = gltf.scene
        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
            console.log( error );
        }

        
    )}

    // update(camera){
    //     if(this.spacecraft){
    //         // this.spacecraft.position.x = camera.position.x + basePositionX
    //         // this.spacecraft.position.y = camera.position.y - basePositionY
    //         // this.spacecraft.position.z = camera.position.z - basePositionZ
    //         let spacecraftWorldRotation = new THREE.Vector3();
    //         camera.getWorldDirection(spacecraftWorldRotation)
    //         console.log(Math.cos(spacecraftWorldRotation.z))
    //         // this.spacecraft.rotation.x = spacecraftWorldRotation.x
    //         this.spacecraft.rotation.z = 1.2*Math.cos(spacecraftWorldRotation.z) + 7
    //     }
    // }
}

const spacecraft = new Spacecraft()

function random(min, max) {
    return Math.random() * (max - min) + min;
  }

class OldSatellite{
    constructor(){
        gltfloader.load("static/old_satellite.gltf",
        ( gltf ) => {
            scene.add( gltf.scene );
            gltf.scene.scale.set(.5, .5, .5);
            gltf.scene.position.set(random(-1000, 1000), random(-1000, 1000), random(10000, 31700));
            gltf.scene.rotation.set(0, random(0, 5), 7.5);

            this.oldSatellite = gltf.scene
        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
            console.log( error );
        }

    )}

    update(delta){
        // this.oldSatellite.position.x += Math.random() * (-1 - 1) + 1;
        // this.oldSatellite.position.y += Math.random() * (-1 - 1) + 1;
        // this.oldSatellite.position.z += Math.random() * (-1 - 1) + 1;

        // this.oldSatellite.rotation.x += Math.random() * (-0.03 - 0.03) + 0.03;
        // this.oldSatellite.rotation.y += Math.random() * (-0.03 - 0.03) + 0.03;

        if (Math.random() < 0.5) {
            this.oldSatellite.rotation.x += 0.01
        } else {
            this.oldSatellite.rotation.y += 0.01
        }
    }

}

async function loadModel(url){
    return new Promise((resolve, reject) => {
        gltfloader.load(url, (gltf) => {
        resolve(gltf.scene)
      })
    })
  }

let spacecraftModel = null
async function createTrash(){
  if(!spacecraftModel){
    spacecraftModel = await loadModel("assets/trash/scene.gltf")
  }
  return new Trash(boatModel.clone())
}

let satellites = []
const SATELLITES_COUNT = 100

init();
animate();
const numberOfObjects = SATELLITES_COUNT + 31

function init() {

    camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 10, 1e7 );
    camera.position.z = radius * 5;

    camera2 = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 10, 1e7 );
    camera2.position.z = radius * 5;

    // const cameraHelper = new THREE.CameraHelper( camera);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );

    scene.add( camera );

    dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( - 1, 0, 1 ).normalize();
    scene.add( dirLight );

    dirLight2 = new THREE.DirectionalLight( 0xffffff );
    dirLight2.position.set( - 1000, 0, 1 ).normalize();
    scene.add( dirLight2 );
    // const light = new THREE.AmbientLight( 0x404040, 100 ); // soft white light
    // scene.add( light );

    const lightSun = new THREE.PointLight( 0xffffff, 400, 73000 );
    lightSun.position.set( -1000, -5898, 80000 );

    // var lightBox = gui.addFolder('point light');
    // lightBox.add(lightSun.position, 'x', -100000, 80000).name('X').listen();
    // lightBox.add(lightSun.position, 'y', -100000, 80000).name('Y').listen();
    // lightBox.add(lightSun.position, 'z', -100000, 80000).name('Z').listen();

    scene.add( lightSun );
    const pointLightSunHelper = new THREE.PointLightHelper( lightSun, 1000, 0xFF0000 );
    scene.add( pointLightSunHelper );

    //scene.add( cameraHelper );

    const lightEarth = new THREE.PointLight( 0xffffff, 100, 10000 );
    lightEarth.position.set( 0, 0, 0 );
  
    // var lightEarthBox = gui.addFolder('point light Earth');
    // lightEarthBox.add(lightEarth.position, 'x', -10000, 40000).name('X').listen();
    // lightEarthBox.add(lightEarth.position, 'y', -10000, 40000).name('Y').listen();
    // lightEarthBox.add(lightEarth.position, 'z', -10000, 40000).name('Z').listen();
    // lightEarthBox.add(lightEarth, 'intensity', -1000, 20000).name('intensity').listen();
  
    scene.add( lightEarth );
    const lightEarthHelper = new THREE.PointLightHelper( lightEarth,  1000, 0x00FF00 );
    scene.add( lightEarthHelper );



    const materialNormalMap = new THREE.MeshPhongMaterial( {

        specular: 0x333333,
        shininess: 15,
        map: textureLoader.load( "static/images/textures/8k_earth_daymap.jpg" ),
        specularMap: textureLoader.load( "static/images/textures/8k_earth_specular_map.jpg" ),
        normalMap: textureLoader.load( "static/images/textures/8k_earth_normal_map.jpg" ),

        // y scale is negated to compensate for normal map handedness.
        normalScale: new THREE.Vector2( 0.85, - 0.85 )

    } );

    // planet

    geometry = new THREE.SphereGeometry( radius, 100, 50 );

    meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
    meshPlanet.rotation.y = 0;
    meshPlanet.rotation.z = tilt;
    scene.add( meshPlanet );

    // clouds

    const materialClouds = new THREE.MeshLambertMaterial( {

        map: textureLoader.load( "static/images/textures/earth_clouds.png" ),
        transparent: true

    } );

    meshClouds = new THREE.Mesh( geometry, materialClouds );
    meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
    meshClouds.rotation.z = tilt;
    scene.add( meshClouds );

    // // moon

    const materialMoon = new THREE.MeshPhongMaterial( {

    	map: textureLoader.load( "static/images/textures/moon/2k_moon_map.jpg" ),
        specularMap: textureLoader.load( "static/images/textures/moon/2k_moon_bump.jpg" )

    } );

    meshMoon = new THREE.Mesh( geometry, materialMoon );
    meshMoon.position.set( radius * 5, 0, 0 );
    meshMoon.rotation.set( 4, 3, 5 );
    meshMoon.scale.set( moonScale, moonScale, moonScale );
    // var moonBox = gui.addFolder('Moon');
    // moonBox.add(meshMoon.rotation, 'x', -10, 10).name('Rotation X').listen();
    // moonBox.add(meshMoon.rotation, 'y', -10, 10).name('Rotation Y').listen();
    // moonBox.add(meshMoon.rotation, 'z', -10, 10).name('Rotation Z').listen();
    scene.add( meshMoon );

    // stars

    const r = radius, starsGeometry = [ new THREE.BufferGeometry(), new THREE.BufferGeometry() ];

    const vertices1 = [];
    const vertices2 = [];

    const vertex = new THREE.Vector3();

    for ( let i = 0; i < 250; i ++ ) {

        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        vertex.multiplyScalar( r );

        vertices1.push( vertex.x, vertex.y, vertex.z );

    }

    for ( let i = 0; i < 1500; i ++ ) {

        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        vertex.multiplyScalar( r );

        vertices2.push( vertex.x, vertex.y, vertex.z );

    }

    starsGeometry[ 0 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices1, 3 ) );
    starsGeometry[ 1 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices2, 3 ) );

    const starsMaterials = [
        new THREE.PointsMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
        new THREE.PointsMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
        new THREE.PointsMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
        new THREE.PointsMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
        new THREE.PointsMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
        new THREE.PointsMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
    ];

    for ( let i = 10; i < 30; i ++ ) {

        const stars = new THREE.Points( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

        stars.rotation.x = Math.random() * 6;
        stars.rotation.y = Math.random() * 6;
        stars.rotation.z = Math.random() * 6;
        stars.scale.setScalar( i * 10 );

        stars.matrixAutoUpdate = false;
        stars.updateMatrix();

        scene.add( stars );

    }


    for(let i = 0; i < SATELLITES_COUNT; i++){
        const oldSatellite = new OldSatellite()
        satellites.push(oldSatellite)
    }

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true, alpha:false } );
    renderer.setPixelRatio( window.devicePixelRatio, 2 );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    document.body.appendChild( renderer.domElement );

    //

    controls = new FlyControls( camera, renderer.domElement );
    //controls = new OrbitControls( camera2, renderer.domElement );

    controls.movementSpeed = 500;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 100;
    controls.autoForward = false;
    controls.dragToLook = false;

    //

    // stats = new Stats();
    // document.body.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize );

    // postprocessing

    const renderModel = new RenderPass( scene, camera );

    composer = new EffectComposer( renderer );

    composer.addPass( renderModel );

}

function onWindowResize() {

    SCREEN_HEIGHT = window.innerHeight;
    SCREEN_WIDTH = window.innerWidth;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    camera2.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera2.updateProjectionMatrix();

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    composer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

}

function isColliding(obj1, obj2){
    return (
      Math.abs(obj1.x - obj2.x) < 5 &&
      Math.abs(obj1.z - obj2.z) < 5
    )
  }


function checkCollisions(){

if(spacecraft.spacecraft){
    let spacecraftWorldPosition = new THREE.Vector3();
    spacecraft.spacecraft.getWorldPosition(spacecraftWorldPosition)
    satellites.forEach(satellite => {
    if(satellite.oldSatellite){
        const delta = clock.getDelta();
        satellite.update(delta);
        let satelliteWolrdPosition = new THREE.Vector3();
        satellite.oldSatellite.getWorldPosition(satelliteWolrdPosition)
        if(isColliding(spacecraftWorldPosition, satelliteWolrdPosition)){
            scene.remove(satellite.oldSatellite)
            document.getElementById("counter-cleanup").innerHTML = numberOfObjects - scene.children.length;
        }
    }
    })
}
}


function animate() {

    requestAnimationFrame( animate );
    render();
    // spacecraft.update(camera);
    // stats.update();
    checkCollisions()

}

function render() {

    // rotate the planet and clouds

    const delta = clock.getDelta();

    meshPlanet.rotation.y += rotationSpeed * delta;
    meshClouds.rotation.y += 1.25 * rotationSpeed * delta;
    // slow down as we approach the surface

    dPlanet = camera2.position.length();

    dMoonVec.subVectors( camera2.position, meshMoon.position );
    dMoon = dMoonVec.length();

    if ( dMoon < dPlanet ) {

    	d = ( dMoon - radius * moonScale * 1.01 );

    } else {

    	d = ( dPlanet - radius * 1.01 );

    }

    d = ( dPlanet - radius * 1.01 );


	controls.update( delta );
	composer.render( delta );

    //controls.update();
}
