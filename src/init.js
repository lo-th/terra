/**
 * @fileoverview init.js - init functions
 * @author Xavier de Boysson
 */

"use strict";
Math.lerp = function (a, b, percent) { return a + (b - a) * percent; }
Math.rand = function (a, b, n) { return Math.lerp(a || 0, b || 1, Math.random()).toFixed(n || 0)*1;}
Math.rad = function(v){return v*Math.PI/180;}
//Math.randInt = function (a, b, n) { return Math.lerp(a || 0, b || 1, Math.random()).toFixed(n || 0)*1;}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var TERRA = {};



var totalLoading = 0;
var terrainDepth = 3//0//1//3;
var mapSize = 512;//128//256;//512;
var sizeRatio = 1;

var gl = null, canvas = null, frustum = null;
var infos = null, actions = null, actionsText = "", infosText = "";

var torad = Math.PI/180;
var isWebGL2 = false;

var cnt = 0;

var skybox = null
var terrain = null;

var lastUpdateTime = 0, fps = 0;
var airTime = 0;
var tick = 0;
var totalfps = 0;
var counter = 0;
var totalTime = 0;

var mvMatrix = null, pMatrix = null, mvpMatrix = null, oMatrix = null;

var viewPort = 0, width = 0, height = 0, ratio = 0;

var seedNum = 256;//Math.rand(1, 1024);//1024//256;
var seedBuffer = new ArrayBuffer(seedNum);

var programs = {};

var xBuffer = null;
var yBuffer = null;
var sBuffer = null;
var zSprite = null;

var vignette = null, xBlur = null, yBlur = null;

function toggleFullScreen() {
    if (!document.mozFullScreen && !document.webkitFullScreen) {
        if (canvas.mozRequestFullScreen) canvas.mozRequestFullScreen();
        else canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else {
        if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else  document.webkitCancelFullScreen();
    }
}

document.addEventListener("keydown", function(e) {if (e.keyCode == 13) toggleFullScreen();}, false);

window.onresize = function() {
    setup(input.scale);
}

function setup(scale){
    width = window.innerWidth/scale; height = window.innerHeight/scale;
    viewPort = width/(2*Math.tan((45*Math.PI/180)/2));
    canvas.width = width; 
    canvas.height = height; 
    ratio = width/height;
    canvas.style.width = width*scale + "px"; 
    canvas.style.height = height*scale + "px";
    gl.viewport(0, 0, width, height);
    xBuffer = createFramebuffer();
    yBuffer = createFramebuffer();
    if (xBlur){
        xBlur = new Pass(programs.blurX, xBuffer, 1);
        yBlur = new Pass(programs.blurY, yBuffer, 2);
    }
}

function doAction(action){
    if (action == "fullScreen") toggleFullScreen();
    if (action == "blur"){
        input.wireframe = false;
        input.depthOfField = !input.depthOfField;
    }
    if (action == "wireframe"){
        if (!input.depthOfField)
            input.wireframe = !input.wireframe;
    }
    if (action == "morph") input.vertexMorphing = !input.vertexMorphing;
    if (action == "autorun")input.autoRun = !input.autoRun;
    if (action == "fly"){
        input.flying = !input.flying;
        airTime = 0;
    }
    if (action == "fog"){
        input.fog = !input.fog;
        if (input.fog) terrain.setFog(1);
        else terrain.setFog(0);
        //if (input.fog) terrain.setProgram(programs.terrain);
        //else terrain.setProgram(programs.terrainNoFog);
    }

    actionsText = "";
    actionsText += '<br/><span onclick=\'doAction("fullScreen");\'>[Toggle Fullscreen]</span>';
	actionsText += '<br/><span onclick=\'doAction("blur");\'>[Depth of Field]</span> -> ' + (input.depthOfField?'on':'off');
	actionsText += '<br/><span onclick=\'doAction("morph");\'>[Vertex morphing]</span> -> ' + (input.vertexMorphing?'on':'off');
	actionsText += '<br/><span onclick=\'doAction("fog");\'>[Fog]</span> -> ' + (input.fog?'on':'off');
	actionsText += '<br/><span onclick=\'doAction("fly");\'>[Fly mode]</span> -> ' + (input.flying?'on':'off');
	actionsText += '<br/><span onclick=\'doAction("autorun");\'>[Autorun mode]</span> -> ' + (input.autoRun?'on':'off');
	if (!input.depthOfField) actionsText += '<br/><span onclick=\'doAction("wireframe");\'>[Wireframe mode]</span> -> ' + (input.wireframe?'on':'off');
    actions.innerHTML = actionsText;
}

function init(){
    
    var seedView = new Uint8Array(seedBuffer);
    var i = seedNum;
    while(i--){
        seedView[i] = Math.floor(Math.random() * seedNum);
    }

    infos = document.getElementById("infos");
    actions = document.getElementById("actions");
    canvas = document.getElementById("canvas");

    doAction();

    try {

        var attributes = {
            alpha: false,
            //depth: false,
            stencil: true,
            antialias: true,
            //premultipliedAlpha: false,
            preserveDrawingBuffer: false
        };

        gl = canvas.getContext( 'webgl2', attributes ) || canvas.getContext( 'experimental-webgl2', attributes );
        if ( gl === null ) gl = canvas.getContext( 'webgl', attributes ) || canvas.getContext( 'experimental-webgl', attributes );
        else console.log('is webgl2 !!')

        if ( gl === null ) {
            if ( canvas.getContext( 'webgl' ) !== null ) throw 'Error creating WebGL context with your selected attributes.';
            else  throw 'Error creating WebGL context.';
        } else {
            start();
        }

        //canvas.addEventListener( 'webglcontextlost', onContextLost, false );

    } catch ( error ) {

        console.error( 'WebGL Renderer: ' + error );

    }

}

function start(){

    setup(input.scale);

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // init shaders
    var options = [Shaderterrain, Shaderskybox, ShaderblurX, ShaderblurY, shaderDeep];
    var i = options.length;
    while(i--){ programs[options[i].name] = createProgram(gl, options[i].vs, options[i].fs, options[i].name); }

    initWorkers();

    skybox = new Skybox();
    terrain = new Terrain(skybox.fogColor);

    
    //

    xBlur = new Pass(programs.blurX, xBuffer, 1);
    yBlur = new Pass(programs.blurY, yBuffer, 2);

    /*sBuffer = createFramebuffer();
    zSprite = new Pass(programs.sprite, sBuffer, 3); */
    //stick = new Stick(programs.sprite);


    pMatrix = mat4.create();
    oMatrix = mat4.create();
    mvMatrix = mat4.create();
    mvpMatrix = mat4.create();

    input.init();
    renderFrame();
}

function createProgram(gl, tvs, tfs, name){
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, tfs);
    gl.compileShader(fs);
    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, tvs);
    gl.compileShader(vs);
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);

    var linked = gl.getProgramParameter(p, gl.LINK_STATUS);
    if (!linked) console.error(name, 'Error linking the shader: ' + gl.getProgramInfoLog(p));
    return p;
}





