
var canvas;
var gl;

var numVertices  = 36;
var shotSound = new Audio("laser.wav");
var flySound = new Audio("helicopter.wav");
var bombSound = new Audio("bomb.wav");
var asteroidAppearSound = new Audio("asteroid.wav");

/*var shotVertices = [];
var shotColorsBuffer = [];
var shotBuffer;
var shotColor = vec4(0.0, 1.0, 0.0);*/

var movementDisabled = true;
var points = [];
var texCoords = [];
var colors = [];
var texture;
var mvLoc, pLoc, proj, vBuffer, vPosition, colorLoc;

var theta = (Math.PI/2.0);
var phi = 0.0;
var shotSize = 0.2;

var radius =1000000.0;
xAt=radius*Math.sin(theta)*Math.cos(phi);
yAt=radius*Math.sin(theta)*Math.sin(phi);
zAt=radius*Math.cos(theta);

var xEye = 0.0;
var yEye = 0.0;
var zEye = 0.0;
var keyState = {};
var velocity = 0,
    maxspeed = 2, // max speed
    friction = 0.98; // friction

var matrixLoc;
var timeTick;


var astNum = 8;
var asteroidSize = [];
var astPosX = [];
var astPosY = [];
var astPosZ = [];
var astDirectionTheta = [];
var astDirectionPhi = [];

var shotNum = 0;
var shotPosX = [];
var shotPosY = [];
var shotPosZ = [];
var shotDirectionTheta = [];
var shotDirectionPhi = [];
var isShotInGame = [];

var shotTimer = Date.now();
var shotCooldown = 500;
var shotsAllowed = 4;


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

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    initializeAsteroids();

    colorCube();
    //envCube();
    shotCube();

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


    /*window.addEventListener("keydown", function(e){
      if(keyState[32]){
        setTimeout();
        createShot(xEye, yEye, zEye, phi, theta);
      }
    });*/

    // smooth eventlistener
    window.addEventListener('keydown',function(e) {
      keyState[e.keyCode || e.which] = true;
    }, true);
    window.addEventListener('keyup',function(e) {
      keyState[e.keyCode || e.which] = false;
    }, true);

    function gameLoop() {
      if(keyState[32]){ // SPACE
        if((Date.now() - shotTimer) > shotCooldown && shotsAllowed > 0){
          shotSound.play();
          createShot(xEye, yEye, zEye, phi, theta);
          shotTimer = Date.now();
          shotsAllowed--;
        }
      }
      if (keyState[37]){
        phi += (Math.PI/180.0);
      }
      if (keyState[39]){
        phi -= (Math.PI/180.0);
      }
      if (keyState[38]){
        if(theta-(Math.PI/180.0) > (Math.PI/4.0)) theta -= (Math.PI/180.0);
      }
      if (keyState[40]){
        if(theta+(Math.PI/180.0) < 3.0*(Math.PI/4.0)) theta += (Math.PI/180.0);
      }
      if (keyState[17]) { // CTRL
        if(movementDisabled) {
          shotSound.play();
          movementDisabled = false;
        }
        if(velocity < maxspeed) {
          velocity += 0.01;
        }
      } else {
        movementDisabled = true;
        velocity *= friction;
      }
      var v = velocity/radius;
      var limit = 100;
      if(xEye + v*xAt < limit && xEye + v*xAt > -limit) xEye += v*xAt;
      if(yEye + v*yAt < limit && yEye + v*yAt > -limit) yEye += v*yAt;
      if(zEye + v*zAt < limit && zEye + v*zAt > -limit) zEye += v*zAt;
      xAt=radius*Math.sin(theta)*Math.cos(phi);
      yAt=radius*Math.sin(theta)*Math.sin(phi);
      zAt=radius*Math.cos(theta);

      collisionDetection();

      setTimeout(gameLoop, 10);
    }
    gameLoop();

    colorLoc = gl.getUniformLocation( program, "vColor" );

    mvLoc = gl.getUniformLocation( program, "modelview" );

    // set projection
    pLoc = gl.getUniformLocation( program, "projection" );
    proj = perspective( 50.0, 1.0, 1.0, 500.0 );
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));
/*
    var image = document.getElementById("texImage");
    configureTexture( image );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);*/

    timeTick = Date.now();

    render();
}

