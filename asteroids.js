
var canvas, gl;

var shotColors = [
  [ 0.000, 0.000, 0.000, 1.0 ], // black
  [ 0.055, 0.196, 0.016, 1.0 ], // dark dark green
  [ 0.082, 0.200, 0.051, 1.0 ], // dark green
  [ 0.271, 0.576, 0.192, 1.0 ], // green
  [ 0.482, 0.898, 0.373, 1.0 ], // light green
  [ 0.600, 0.898, 0.522, 1.0 ], // light light green
  [ 0.271, 0.576, 0.192, 1.0 ], // green
  [ 1.000, 1.000, 1.000, 1.0 ]  // white
];

var asteroidColors = [
  [ 0.1, 0.1, 0.1, 1.0 ], // various grey tones
  [ 0.2, 0.2, 0.2, 1.0 ],
  [ 0.3, 0.3, 0.3, 1.0 ],
  [ 0.4, 0.4, 0.4, 1.0 ],
  [ 0.5, 0.5, 0.5, 1.0 ],
  [ 0.6, 0.6, 0.6, 1.0 ],
  [ 0.7, 0.7, 0.7, 1.0 ],
  [ 0.8, 0.8, 0.8, 1.0 ]
];

var alienColors = [
    [ 0.0, 0.0, 0.0, 1.0 ],  // black
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    [ 1.0, 1.0, 1.0, 1.0 ]   // white
];

// ATH! FINNA FLEIRI LITI
var alienShotColors = [
  [ 1.000, 0.000, 0.000, 1.0 ], // various red colors
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ],
  [ 1.000, 0.000, 0.000, 1.0 ]
];

var SHOT_SOUND = new Audio("laser.wav");
var BOMB_SOUND = new Audio("bomb.wav");
var ALIEN_SOUND = new Audio("alien.wav");
var ENGINE_SOUND = new Audio("jet.wav");
var ALIEN_FIRE_SOUND = new Audio("alienshot.wav");
var NUM_VERTICES  = 36;
var INITIAL_ASTEROID_NUMBER = 4;
var INITIAL_ASTEROID_SIZE = 12;
var SHOT_SIZE = 0.2;
var ALIEN_SHOT_SIZE = 3;
var ALIEN_SIZE = 8;
var ALIEN_APPEARANCE_INTERVAL = 10000; // 10 seconds
var ALIEN_FIRE_INTERVAL = 5000 // 5 seconds
var SHOT_COOLDOWN = 500;
var MAX_SPEED = 2;
var FRICTION = 0.98;
var RADIUS = 1000000;
var BOUNDARY = 100;
var TOTAL_SHOTS = 4;

var theta = (Math.PI / 2);
var phi = 0;
var xAt = RADIUS * Math.sin(theta) * Math.cos(phi);
var yAt = RADIUS * Math.sin(theta) * Math.sin(phi);
var zAt = RADIUS * Math.cos(theta);
var xEye = 0, yEye = 0, zEye = 0;

var score = 0;
var movementDisabled = true;
var points = [], colors = [];
var mvLoc, pLoc, proj, vBuffer, vPosition, colorLoc;
var keyState = {};
var velocity = 0;
var shotsAllowed = 4;
var matrixLoc;
var timeTick;

var astNum = 0;
var astPosX = [], astPosY = [], astPosZ = [];
var astDirectionTheta = [], astDirectionPhi = [], asteroidSize = [], astAlive = [];

var shotPosX = [], shotPosY = [], shotPosZ = [];
var shotDirectionTheta = [], shotDirectionPhi = [], shotInGame = [];

var alienNum = 0;
var alienPosX = [], alienPosY = [], alienPosZ = [];
var alienDirectionTheta = [], alienDirectionPhi = [], alienAlive = [];

var alienShotNum = 0;
var alienShotPosX = [], alienShotPosY = [], alienShotPosZ = [];
var alienShotDirX = [], alienShotDirY = [], alienShotDirZ = [], alienShotInGame = [];

