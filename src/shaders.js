var ShaderblurX = {
	name: 'blurX',
	attributes:{
		aVertexPosition: {type: 'v4', value:null},
		aTextureCoordinates: {type: 'v2', value:null},
	},
	uniforms:{ 
		uTexture: {type: 't', value:null},
		uPixel: {type: 'v2', value:null}
	},
	fs : [
	    'precision mediump float;',
		'uniform sampler2D uTexture;',
		'varying vec2 blurCoordinates[5];',
		'void main(void){',
			'vec3 sum = texture2D(uTexture, blurCoordinates[0]).rbg * 0.204164;',
			'sum += texture2D(uTexture, blurCoordinates[1]).rbg * 0.304005;',
			'sum += texture2D(uTexture, blurCoordinates[2]).rbg * 0.304005;',
			'sum += texture2D(uTexture, blurCoordinates[3]).rbg * 0.093913;',
			'sum += texture2D(uTexture, blurCoordinates[4]).rbg * 0.093913;',
			'gl_FragColor =  vec4(sum, 1.);',
		'}'
	].join("\n"),
	vs : [
		'attribute vec4 aVertexPosition;',
		'attribute vec2 aTextureCoordinates;',
		'uniform vec2 uPixel;',
		'varying vec2 blurCoordinates[5];',
		'void main(void){',
		    'gl_Position = aVertexPosition;',
		    'vec2 pixel = uPixel * (aTextureCoordinates - .5);',
		    'blurCoordinates[0] = aTextureCoordinates;',
			'blurCoordinates[1] = aTextureCoordinates + pixel * 1.407333;',
			'blurCoordinates[2] = aTextureCoordinates - pixel * 1.407333;',
			'blurCoordinates[3] = aTextureCoordinates + pixel * 3.294215;',
			'blurCoordinates[4] = aTextureCoordinates - pixel * 3.294215;',
		'}'
	].join("\n"),
};

var ShaderblurY = {
	name: 'blurY',
	attributes:{
		aVertexPosition: {type: 'v4', value:null},
		aTextureCoordinates: {type: 'v2', value:null},
	},
	uniforms:{ 
		uTexture: {type: 't', value:null},
		uPixel: {type: 'v2', value:null}
	},
	fs : [
	    'precision mediump float;',
		'uniform sampler2D uTexture;',
		'varying vec2 blurCoordinates[6];',
		'void main(void){',
			'vec3 sum = texture2D(uTexture, blurCoordinates[0]).rbg * 0.204164;',
			'sum += texture2D(uTexture, blurCoordinates[1]).rbg * 0.304005;',
			'sum += texture2D(uTexture, blurCoordinates[2]).rbg * 0.304005;',
			'sum += texture2D(uTexture, blurCoordinates[3]).rbg * 0.093913;',
			'sum += texture2D(uTexture, blurCoordinates[4]).rbg * 0.093913;',
			'float vignette = 1. - dot(blurCoordinates[5], blurCoordinates[5]);',
			'gl_FragColor =  vec4(sum*vignette*vignette, 1.);',
		'}'
	].join("\n"),
	vs : [
		'attribute vec4 aVertexPosition;',
		'attribute vec2 aTextureCoordinates;',
		'uniform vec2 uPixel;',
		'varying vec2 blurCoordinates[6];',
		'void main(void){',
		    'gl_Position = aVertexPosition;',
		    'blurCoordinates[5] = aTextureCoordinates - .5;',
		    'vec2 pixel = (uPixel * blurCoordinates[5]);',
		    'blurCoordinates[0] = aTextureCoordinates;',
			'blurCoordinates[1] = aTextureCoordinates + pixel * 1.407333;',
			'blurCoordinates[2] = aTextureCoordinates - pixel * 1.407333;',
			'blurCoordinates[3] = aTextureCoordinates + pixel * 3.294215;',
			'blurCoordinates[4] = aTextureCoordinates - pixel * 3.294215;',
		'}'
	].join("\n"),
};

var Shaderskybox = {
	name: 'skybox',
	attributes:{
		aVertexPosition: {type: 'v4', value:null},
		aTextureCoordinates: {type: 'v3', value:null},
	},
	uniforms:{ 
		samplerCube: {type: 't', value:null},
		uMVPMatrix: {type: 'm4', value:null}
	},
	fs : [
	    'precision mediump float;',
		'uniform samplerCube uTexture;',
		'varying vec3 sTextureCoord;',
		'void main(void){',
		    'gl_FragColor = textureCube( uTexture, sTextureCoord );',
		'}'
	].join("\n"),
	vs : [
		'attribute vec4 aVertexPosition;',
		'attribute vec3 aTextureCoordinates;',
		//'uniform mat4 uMVPMatrix;',
		'uniform mat4 mvMatrix;',
		'uniform mat4 pMatrix;',
		'varying vec3 sTextureCoord;',
		'void main(void){',
		    //'gl_Position = uMVPMatrix * aVertexPosition;',
		    'gl_Position = pMatrix * mvMatrix * aVertexPosition;',
		    'sTextureCoord = aTextureCoordinates;',
		'}'
	].join("\n"),
};

