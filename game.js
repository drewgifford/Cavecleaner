
bombs_data = [[[]]]

function generateBoard(size, startPosition, bomb_count){

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
            console.log("Setting bomb data to 0 at",x,y,z);
            bombs_data[x][y][z] = 0;
        }
        else {
            bomb_chance = bombs_remaining / total_cells;

            console.log("Chance for a bomb", bomb_chance);

            spawnBomb = Math.random() <= bomb_chance;

            if (spawnBomb){
                bombs_data[x][y][z] = 27;
                bombs_remaining--;

                console.log("Bomb Placed");
            } else {
                bombs_data[x][y][z] = 0;
            }
        }
        console.log("Bombs left:", bombs_remaining, "Cells remaining:",total_cells)
        total_cells--;
    });

    iterate3D(sizeX, sizeY, sizeZ, function(x, y, z){

        if(bombs_data[x][y][z] == 27) return;

        var bombs_around = 0;

        iterate3D(3, 3, 3, function(cX, cY, cZ){

            //console.log("Checking", x+cX-1, y+cY-1, z+cZ-1);

            var failed = false;
            if (x+cX <= 0 || x+cX-1 >= sizeX) {
                //console.log("Failed X");
                failed = true
            }
            else if (y+cY <= 0 || y+cY-1 >= sizeY){
                //console.log("Failed Y");
                failed = true;
            }
            else if (z+cZ <= 0 || z+cZ-1 >= sizeZ){
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

console.log(generateBoard({
    x: 7, y: 7, z: 7
}, {
    x: 0, y: 0, z: 0
}, 25));