var shotTimer = Date.now();

var renderInterval, gameInterval, alienCreationInterval, alienFireIntervals = [];

window.onload = function init() {
  canvas = document.getElementById( "gl-canvas" );
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  initializeAsteroids();
  initializeShots();
  cube(asteroidColors, true);   // asteroid
  cube(shotColors, true);       // shot
  cube(alienColors, false);     // alien
  cube(alienShotColors, true);  // alien shot

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
  gl.enable(gl.DEPTH_TEST);
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

  vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  // event listeners for smooth-motion & more
  window.addEventListener('keydown',function(e) {
    if(e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 32)
      e.preventDefault(); // prevent scrolling for UP/DOWN/SPACE keys
    else if(e.keyCode === 13)
      newGame(); // ENTER: play new game
    keyState[e.keyCode || e.which] = true;
  }, true);
  window.addEventListener('keyup',function(e) {
    keyState[e.keyCode || e.which] = false;
  }, true);

  colorLoc = gl.getUniformLocation( program, "vColor" );
  mvLoc = gl.getUniformLocation( program, "modelview" );
  // set projection
  pLoc = gl.getUniformLocation( program, "projection" );
  proj = perspective( 50.0, 1.0, 1.0, 500.0 );
  gl.uniformMatrix4fv(pLoc, false, flatten(proj));
  timeTick = Date.now();

  // Event-listener for new game
  document.getElementById("new-game").addEventListener("click", newGame);

  alienCreationInterval = setInterval(createAlien, ALIEN_APPEARANCE_INTERVAL);
  gameInterval = setInterval(gameLoop, 10);
  renderInterval = setInterval(render, 10);
  render();
}

function gameLoop() {
  if(keyState[32]) { // SPACE
    if((Date.now() - shotTimer) > SHOT_COOLDOWN && shotsAllowed > 0) {
      SHOT_SOUND.play();
      shoot();
      shotTimer = Date.now();
      shotsAllowed--;
    }
  }
  if (keyState[37]) { // LEFT
    phi += (Math.PI / 180.0);
  }
  if (keyState[39]) { // RIGHT
    phi -= (Math.PI / 180.0);
  }
  if (keyState[38]) { // UP
    if(theta - (Math.PI / 180.0) > (Math.PI / 6.0))
      theta -= (Math.PI / 180.0);
  }
  if (keyState[40]) { // DOWN
    if(theta + (Math.PI / 180.0) < 5.0 * (Math.PI / 6.0))
      theta += (Math.PI / 180.0);
  }
  if (keyState[17]) { // CTRL
    if(movementDisabled) {
      ENGINE_SOUND.play();
      movementDisabled = false;
    }
    if(ENGINE_SOUND.currentTime >= 4) {
      ENGINE_SOUND.currentTime = 0;
      ENGINE_SOUND.play();
    }
    if(velocity < MAX_SPEED) {
      velocity += 0.01;
    }
  } else {
    ENGINE_SOUND.pause();
    if(!movementDisabled) movementDisabled = true;
    if(velocity > 0) velocity *= FRICTION;
  }

  var v = velocity / RADIUS;
  if(xEye + v*xAt < BOUNDARY && xEye + v*xAt > -BOUNDARY) xEye += v*xAt;
  if(yEye + v*yAt < BOUNDARY && yEye + v*yAt > -BOUNDARY) yEye += v*yAt;
  if(zEye + v*zAt < BOUNDARY && zEye + v*zAt > -BOUNDARY) zEye += v*zAt;

  xAt = RADIUS * Math.sin(theta) * Math.cos(phi);
  yAt = RADIUS * Math.sin(theta) * Math.sin(phi);
  zAt = RADIUS * Math.cos(theta);

  collisionDetection();
}

function cube(colors, type) {
    quad( 1, 0, 3, 2, colors, type );
    quad( 2, 3, 7, 6, colors, type );
    quad( 3, 0, 4, 7, colors, type );
    quad( 6, 5, 1, 2, colors, type );
    quad( 4, 5, 6, 7, colors, type );
    quad( 5, 4, 0, 1, colors, type );
}

