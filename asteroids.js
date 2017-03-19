
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var texCoords = [];
var colors = [];
var texture;
var mvLoc, pLoc, proj, vBuffer, vPosition, colorLoc;

var theta = (Math.PI/2.0);
var phi = 0.0;

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
var initTime;


var astNum = 8;
var astPosX = [];
var astPosY = [];
var astPosZ = [];
var astDirectionTheta = [];
var astDirectionPhi = [];


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
    envCube();

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

    // smooth eventlistener
    window.addEventListener('keydown',function(e) {
      keyState[e.keyCode || e.which] = true;
    }, true);
    window.addEventListener('keyup',function(e) {
      keyState[e.keyCode || e.which] = false;
    }, true);

    function gameLoop() {
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
      if (keyState[17]) {
        if(velocity < maxspeed)
          velocity += 0.01;
      } else {
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

    initTime = Date.now();

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
function house( i, x, y, z, size, mv ) {
  var t = (Date.now()-initTime)/50;

  var xmove=Math.sin(astDirectionTheta[i])*Math.cos(astDirectionPhi[i]);
  var ymove=Math.sin(astDirectionTheta[i])*Math.sin(astDirectionPhi[i]);
  var zmove=Math.cos(astDirectionTheta[i]);


  mv = mult( mv, translate( x+(t*xmove), y+(t*ymove), z+(t*zmove) ) );
  mv = mult( mv, scalem( size, size, size ) );

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

   gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
   gl.drawArrays( gl.TRIANGLES, 0, numVertices );

}

function drawScenery( mv ) {
    // draw houses
    for(var i=0; i<astNum; i++){
      house( i, astPosX[i], astPosY[i], astPosZ[i], 5.0, mv);
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
    astPosX.push((Math.random()*200)-100);
    astPosY.push((Math.random()*200)-100);
    astPosZ.push(0.0);
    astDirectionPhi.push(0.0);
    astDirectionTheta.push(Math.PI/2.0);
  }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
	  mv = lookAt( vec3(xEye, yEye, zEye), vec3(xAt, yAt, zAt), vec3(0.0, 0.0, 1.0) );
    document.getElementById("coordinates").innerHTML = "( " + Math.round(xEye,0) + ", " + Math.round(yEye,0) + ", " + Math.round(zEye,0) + ")";

	  drawScenery( mv );

    gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );

    requestAnimFrame( render );
}