var Shaderterrain = {
	name: 'terrain',
	attributes:{
		aVertexPosition: {type: 'v4', value:null},
		aTextureCoordinates: {type: 'v2', value:null},
	},
	uniforms:{ 
		uTextureGrass: {type: 't', value:null},
		uTextureDirt: {type: 't', value:null},
		uTextureShadows: {type: 't', value:null},
		uTextureNormals: {type: 't', value:null},
		uMVPMatrix: {type: 'm4', value:null},
		mvMatrix:{type:'m4', value:null},
		pMatrix:{type:'m4', value:null},
		uMorph: {type: 'f', value:null},
		fog_color: {type: 'v3', value:null},
		fog_density: {type: 'f', value:1},
		fog_far: {type: 'f', value:768},
	},
	fs : [
	    'precision mediump float;',
		'uniform sampler2D uTextureGrass;',
		'uniform sampler2D uTextureDirt;',
		'uniform sampler2D uTextureShadows;',
		'uniform sampler2D uTextureNormals;',
		'uniform vec3 fog_color;',
		'uniform float fog_density;',
		'uniform float fog_far;',
		'varying vec2 vTextureCoord;',
		'varying vec2 TexCoordX;',
		'varying vec2 TexCoordY;',
		'varying vec2 TexCoordZ;',
		'void main(void){',
		    'vec3 n = texture2D(uTextureNormals, vTextureCoord).rgb;',
		    'vec2 tcX = fract(TexCoordX);',
		    'vec2 tcY = fract(TexCoordY);',
		    'vec2 tcZ = fract(TexCoordZ);',
		    'vec3 dirtTX = texture2D(uTextureDirt,tcX).rgb * n.x;',
		    'vec3 grassTY = texture2D(uTextureGrass,tcY).rgb * n.y;',
		    'vec3 grassTZ = texture2D(uTextureGrass,tcZ).rgb * n.z;',
		    'vec3 grassCol = texture2D(uTextureGrass,tcX).rgb * n.x + grassTY + grassTZ;',
		    'vec3 dirtCol = dirtTX + texture2D(uTextureDirt,tcY).rgb * n.y + texture2D(uTextureDirt,tcZ).rgb * n.z;',
		    'vec3 color = dirtTX + grassTY + grassTZ;',
		    'float slope = 1.0 - n.y;',
		    'vec3 cliffCol;',
		    'if (slope < .6) cliffCol = grassCol;',
		    'if ((slope<.8) && (slope >= .6)) cliffCol = mix( grassCol , dirtCol, (slope - .6) * (1. / (.8 - .6)));',
		    'if (slope >= .8) cliffCol = dirtCol;',
		    'vec3 FragColor =  (color + cliffCol)/2.;',
		    //'float perspective_far = 768.;',
		    'float fog = fog_density * (gl_FragCoord.z / gl_FragCoord.w) / fog_far;',
		    'fog -= .2;',
		    'vec3 col = mix( fog_color, FragColor , clamp(1. - fog, 0., 1.));',
		    'gl_FragColor = vec4(col, 1.);',
		'}'
	].join("\n"),
	vs : [
		'attribute vec4 aVertexPosition;',
		'attribute vec2 aTextureCoordinates;',
		//'uniform mat4 uMVPMatrix;',
		'uniform mat4 mvMatrix;',
		'uniform mat4 pMatrix;',
		'uniform float uMorph;',
		'varying vec2 vTextureCoord;',
		'varying vec2 TexCoordX;',
		'varying vec2 TexCoordY;',
		'varying vec2 TexCoordZ;',
		'void main(void){',
		    'float morphedVertex = aVertexPosition.w + uMorph * (aVertexPosition.y - aVertexPosition.w);',
		    'TexCoordX = (aVertexPosition.zy)*.25;',
		    'TexCoordY = (aVertexPosition.xz)*.25;',
		    'TexCoordZ = (aVertexPosition.xy)*.25;',
		    //'gl_Position = uMVPMatrix * vec4(aVertexPosition.x, morphedVertex, aVertexPosition.z, 1.0);',
		    'gl_Position = pMatrix * mvMatrix * vec4(aVertexPosition.x, morphedVertex, aVertexPosition.z, 1.0);',
		    'vTextureCoord = aTextureCoordinates;',
		'}'
	].join("\n"),
};

var shaderDeep={
    name:'deep',
    attributes:{
        aVertexPosition:{t:'v3', v:null},
    },
    uniforms:{ 
        uMVPMatrix:{t:'m4', v:null},
    },
    fs:[
        'precision mediump float;',
        'uniform sampler2D uTextureGrass;',
		'uniform sampler2D uTextureDirt;',
		'uniform sampler2D uTextureShadows;',
		'uniform sampler2D uTextureNormals;',
		'uniform vec3 fog_color;',
		'uniform float fog_density;',
        'varying vec4 vc;',
        'void main(void) { gl_FragColor = vc; }'
    ].join("\n"),
    vs:[
        'attribute vec4 aVertexPosition;',
        'attribute vec2 aTextureCoordinates;',
        'attribute float py;',
        'uniform mat4 uMVPMatrix;',
        'uniform float uMorph;',
        'varying vec4 vc;',
        'varying float dy;',
        'void main(void) {',
            'gl_Position = uMVPMatrix * aVertexPosition;',
            'dy = ((aVertexPosition.y - aVertexPosition.w)*0.1)+0.1;',
            'vc = vec4(dy,dy,dy,1);',
        '}'
    ].join("\n"),
};