function quad(a, b, c, d, col, type) {
      var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        if(type) colors.push( col[a] );
        else colors.push( col[indices[i]] );
    }
}

function initializeAsteroids() {
  for(var i = 0; i < INITIAL_ASTEROID_NUMBER; i++) {
    var x = (Math.random()*200)-100, y = (Math.random()*200)-100, z = (Math.random()*200)-100;
    var phi = 2*Math.PI*Math.random(), theta = Math.PI*Math.random();
    createAsteroid(x, y, z, phi, theta, INITIAL_ASTEROID_SIZE);
  }
}

function initializeShots() {
  for(var i = 0; i < TOTAL_SHOTS; i++) {
    shotPosX.push(0);
    shotPosY.push(0);
    shotPosZ.push(0);
    shotDirectionPhi.push(0);
    shotDirectionTheta.push(0);
    shotInGame.push(false);
  }
}

function shoot() {
  for(var i = 0; i < TOTAL_SHOTS; i++) {
    if(!shotInGame[i]) {
      shotInGame[i] = true;
      shotPosX[i] = xEye;
      shotPosY[i] = yEye;
      shotPosZ[i] = zEye - 0.5;
      shotDirectionPhi[i] = phi;
      shotDirectionTheta[i] = theta;
      break;
    }
  }
}

function createAsteroid(x, y, z, phi, theta, size){
  astAlive.push(true);
  asteroidSize.push(size);
  astPosX.push(x);
  astPosY.push(y);
  astPosZ.push(z);
  astDirectionPhi.push(phi);
  astDirectionTheta.push(theta);
  astNum++;
}

function createAlien() {

  createAlienShot();

  alienAlive.push(true);
  var x, y, z, coord1, coord2, coord3;
  var randomCase = Math.floor(Math.random() * 3); // 0, 1, 2
  coord1 = (Math.random() * 2*BOUNDARY) - BOUNDARY;
  coord2 = (Math.random() * 2*BOUNDARY) - BOUNDARY;
  if(Math.random() < 0.5) coord3 = BOUNDARY;
  else coord3 = -BOUNDARY;

  // Let alien appear at random location on space-boundary
  switch(randomCase) {
    case 0:
      x = coord1;
      y = coord2;
      z = coord3;
      break;
    case 1:
      x = coord1;
      y = coord3;
      z = coord2;
      break;
    case 2:
      x = coord3;
      y = coord1;
      z = coord2;
  }

  alienPosX.push(x);
  alienPosY.push(y);
  alienPosZ.push(z);
  alienDirectionPhi.push(2 * Math.PI * Math.random());
  alienDirectionTheta.push(Math.PI * Math.random());
  ALIEN_SOUND.play();
  alienNum++;
}

function createAlienShot() {
  alienShotInGame.push(false);
  alienShotPosX.push(0);
  alienShotPosY.push(0);
  alienShotPosZ.push(0);
  alienShotDirX.push(0);
  alienShotDirY.push(0);
  alienShotDirZ.push(0);
  createAlienFireInterval(alienShotPosX.length - 1);
  alienShotNum++;
}

function createAlienFireInterval(index) {
  var m = setInterval( alienFire, ALIEN_FIRE_INTERVAL, index );
  alienFireIntervals.push( m );
}

function alienFire(index) {
  if(!alienShotInGame[index]) {
    ALIEN_FIRE_SOUND.play();
    alienShotInGame[index] = true;
    alienShotPosX[index] = alienPosX[index];
    alienShotPosY[index] = alienPosY[index];
    alienShotPosZ[index] = alienPosZ[index] - 0.5;
    /*yaw = arctan( (x2-x1) / (z2 - z1))
    pitch = arctan( (z2-z1) / (y2 - y1))
    roll = arctan( (y2-y1) / (x2 - x1))*/
    alienShotDirY[index] = Math.atan( (xEye - alienPosX[index]) / (zEye - alienPosZ[index]) );
    alienShotDirZ[index] = Math.atan( (zEye - alienPosZ[index]) / (yEye - alienPosY[index]) );
    alienShotDirX[index] = Math.atan( (yEye - alienPosY[index]) / (xEye - alienPosX[index]) );
  }
}