function envCube() {
    envQuad( 1, 0, 3, 2 );
    envQuad( 2, 3, 7, 6 );
    envQuad( 3, 0, 4, 7 );
    envQuad( 6, 5, 1, 2 );
    envQuad( 4, 5, 6, 7 );
    envQuad( 5, 4, 0, 1 );
}

function envQuad(a, b, c, d) {
      var size = 2;
      var vertices = [
        vec3( -size, -size,  size ),
        vec3( -size,  size,  size ),
        vec3(  size,  size,  size ),
        vec3(  size, -size,  size ),
        vec3( -size, -size, -size ),
        vec3( -size,  size, -size ),
        vec3(  size,  size, -size ),
        vec3(  size, -size, -size )
    ];

    var texCo = [
      vec2(0, 0),
      vec2(0, 1000),
      vec2(1000, 1000),
      vec2(1000, 0)
    ];

    var indices = [ a, b, c, a, c, d ];
    //var texind  = [ 1, 0, 3, 1, 3, 2 ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vec4( 1.0, 1.0, 0.0, 1.0 ));
        // texCoords.push( texCo[texind[i]] );
    }
}

function shotCube() {
    shotquad( 1, 0, 3, 2 );
    shotquad( 2, 3, 7, 6 );
    shotquad( 3, 0, 4, 7 );
    shotquad( 6, 5, 1, 2 );
    shotquad( 4, 5, 6, 7 );
    shotquad( 5, 4, 0, 1 );
}

function shotquad(a, b, c, d) {
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

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 0.055, 0.196, 0.016, 1.0 ],  // dark dark green
        [ 0.082, 0.2, 0.051, 1.0 ],  // dark green
        [ 0.271, 0.576, 0.192, 1.0 ],  // green
        [ 0.482, 0.898, 0.373, 1.0 ],  // light green
        [ 6.0, 0.898, 0.522, 1.0 ],  // light light green
        [ 0.271, 0.576, 0.192, 1.0 ],  // green
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);

    }
}

function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) {
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

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    var texCo = [
      vec2(0, 0),
      vec2(0, 1),
      vec2(1, 1),
      vec2(1, 0)
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[indices[i]]);
    }
}

// draw a house in location (x, y) of size size
function house( x, y, z, size, mv ) {


  mv = mult( mv, translate( x, y, z ) );
  mv = mult( mv, scalem( size, size, size ) );

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, 0, numVertices );

}

// draw a shot
function shot( x, y, z, mv ) {

  mv = mult( mv, translate( x, y, z ) );
  mv = mult( mv, scalem( shotSize, shotSize, shotSize ) );

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
  gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );
}

function drawScenery( mv ) {

    var t = (Date.now()-timeTick)/25;
    timeTick = Date.now();

    // draw houses
    for(var i=0; i<astNum; i++){

      var xmove = Math.sin(astDirectionTheta[i])*Math.cos(astDirectionPhi[i]);
      var ymove = Math.sin(astDirectionTheta[i])*Math.sin(astDirectionPhi[i]);
      var zmove = Math.cos(astDirectionTheta[i]);

      if(astPosX[i] > 100 && xmove > 0) astPosX[i] -= 210;
      if(astPosX[i] < -100 && xmove < 0) astPosX[i] += 210;
      if(astPosY[i] > 100 && ymove > 0) astPosY[i] -= 210;
      if(astPosY[i] < -100 && ymove < 0) astPosY[i] += 210;
      if(astPosZ[i] > 100 && zmove > 0) astPosZ[i] -= 210;
      if(astPosZ[i] < -100 && zmove < 0) astPosZ[i] += 210;

      astPosX[i] += (t*xmove);
      astPosY[i] += (t*ymove);
      astPosZ[i] += (t*zmove);

      house( astPosX[i], astPosY[i], astPosZ[i], asteroidSize, mv);
    }

    //draw shots
    for(var i=0; i<shotNum; i++){

      var xmove = Math.sin(shotDirectionTheta[i])*Math.cos(shotDirectionPhi[i]);
      var ymove = Math.sin(shotDirectionTheta[i])*Math.sin(shotDirectionPhi[i]);
      var zmove = Math.cos(shotDirectionTheta[i]);

      shotPosX[i] += (t*xmove);
      shotPosY[i] += (t*ymove);
      shotPosZ[i] += (t*zmove);

      if(shotPosX[i] < 100 && shotPosX[i] > -100 && shotPosY[i] < 100 && shotPosY[i] > -100 && shotPosZ[i] < 100 && shotPosZ[i] > -100){
        shot( shotPosX[i], shotPosY[i], shotPosZ[i], mv);
      }
      else if(isShotInGame[i] === true){
        isShotInGame[i] = false;
        shotsAllowed++;
      }
    }

    /*house(-20.0, 50.0, 0.0, 5.0, mv);
    house(0.0, 70.0, 0.0, 10.0, mv);
    house(20.0, -10.0, 0.0, 8.0, mv);
    house(40.0, 120.0, 0.0, 10.0, mv);
    house(-30.0, -50.0, 0.0, 7.0, mv);
    house(10.0, -60.0, 0.0, 10.0, mv);
    house(-20.0, 75.0, 0.0, 8.0, mv);
    house(-40.0, 140.0, 0.0, 10.0, mv);*/

}

