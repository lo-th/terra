/**
 * @fileoverview input.js - input setup and functions
 * @author Xavier de Boysson
 */

"use strict";
var input = {
    active : false,
    current : {x:0, y:0},
    previous : {x:0, y:0},
  //  pos :  {x: 976.4110862738892, y: -445.03714173374726, z: -1099.483974473918},
    pos :  {x: -mapSize/2., y: 512, z: -mapSize/2.},
    yaw : 53,
    pitch : 25,
    gravity : 9.8,
    keyPressed : [],
    strafing : false,
    flying : false,
    speed: 0,
    jump: 0,
    jumping: false,
    wireframe: false,
    vertexMorphing: true,
    depthOfField: false,
    fog: true,
    autoRun: false,
    scale: 1,

    init : function(){
        canvas.addEventListener('touchmove', input.update, true);
        canvas.addEventListener('touchend', function(e) {
        input.active = false;
        input.previous.x = e.targetTouches[0].clientX;
        input.previous.y = e.targetTouches[0].clientY;
         }, false);
        canvas.addEventListener('touchstart', function(e) {
        input.active = true;
        input.previous.x = e.targetTouches[0].clientX;
        input.previous.y = e.targetTouches[0].clientY;
        }, false);

        window.addEventListener('mousemove', input.update, false);
        window.addEventListener('mouseup', function(e){
            input.active = false;
            canvas.style.cursor="default";
        }, false);
        canvas.addEventListener('mousedown', function(e){
            input.active = true;
            canvas.style.cursor="none";
        }, false);

        window.addEventListener('mousewheel', function(e){
            /*terrain.sunHeight += (e.wheelDelta/10000);

            if (terrain.sunHeight > 10) terrain.sunHeight = 10;
            if (terrain.sunHeight < -2) terrain.sunHeight = -2;

            for (var id=0; id<terrain.heightmaps.length; id++)
            {
                updateShadows(id);
            }*/
            var prev = input.scale;

            if (e.wheelDelta > 0)
                input.scale += .25;
            else
                input.scale -= .25;

            if (input.scale > 4) input.scale = 4;
            if (input.scale < 1) input.scale = 1;

            if (prev != input.scale)
                setup(input.scale);


        }, false);

        window.addEventListener('keydown', function(e)
        {
            input.keyPressed[e.keyCode] = true;
            if ((input.keyPressed[32] || input.keyPressed[16]) && !input.jumping)
            {
                input.jump = 2;
                input.jumping = true;
            }

        }, false);

        window.addEventListener('keyup', function(e)
        {
            input.keyPressed[e.keyCode] = false;
            if (input.keyPressed[32] == false || input.keyPressed[16] == false)
            {
                input.jump/= 3;
            }

        }, false);

    },

    update : function(e)
    {
        e.preventDefault();

        if (e.type == "mousemove")
        {
            input.current.x = e.clientX;
            input.current.y = e.clientY;
        }
        else
        {
            input.current.x = e.targetTouches[0].clientX;
            input.current.y = e.targetTouches[0].clientY;
        }

        if (input.active)
        {
            input.yaw += (input.current.x - input.previous.x)/3;
            input.pitch += (input.current.y - input.previous.y)/3;

            if (input.pitch > 90) input.pitch = 90;
            if (input.pitch < -90) input.pitch = -90;
        }

        input.previous.x = input.current.x;
        input.previous.y = input.current.y;
    },


    check : function()
    {
        var speed = .5;
        if (input.jumping)
            speed *= 2;

        if (input.autoRun)
            speed = .1;
        if (input.flying) speed = 1;

        var key = input.keyPressed;
        //    key[38] = true;
        // left right
        if (key[37] || key[39] || key[81] || key[68])
        {
            if (key[37] || key[81]) input.speed = -speed;
            if (key[39] || key[68]) input.speed = speed;
            input.pos.x -= Math.cos((input.yaw)*Math.PI/180) * input.speed;
            input.pos.z -= Math.sin((input.yaw)*Math.PI/180) * input.speed;

        }

        // up down
        if (key[38] || key[40] || key[90] || key[83] || input.autoRun)
        {
            if (key[38] || key[90] || input.autoRun) input.speed = speed;
            if (key[40] || key[83]) input.speed = -speed;
            if (input.flying)
            {
                input.pos.x -= input.speed * Math.sin((input.yaw)*Math.PI/180) * Math.cos((input.pitch)*Math.PI/180);
                input.pos.y += input.speed * Math.sin((input.pitch)*Math.PI/180);
                input.pos.z += input.speed * Math.cos((input.yaw)*Math.PI/180) * Math.cos((input.pitch)*Math.PI/180);
            }
            else
            {
                input.pos.x -= input.speed * Math.sin((input.yaw)*Math.PI/180);
                input.pos.z += input.speed * Math.cos((input.yaw)*Math.PI/180);


//            input.pos.x -= Math.cos((input.yaw)*Math.PI/180) * Math.cos(totalTime*10)/30;
//            input.pos.z -= Math.sin((input.yaw)*Math.PI/180) * Math.cos(totalTime*10)/30;

            }
        }

        if(!terrain) return;

        var id = -1;
        var i = terrain.heightmaps.length;
        while(i--)
        //for (var i=0; i<terrain.heightmaps.length; i++)
        {
            if (-input.pos.x < terrain.heightmaps[i].pos.x + terrain.heightmaps[0].size &&
                -input.pos.x > terrain.heightmaps[i].pos.x &&
                -input.pos.z < terrain.heightmaps[i].pos.z + terrain.heightmaps[0].size &&
                -input.pos.z > terrain.heightmaps[i].pos.z)
            {
                id = i;
                break;
            }
        }

        if (id != -1)
        {
            var dataView = terrain.heightmaps[id].dataView;
            if (dataView.length > 0)
            {
                if (!input.flying)
                    input.pos.y+=-input.jump+(input.jump*airTime/10) + (input.gravity*airTime/10);
                var size = terrain.heightmaps[id].size;

                var px = -input.pos.x - terrain.heightmaps[id].pos.x;
                var pz = -input.pos.z - terrain.heightmaps[id].pos.z;
                var x = Math.floor(px);
                var z = Math.floor(pz);
                var modX = px - x;
                var modY = pz - z;

                var a = dataView[x + z * (size + 1)];
                var b = dataView[x + (z + 1) * (size + 1)];
                a = a + modX * (dataView[x + 1 + z * (size + 1)] - a);
                b = b + modX * (dataView[x + 1 + (z + 1) * (size + 1)] - b);
                var currHeight = -(a + modY * (b - a)) / terrain.heightmaps[id].heightRatio;

                if (input.pos.y > currHeight - 5 + Math.cos(totalTime*5)/15)
                {
                    input.pos.y = currHeight - 5 + Math.cos(totalTime*5)/15;
                    airTime = 0;
                    input.jump = 0;
                    input.jumping = false;
                }
                else
                    input.pos.y += Math.cos(totalTime*5)/15;


            }
        }





    }
};