// itemIndex = 0: Draws asteroid
// itemIndex = 1: Draws shot
// itemIndex = 2: Draws alien
// itemIndex = 3: Draws alien shot
function drawItem( x, y, z, size, mv, itemIndex ) {
  mv = mult( mv, translate( x, y, z ) );
  mv = mult( mv, scalem( size, size, size ) );

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, itemIndex*NUM_VERTICES, NUM_VERTICES );
}

function drawAsteroids( mv, t ) {
  for(var i = 0; i < astNum; i++){

    var xmove = Math.sin(astDirectionTheta[i])*Math.cos(astDirectionPhi[i]);
    var ymove = Math.sin(astDirectionTheta[i])*Math.sin(astDirectionPhi[i]);
    var zmove = Math.cos(astDirectionTheta[i]);

    if(astPosX[i] > BOUNDARY && xmove > 0) astPosX[i] -= (2*BOUNDARY + 10);
    if(astPosX[i] < -BOUNDARY && xmove < 0) astPosX[i] += (2*BOUNDARY + 10);
    if(astPosY[i] > BOUNDARY && ymove > 0) astPosY[i] -= (2*BOUNDARY + 10);
    if(astPosY[i] < -BOUNDARY && ymove < 0) astPosY[i] += (2*BOUNDARY + 10);
    if(astPosZ[i] > BOUNDARY && zmove > 0) astPosZ[i] -= (2*BOUNDARY + 10);
    if(astPosZ[i] < -BOUNDARY && zmove < 0) astPosZ[i] += (2*BOUNDARY + 10);

    astPosX[i] += (t * xmove);
    astPosY[i] += (t * ymove);
    astPosZ[i] += (t * zmove);
    if(astAlive[i]) {
      drawItem( astPosX[i], astPosY[i], astPosZ[i], asteroidSize[i], mv, 0);
    }
  }
}

function drawShots( mv, t ) {
  for(var i = 0; i < TOTAL_SHOTS; i++) {

    var xmove = Math.sin(shotDirectionTheta[i])*Math.cos(shotDirectionPhi[i]);
    var ymove = Math.sin(shotDirectionTheta[i])*Math.sin(shotDirectionPhi[i]);
    var zmove = Math.cos(shotDirectionTheta[i]);

    shotPosX[i] += (10 * t * xmove);
    shotPosY[i] += (10 * t * ymove);
    shotPosZ[i] += (10 * t * zmove);

    if(shotPosX[i] < BOUNDARY && shotPosX[i] > -BOUNDARY && shotPosY[i] < BOUNDARY && shotPosY[i] > -BOUNDARY && shotPosZ[i] < BOUNDARY && shotPosZ[i] > -BOUNDARY) {
      drawItem( shotPosX[i], shotPosY[i], shotPosZ[i], SHOT_SIZE, mv, 1);
    } else if(shotInGame[i] === true){
      shotInGame[i] = false;
      shotsAllowed++;
    }
  }
}

