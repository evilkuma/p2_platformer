
/** 
 * created by example http://jsfiddle.net/sad5ztmw/2/
 * 
 * 
 * adaptive from three.js by @evilkuma
 * 
 */

function randomInt(min, max) {

    return Math.floor(min + Math.random() * (max + 1 - min))

}

/**
 * init scene
 */

var scene = new THREE.Scene()

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 )
camera.position.z = 5

var lights = []
lights[ 0 ] = new THREE.PointLight( 0xffe7cc, 1, 50 )
lights[ 1 ] = new THREE.PointLight( 0xffe7cc, 1, 50 )
lights[ 2 ] = new THREE.PointLight( 0xffe7cc, 1, 50 )

lights[ 0 ].position.set( 10, 20, 10 )
lights[ 1 ].position.set( -10, 20, 10 )
lights[ 2 ].position.set( -10, -20, 10 )

scene.add( ...lights )

var renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize( window.innerWidth, window.innerHeight )

document.body.appendChild( renderer.domElement )

var lastTime, timeStep=1/60, maxSubSteps=10, jumpSpeed=6, walkSpeed=2,world, characterBody, planeBody, platforms=[], boxes=[];

var buttons = {
  space : false,
  left :  false,
  right : false,
}

var animate = function (t) {
    requestAnimationFrame( animate )
    
    var dt = t !== undefined && lastTime !== undefined ? t / 1000 - lastTime : 0;

    // if(buttons.right)
    //   characterBody.velocity[0] =  walkSpeed;
    // else if(buttons.left)
    //   characterBody.velocity[0] = -walkSpeed;
    // else
    //   characterBody.velocity[0] = 0;

    world.step(timeStep, dt, maxSubSteps)
    render()

    lastTime = t / 1000

};

/**
 * init raycater
 */
var raycaster = new THREE.Raycaster
var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1))

var obj = false
var objs = []
var toPosition = new THREE.Vector3

renderer.domElement.addEventListener('mousemove', function(e) {

  raycaster.setFromCamera( new THREE.Vector2(
    ( e.clientX / window.innerWidth ) * 2 - 1,
    - ( e.clientY / window.innerHeight ) * 2 + 1
  ), camera );

  if(obj) {

    var mv = raycaster.ray.intersectPlane(plane, toPosition).clone().sub({x: obj.body.position[0], y: obj.body.position[1], z: 0}).multiplyScalar(10)

    obj.body.velocity[0] = mv.x
    obj.body.velocity[1] = mv.y

  } else {

    // objs.forEach(o => o.mark(false))

    // var info = raycaster.intersectObjects(objs)

    // if(info[0]) info[0].object.mark('red')

  }

}, false)

renderer.domElement.addEventListener('mousedown', function(e) {

  // objs.forEach(o => o.mark(false))

  var info = raycaster.intersectObjects(objs)

  if(info[0]) {

    // info[0].object.mark('green')
    obj = info[0].object

  }

}, false)

renderer.domElement.addEventListener('mouseup', function(e) {

  if(obj) {
    // obj.mark('red')
    obj.body.velocity[0] = 0
    obj.body.velocity[1] = 0
    console.log('zero')
    obj = false
  }

}, false)


/**
 * init b2 and create objects
 */

world = new p2.World({
  gravity:[0, 0]
});

world.defaultContactMaterial.friction = 1;
world.setGlobalStiffness(1e5);

var groundMaterial = new p2.Material(),
    characterMaterial = new p2.Material(),
    boxMaterial = new p2.Material();

characterShape = new p2.Box({ width: 0.5, height: 1 });
characterBody = new p2.Body({
  mass: 1,
  position:[0,0],
  angle: Math.PI/4,
  fixedRotation: true,
});
characterBody.addShape(characterShape);
world.addBody(characterBody);
characterShape.material = groundMaterial;
characterBody.damping = 0//.5;
// characterBody.type = p2.Body.DYNAMIC
var mesh = new THREE.Mesh(new THREE.BoxGeometry(.5, 1, 1), new THREE.MeshPhongMaterial({color: 'red'}))
mesh.body = characterBody
mesh.rotation.z = Math.PI/4
scene.add(mesh)
objs.push(mesh)

planeShape = new p2.Plane();
planeBody = new p2.Body({
  position:[0,-1]
});
planeBody.addShape(planeShape);
world.addBody(planeBody);
planeShape.material = groundMaterial;
var mesh = new THREE.Mesh(new THREE.BoxGeometry(9, .04, 10), new THREE.MeshPhongMaterial({color: 'green'}))
mesh.body = planeBody
scene.add(mesh)

