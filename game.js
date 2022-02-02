
var bombs_data = null;

function generateBoard(size, startPosition, bomb_count){

    bombs_data = [[[]]]

    var sizeX = size.x;
    var sizeY = size.y;
    var sizeZ = size.z;

    var startX = startPosition.x;
    var startY = startPosition.y;
    var startZ = startPosition.z;

    var total_cells = sizeX * sizeY * sizeZ;

    var bombs_remaining = bomb_count;

    iterate3D(sizeX, sizeY, sizeZ, function(x, y, z){
        if (!bombs_data[x]) bombs_data[x] = []
        if (!bombs_data[x][y]) bombs_data[x][y] = []

        if ((Math.abs(x-startX) <= 1 && Math.abs(y-startY) <= 1 && Math.abs(z-startZ) <= 1)) {
            bombs_data[x][y][z] = 0;
        }
        else {
            bomb_chance = bombs_remaining / total_cells;

            spawnBomb = Math.random() <= bomb_chance;

            if (spawnBomb){
                bombs_data[x][y][z] = 27;
                bombs_remaining--;

                var obj = cubeGroup.getObjectByName(`${x},${y},${z}`);

                BOMB_OBJECTS.push(obj);

            } else {
                bombs_data[x][y][z] = 0;
            }
        }

        total_cells--;
    });

    iterate3D(sizeX, sizeY, sizeZ, function(x, y, z){

        if(bombs_data[x][y][z] == 27) return;

        var bombs_around = 0;

        iterate3D(3, 3, 3, function(cX, cY, cZ){


            //console.log("Checking", x+cX-1, y+cY-1, z+cZ-1);

            var failed = false;
            if (x+cX-1 < 0 || x+cX-1 >= sizeX) {
                //console.log("Failed X");
                failed = true
            }
            else if (y+cY-1 < 0 || y+cY-1 >= sizeY){
                //console.log("Failed Y");
                failed = true;
            }
            else if (z+cZ-1 < 0 || z+cZ-1 >= sizeZ){
                //console.log("Failed Z");
                failed = true;
            }
            if(failed) return;

            //console.log("Passed the check", x+cX-1, y+cY-1, z+cZ-1);


            if (bombs_data[x+cX-1][y+cY-1][z+cZ-1] == 27){
                //console.log("Bomb around!")
                bombs_around++;

            }
        });

        bombs_data[x][y][z] = bombs_around;

        if(bombs_around > 0 && bombs_around < 27){

            const textMaterial = new THREE.SpriteMaterial({map: numbers[bombs_around-1]});

            const sprite = new THREE.Sprite(textMaterial);
        
            sprite.position.set(x,y,z);
            sprite.scale.set(0.33, 0.33, 0.33);
        
            textGroup.add(sprite);
        }


    });


    return bombs_data;

    
}


function iterate3D(sizeX, sizeY, sizeZ, func){
    for (var x = 0; x < sizeX; x++){
        for (var y = 0; y < sizeY; y++){
            for (var z = 0; z < sizeZ; z++){
                func(x, y, z);
            }
        }
    }
}


function rgbToHSL(rgb) {
    // strip the leading # if it's there
    rgb = rgb.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(rgb.length == 3){
        rgb = rgb.replace(/(.)/g, '$1$1');
    }

    var r = parseInt(rgb.substr(0, 2), 16) / 255,
        g = parseInt(rgb.substr(2, 2), 16) / 255,
        b = parseInt(rgb.substr(4, 2), 16) / 255,
        cMax = Math.max(r, g, b),
        cMin = Math.min(r, g, b),
        delta = cMax - cMin,
        l = (cMax + cMin) / 2,
        h = 0,
        s = 0;

    if (delta == 0) {
        h = 0;
    }
    else if (cMax == r) {
        h = 60 * (((g - b) / delta) % 6);
    }
    else if (cMax == g) {
        h = 60 * (((b - r) / delta) + 2);
    }
    else {
        h = 60 * (((r - g) / delta) + 4);
    }

    if (delta == 0) {
        s = 0;
    }
    else {
        s = (delta/(1-Math.abs(2*l - 1)))
    }

    return {
        h: h,
        s: s,
        l: l
    }
}

// expects an object and returns a string
function hslToRGB(hsl) {
    var h = hsl.h,
        s = hsl.s,
        l = hsl.l,
        c = (1 - Math.abs(2*l - 1)) * s,
        x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
        m = l - c/ 2,
        r, g, b;

    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else {
        r = c;
        g = 0;
        b = x;
    }

    r = normalize_rgb_value(r, m);
    g = normalize_rgb_value(g, m);
    b = normalize_rgb_value(b, m);

    return rgbToHex(r,g,b);
}

function normalize_rgb_value(color, m) {
    color = Math.floor((color + m) * 255);
    if (color < 0) {
        color = 0;
    }
    return color;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}