function drawAliens( mv, t ) {
  for(var i = 0; i < alienNum; i++){

    var xmove = Math.sin(alienDirectionTheta[i])*Math.cos(alienDirectionPhi[i]);
    var ymove = Math.sin(alienDirectionTheta[i])*Math.sin(alienDirectionPhi[i]);
    var zmove = Math.cos(alienDirectionTheta[i]);

    alienPosX[i] += (t * xmove);
    alienPosY[i] += (t * ymove);
    alienPosZ[i] += (t * zmove);

    if(alienPosX[i] > BOUNDARY && xmove > 0) alienPosX[i] -= (2*BOUNDARY + 10);
    if(alienPosX[i] < -BOUNDARY && xmove < 0) alienPosX[i] += (2*BOUNDARY + 10);
    if(alienPosY[i] > BOUNDARY && ymove > 0) alienPosY[i] -= (2*BOUNDARY + 10);
    if(alienPosY[i] < -BOUNDARY && ymove < 0) alienPosY[i] += (2*BOUNDARY + 10);
    if(alienPosZ[i] > BOUNDARY && zmove > 0) alienPosZ[i] -= (2*BOUNDARY + 10);
    if(alienPosZ[i] < -BOUNDARY && zmove < 0) alienPosZ[i] += (2*BOUNDARY + 10);

    if(alienAlive[i]) {
      drawItem( alienPosX[i], alienPosY[i], alienPosZ[i], ALIEN_SIZE, mv, 2);
    }
  }
}

function drawAlienShots( mv, t ) {
  for(var i = 0; i < alienShotNum; i++) {

/*    var xmove = Math.sin(alienShotDirX[i])*Math.cos(alienShotDirY[i]);
    var ymove = Math.sin(alienShotDirX[i])*Math.sin(alienShotDirY[i]);
    var zmove = Math.cos(alienShotDirX[i]);*/

    alienShotPosX[i] += (t * alienShotDirX[i]);
    alienShotPosY[i] += (t * alienShotDirY[i]);
    alienShotPosZ[i] += (t * alienShotDirZ[i]);

    if(alienShotPosX[i] < BOUNDARY && alienShotPosX[i] > -BOUNDARY && alienShotPosY[i] < BOUNDARY && alienShotPosY[i] > -BOUNDARY && alienShotPosZ[i] < BOUNDARY && alienShotPosZ[i] > -BOUNDARY) {
      drawItem( alienShotPosX[i], alienShotPosY[i], alienShotPosZ[i], ALIEN_SHOT_SIZE, mv, 3);
    } else if(alienShotInGame[i] === true){
      alienShotInGame[i] = false;
    }
  }
}

function drawScenery( mv ) {
  var t = (Date.now() - timeTick) / 50;
  timeTick = Date.now();
  drawAsteroids( mv, t );
  drawShots( mv, t );
  drawAliens( mv, t );
  drawAlienShots( mv, t );
}