function initializeAsteroids(){
  for(var i=0; i<astNum; i++){
    asteroidSize.push(12);
    astPosX.push((Math.random()*200)-100);
    astPosY.push((Math.random()*200)-100);
    astPosZ.push((Math.random()*200)-100);
    astDirectionPhi.push(2*Math.PI*Math.random());
    astDirectionTheta.push(Math.PI*Math.random());
  }
}

function createAsteroid(x, y, z, phi, theta, size){
  asteroidSize.push(size);
  astPosX.push(x);
  astPosY.push(y);
  astPosZ.push(z);
  astDirectionPhi.push(phi);
  astDirectionTheta.push(theta);
  astNum++;
}

function createShot(x, y, z, phi, theta){
  shotPosX.push(x);
  shotPosY.push(y);
  shotPosZ.push(z-0.5);
  shotDirectionPhi.push(phi);
  shotDirectionTheta.push(theta);
  isShotInGame.push(true);
  shotNum++;

  /*shotBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, shotBuffer );*/
  //gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
}

function collisionDetection(){

  /* has any shot hit an asteroid? */
  for(var i = 0; i < shotNum; i++) {
    for(var j = 0; j < astNum; j++) {
      //check the X axis
      if(Math.abs(shotPosX[i] - astPosX[j] < shotSize + asteroidSize[j])){
        //check the Y axis
        if(Math.abs(shotPosY[i] - astPosY[j] < shotSize + asteroidSize[j]))
        {
            //check the Z axis
            if(Math.abs(shotPosZ[i] - astPosZ[j] < shotSize + asteroidSize[j]))
            {
              // Stór: 12, Miðlungs: 6, Litil: 3.
              //Búum til tvo minni loftsteina
              if(asteroidSize[j]>5){
                var phi = 2*Math.PI*Math.random();
                var theta = Math.PI*Math.random();
                createAsteroid(astPosX[j], astPosY[j], astPosZ[j], phi, theta, asteroidSize[j]/2);
                createAsteroid(astPosX[j], astPosY[j], astPosZ[j], phi-Math.PI, theta-(Math.PI/2), asteroidSize[j]/2);
              }

            }
        }
      }

    }
  }
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
	  mv = lookAt( vec3(xEye, yEye, zEye), vec3(xAt, yAt, zAt), vec3(0.0, 0.0, 1.0) );
    document.getElementById("coordinates").innerHTML = "( " + Math.round(xEye,0) + ", " + Math.round(yEye,0) + ", " + Math.round(zEye,0) + ")";
    document.getElementById("coordinatesA").innerHTML = "( " + Math.round(shotPosX[0],0) + ", " + Math.round(shotPosY[0],0) + ", " + Math.round(shotPosZ[0],0) + ")";

	  drawScenery( mv );

    //gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );

    requestAnimFrame( render );
}