function renderFrame(){

    infosText = "";

    input.check();

    mat4.perspective(45, ratio, .1, 400*mapSize,pMatrix);
    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, (input.pitch)*torad, [1, 0, 0]);
    mat4.rotate(mvMatrix, (input.yaw)*torad, [0, 1, 0]);

    if (input.depthOfField) gl.bindFramebuffer(gl.FRAMEBUFFER, xBuffer.buffer);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(skybox) skybox.render();

    mat4.translate(mvMatrix, [input.pos.x, input.pos.y, input.pos.z]);

   if(terrain) terrain.render();

    if (input.depthOfField){

        gl.bindTexture(gl.TEXTURE_2D, xBuffer.texture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, yBuffer.buffer);
        xBlur.render();
        gl.bindTexture(gl.TEXTURE_2D, yBuffer.texture);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        yBlur.render();
    }

  // mat4.ortho(oMatrix, 0, width, 0, height, .1, 400*512);
   // mat4.identity(mvMatrix);
   // if(stick)stick.render();

    var currentTime = (new Date).getTime();
    if (lastUpdateTime){
        var delta = (currentTime - lastUpdateTime)/1000;
        if (delta != 0)
            totalfps += (1/delta);
        airTime += delta;
        tick += delta;
        totalTime += delta;
        counter ++;
        if (tick >= 1){
            fps = Math.floor(10*totalfps/counter)/10;
            counter = 0;
            tick = 0;
            totalfps = 0;
        }
    }

    var comp = mapSize / Math.pow(2, terrainDepth);
    comp = comp*comp*2 + comp*4*2;

    infosText += "<span style='font-size:20px; text-decoration:none;'>";
    
    if (totalLoading != 100){
        if (totalLoading < 15) infosText += "<span style='color:red; text-decoration:none;'>" + totalLoading + "% COMPUTE</span>";
        else if (totalLoading < 50) infosText += "<span style='color:orange; text-decoration:none;'>" + totalLoading + "% COMPUTE</span>";
        else if (totalLoading < 80) infosText += "<span style='color:yellow; text-decoration:none;'>" + totalLoading + "% COMPUTE</span>";
        else infosText += "<span style='color:LawnGreen; text-decoration:none;'>" + totalLoading + "% COMPUTE</span>";
    } else infosText += "100% COMPUTE";

    infosText += " " + fps.toFixed(0) + " FPS</span>";
    //infosText += "<br/>Quality (mouse wheel): " + Math.floor(40/input.scale)/10;
    //infosText += "<br/>Computed triangles: " + comp * cnt + " out of " + 528384*terrain.heightmaps.length + " ("+ Math.floor(((comp * cnt)/(528384*terrain.heightmaps.length)*1000))/10 +"% of total)" 
    infosText += "<br/>Draw calls: " + cnt + " | Quality (mouse wheel): " + Math.floor(40/input.scale)/10;
    infosText += "<br/>Reload page for other planete";
    //infosText += "<br/>FPS: " + fps;


    //infosText += "<br>current. x, y :" + input.current.x + ", " + input.current.y;

    infos.innerHTML = infosText;
    lastUpdateTime = currentTime;
    window.requestAnimationFrame(renderFrame);
}