function collisionDetection(){

  /* Check if any shot has hit an asteroid or an alien-ship */
  for(var i = 0; i < TOTAL_SHOTS; i++) {

    /* Check asteroids */
    for(var j = 0; j < astNum; j++) {
      if(Math.abs(shotPosX[i] - astPosX[j]) < SHOT_SIZE + asteroidSize[j] &&
         Math.abs(shotPosY[i] - astPosY[j]) < SHOT_SIZE + asteroidSize[j] &&
         Math.abs(shotPosZ[i] - astPosZ[j]) < SHOT_SIZE + asteroidSize[j] ) {

        // If shot is in game and asteroid is alive, destroy asteroid
        if( shotInGame[i] && astAlive[j] ) {
          BOMB_SOUND.currentTime = 0;
          BOMB_SOUND.play();
          shotsAllowed++;
          shotInGame[i] = false, astAlive[j] = false;
        } else continue;

        // If asteroid is big enough, split it into two smaller halves
        if( asteroidSize[j] >= INITIAL_ASTEROID_SIZE / 2 ) {
          var phi = 2 * Math.PI * Math.random();
          var theta = Math.PI * Math.random();
          createAsteroid(astPosX[j], astPosY[j], astPosZ[j], phi, theta, asteroidSize[j] / 2);
          createAsteroid(astPosX[j], astPosY[j], astPosZ[j], phi - Math.PI, theta - (Math.PI / 2), asteroidSize[j] / 2);
        }

        // Update score accordingly
        switch(asteroidSize[j]) {
          case 12: // 1 point for hitting big asteroid
            score += 1;
            break;
          case 6:  // 2 points for hitting medium sized asteroid
            score += 2;
            break;
          case 3:  // 3 points for hitting small asteroid
            score += 3;
        }
      }
    }

    /* Check alien-ships */
    for(var j = 0; j < alienNum; j++) {
      if(Math.abs(shotPosX[i] - alienPosX[j]) < SHOT_SIZE + ALIEN_SIZE &&
         Math.abs(shotPosY[i] - alienPosY[j]) < SHOT_SIZE + ALIEN_SIZE &&
         Math.abs(shotPosZ[i] - alienPosZ[j]) < SHOT_SIZE + ALIEN_SIZE ) {

        // If shot is in game and alien is alive, destroy alien-ship
        if( shotInGame[i] && alienAlive[j] ) {
          BOMB_SOUND.currentTime = 0;
          BOMB_SOUND.play();
          shotsAllowed++;
          shotInGame[i] = false, alienAlive[j] = false;
          score += 5; // 5 points for hitting alien-ship
          clearInterval( alienFireIntervals[j] ); // stop alien-ship volley of fire
        }
      }
    }
  }

  /* Game over if spaceship collides with an asteroid or with an alien-ship */
  for(var i = 0; i < astNum; i++) {
    if(Math.abs(xEye - astPosX[i]) < asteroidSize[i] &&
       Math.abs(yEye - astPosY[i]) < asteroidSize[i] &&
       Math.abs(zEye - astPosZ[i]) < asteroidSize[i] ) {
      gameOver();
    }
  }
  for(var i = 0; i < alienNum; i++) {
    if(Math.abs(xEye - alienPosX[i]) < ALIEN_SIZE &&
       Math.abs(yEye - alienPosY[i]) < ALIEN_SIZE &&
       Math.abs(zEye - alienPosZ[i]) < ALIEN_SIZE ) {
      gameOver();
    }
  }

  /* Game over if spaceship gets hit by an alien-ship */

}

function gameOver() {
  /* GAME OVER */
  ENGINE_SOUND.pause();
  for(var i = 0; i < alienFireIntervals.length; i++) {
    clearInterval(alienFireIntervals[i]);
  }
  clearInterval(alienCreationInterval);
  clearInterval(gameInterval);
  clearInterval(renderInterval);
  console.log("Game over");
  document.getElementById("score").innerHTML = "Game over! Your score: " + score;
}

function newGame() {

  score = 0;
  movementDisabled = true;

  theta = (Math.PI / 2);
  phi = 0;
  xEye = 0, yEye = 0, zEye = 0;
  velocity = 0;

  astNum = 0, alienNum = 0, alienShotNum = 0;
  astPosX = [], astPosY = [], astPosZ = [];
  astDirectionTheta = [], astDirectionPhi = [], asteroidSize = [], astAlive = [];

  shotPosX = [], shotPosY = [], shotPosZ = [];
  shotDirectionTheta = [], shotDirectionPhi = [], shotInGame = [];

  alienPosX = [], alienPosY = [], alienPosZ = [];
  alienDirectionTheta = [], alienDirectionPhi = [], alienAlive = [];

  alienshotPosX = [], alienshotPosY = [], alienshotPosZ = [];
  alienShotDirX = [], alienShotDirY = [], alienShotInGame = [];
  alienFireIntervals = [];
  initializeAsteroids();
  initializeShots();
  alienCreationInterval = setInterval(createAlien, ALIEN_APPEARANCE_INTERVAL);
  gameInterval = setInterval(gameLoop, 10);
  renderInterval = setInterval(render, 10);
}

function render() {

  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var mv = lookAt( vec3(xEye, yEye, zEye), vec3(xAt, yAt, zAt), vec3(0.0, 0.0, 1.0) );
  document.getElementById("coordinates").innerHTML = "Coordinates: ( " + Math.round(xEye, 0) + ", " + Math.round(yEye, 0) + ", " + Math.round(zEye, 0) + ")";
  document.getElementById("score").innerHTML = "Score: " + score;

  drawScenery( mv );
  // requestAnimFrame( render );
}

/*
function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
}*/