var platformPositions = [[2,0],[0,1],[-2,2]];
for(var i=0; i<platformPositions.length; i++){
  var platformBody = new p2.Body({
    mass: 0, // Static
    position:platformPositions[i],
  });
  platformBody.type = p2.Body.KINEMATIC;
  var platformShape = new p2.Box({ width: 1, height: 0.3 });
  platformShape.material = groundMaterial;
  platformBody.addShape(platformShape);
  world.addBody(platformBody);
  platforms.push(platformBody);

  var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, .3, 1), new THREE.MeshPhongMaterial({color: 'green'}))
  mesh.body = platformBody
  scene.add(mesh)

}

// var boxPositions = [[2,1],[0,2],[-2,3]];
// for(var i=0; i<boxPositions.length; i++){
//   var boxBody = new p2.Body({
//     mass: 0,
//     position:boxPositions[i],
//   });
//   var boxShape = new p2.Box({ width: 0.8, height: 0.8 });
//   boxShape.material = boxMaterial;
//   boxBody.addShape(boxShape);
//   world.addBody(boxBody);
//   boxes.push(boxBody);
// }

var groundCharacterCM = new p2.ContactMaterial(groundMaterial, characterMaterial,{
  friction : 0.0, // No friction between character and ground
});
var boxCharacterCM = new p2.ContactMaterial(boxMaterial, characterMaterial,{
  friction : 0.0, // No frictSTATICion between character and boxes
});
var boxGroundCM = new p2.ContactMaterial(boxMaterial, groundMaterial,{
  friction : 0.6, // Between boxes and ground
});
world.addContactMaterial(groundCharacterCM);
world.addContactMaterial(boxCharacterCM);
world.addContactMaterial(boxGroundCM);

// Allow pass through platforms from below
var passThroughBody;

// world.on('beginContact', function (evt){
//   if(evt.bodyA !== characterBody && evt.bodyB !== characterBody) return;
//   var otherBody = evt.bodyA === characterBody ? evt.bodyB : evt.bodyA;
//   if(platforms.indexOf(otherBody) !== -1 && otherBody.position[1] > characterBody.position[1]){
//     passThroughBody = otherBody;
//   }
// });

// // Disable any equations between the current passthrough body and the character
// world.on('preSolve', function (evt){
//   for(var i=0; i<evt.contactEquations.length; i++){
//     var eq = evt.contactEquations[i];
//     if((eq.bodyA === characterBody && eq.bodyB === passThroughBody) || eq.bodyB === characterBody && eq.bodyA === passThroughBody){
//       eq.enabled = false;
//     }
//   }
//   for(var i=0; i<evt.frictionEquations.length; i++){
//     var eq = evt.frictionEquations[i];
//     if((eq.bodyA === characterBody && eq.bodyB === passThroughBody) || eq.bodyB === characterBody && eq.bodyA === passThroughBody){
//       eq.enabled = false;
//     }
//   }
// });

// world.on('endContact', function (evt){
//   if((evt.bodyA === characterBody && evt.bodyB === passThroughBody) || evt.bodyB === characterBody && evt.bodyA === passThroughBody){
//     passThroughBody = undefined;
//   }
// });

// world.on('postStep', function(){
//   for(var i=0; i<platforms.length; i++){
//     platforms[i].velocity[0] = 2*Math.sin(world.time);
//   }
// });

/**
 * run loop
 */

animate()

/**
 * functions
 */

function render() {

  scene.children.forEach(child => child.body ? child.position.set(...child.body.position, 0) : 0)
    
  if(obj) {

    if( (obj.body.velocity[0] || obj.body.velocity[1]) && ( obj.body.position[0] !== toPosition.x || obj.body.position[1] !== toPosition.y ) ) {

      var mv = toPosition.clone().sub({x: obj.body.position[0], y: obj.body.position[1], z: 0}).multiplyScalar(10)
  
      obj.body.velocity[0] = mv.x
      obj.body.velocity[1] = mv.y
      console.log('these')
  
    } else {
  
      obj.body.velocity[0] = 0
      obj.body.velocity[1] = 0
  
    }

  }

  objs.forEach(o => {
    if(o !== obj) {
      o.body.velocity[0] = 0
      o.body.velocity[1] = 0
    }
  })

  renderer.render( scene, camera );

}
