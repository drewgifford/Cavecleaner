let scene, camera, renderer, skyboxGeo, skybox, pivot, controls, wireframe, zoomControl, composer;

var mouse = new THREE.Vector2();

let cubeGroup, textGroup;
var registered_cells = []
let INTERSECTED;
let cell_color = 0xdbdbdb;

let QUEUED_CUBES = [];
let REVEALED_CUBES = [];

let cubeSize = {
    x: 15,
    y: 1,
    z: 15
};
let bombs = 40;
let font;
let gameOver = false;

var frequency = 0.00000001;

let originalColor = "#edc9ff";
let currColor;

function rainbow(t){

    var color = changeHue(originalColor, t/20);
    var num = Number(color.replace("#","0x"));
    return num;
}

function changeHue(rgb, degree) {
    var hsl = rgbToHSL(rgb);
    hsl.h += degree;
    if (hsl.h > 360) {
        hsl.h -= 360;
    }
    else if (hsl.h < 0) {
        hsl.h += 360;
    }
    return hslToRGB(hsl);
}

document.addEventListener('contextmenu', event => event.preventDefault());

function init(){
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );

    camera.position.z = 15;
    camera.position.y = 0;

    renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;


    renderer.domElement.id = "canvas";


    document.body.appendChild(renderer.domElement);

    

    buildSkybox();

    addLights();


    

    buildCube(cubeSize.x, cubeSize.y, cubeSize.z);

    camera.lookAt(0,0,0);
    controls = new GrabControls(renderer, pivot);

    controls.run();

    zoomControl = new ObjectControls(camera, renderer.domElement, cubeGroup);

    zoomControl.disableHorizontalRotation();
    zoomControl.disableVerticalRotation();


    

    

    document.addEventListener('pointermove', onDocumentMouseMove, false);


    //Initialize post-processing
    renderScene = new THREE.RenderPass(scene, camera);

    var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );

    var copyShader = new THREE.ShaderPass(THREE.CopyShader);
    copyShader.renderToScreen = true;
    
    //Apply aura
    bloomStrength = (0.25);
    var bloomRadius = 2;
    var bloomThreshold = 0.01;

    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);

    composer = new THREE.EffectComposer(renderer);

    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    composer.addPass(effectFXAA);
    composer.addPass(effectFXAA);

    composer.addPass(bloomPass);
    composer.addPass(copyShader);



    animate();

}

function buildCube(width, height, length){

    pivot = new THREE.Group();
    textGroup = new THREE.Group();
    cubeGroup = new THREE.Group();

    for(var x = 0; x < width; x++){
        for (var y = 0; y < height; y++){
            for(var z = 0; z < length; z++){
                cubeGroup.add(buildCell(x,y,z));
            }
        }
    }

    var position = new THREE.Box3().setFromObject(cubeGroup).getCenter(cubeGroup.position).multiplyScalar(-1);
    cubeGroup.position = position;

    pivot.add(textGroup);


    var offsets = new THREE.Vector3();

    if(width % 2 == 1){
        offsets.x = Math.round(width/2);
    } else {
        offsets.x = width/2+0.5;
    }
    if(height % 2 == 1){
        offsets.y = Math.round(height/2);
    } else {
        offsets.y = height/2+0.5;
    }
    if(length % 2 == 1){
        offsets.z = Math.round(length/2);
    } else {
        offsets.z = length/2+0.5;
    }


    textGroup.position.set(-width+offsets.x,-height+offsets.y,-length+offsets.z)

    
    pivot.position.set(0,0,0);

    pivot.rotation.y = 2 * Math.PI / 3
    pivot.rotation.x = 1 * Math.PI / 6

    

    var box = new THREE.Box3().setFromObject(cubeGroup);

    const wireframeGeometry = new THREE.BoxGeometry(box.max.x - box.min.x + 0.5, box.max.y - box.min.y + 0.5, box.max.z - box.min.z + 0.5);
    var wireframeGeo = new THREE.EdgesGeometry(wireframeGeometry);

    wireframe = new THREE.LineSegments(wireframeGeo);

    wireframe.material.transparent = true;
    wireframe.material.opacity = 0.5;

    scene.add(wireframe);

    wireframe.position.set(0,0,0);

    pivot.add(cubeGroup, wireframe);

    var m = Math.max(cubeSize.x,cubeSize.y,cubeSize.z);

    pivot.scale.x = (6 / m);
    pivot.scale.y = (6 / m);
    pivot.scale.z = (6 / m);

    


    scene.add(pivot);

    
}

function addLights(){
    //Create ambient light
    var ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.25 );

    //Create directional sunlight
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1, 100 );
    directionalLight.position.set(3,5,3);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;

    scene.add(ambientLight, directionalLight);
}

function buildSkybox(){

    const materialArray = createMaterialArray("corona");
    skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);

}

const textLoader = new THREE.TextureLoader()
const numbers = []

for(var n = 1; n < 27; n++){
    numbers.push(textLoader.load("./img/numbers/"+n+".png"))
}

function buildCell(x,y,z){

    const cellGeo = new THREE.BoxGeometry(0.8,0.8,0.8);
    const cellMaterial = new THREE.MeshLambertMaterial({color: cell_color, opacity: 0.9, transparent: true});
    const cell = new THREE.Mesh(cellGeo, cellMaterial);

    cell.name = (`${x},${y},${z}`);

    cell.position.set(x,y,z);

    return cell;

}

function createMaterialArray(filename){
    const skyboxImagePaths = createPathStrings(filename);
    const materialArray = skyboxImagePaths.map(image => {
        let texture = new THREE.TextureLoader().load(image);

        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    });

    return materialArray;
}

function createPathStrings(filename){
    const basePath = "./img/skybox/";
    const baseFilename = basePath + filename;
    const fileType = ".png";
    const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
    const pathStrings = sides.map(side => {
        return baseFilename + "_" + side + fileType;
    });
    return pathStrings;
}

function onDocumentMouseMove(event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();
  
    // update the mouse variable
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
var frame = 0;




function animate(){
    frame++;
    
    requestAnimationFrame(animate);

    skybox.rotation.y += 0.0001;
    skybox.rotation.x += 0.00001;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    raycaster.camera = camera;


    var intersects = raycaster.intersectObject(cubeGroup, true);

    currColor = rainbow(frame);

    wireframe.material.color.set(currColor);

    
    for(cube of cubeGroup.children){
        if (INTERSECTED == cube) continue;
        if (FLAGGED_OBJECTS.includes(INTERSECTED)) continue;
        cube.material.color.set(currColor);
    }

    for (cube of FLAGGED_OBJECTS){
        if (INTERSECTED == cube) continue;
        cube.material.color.set(0xde8202);
    }

    if(gameOver){
        for(cube of BOMB_OBJECTS){
            cube.material.color.set(0xeb1010);
        }
    }


    if(isDragging && (Math.abs(mouse.x - mouse_original_pos.x)*1000 > 5 || Math.abs(mouse.y - mouse_original_pos.y)*1000 > 5)){
        $('html,body').css('cursor', 'grabbing');
    }
    else if (intersects.length > 0) {
        
        var object = intersects[0].object;
        $('html,body').css('cursor', 'pointer');

        if (INTERSECTED && object != INTERSECTED){

            INTERSECTED.material.color.set(currColor);
            INTERSECTED = null;

        }
        if(!gameOver){
            object.material.color.set(0xffff00);
            INTERSECTED = object;
        }
 
    } else {
        $('html,body').css('cursor', 'default');
        if (INTERSECTED){
            INTERSECTED.material.color.set(currColor);
            INTERSECTED = null;
        }
    }
    
    if(INTERSECTED){
        var coordinates = INTERSECTED.name.split(",");
        var iX = coordinates[0]; var iY = coordinates[1]; var iZ = coordinates[2];
    }
    


    


    for (cube of QUEUED_CUBES){

        if (cube.scale.x >= 0){
            cube.scale.x -= 0.05;
            cube.scale.y -= 0.05;
            cube.scale.z -= 0.05;

            var coordinates = cube.name.split(",");
            var iX = coordinates[0]; var iY = coordinates[1]; var iZ = coordinates[2];


            if (cube.scale.x <= 0.051){
                if(bombs_data[iX][iY][iZ] != 0){
                    if(!cube.text){

                    }
                }


            }
        }

    }

    renderer.render(scene, camera);
    composer.render();


    

    
}

function get_screen_xy( position, camera ) {
    var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    pos.applyMatrix4( projScreenMat );

    return { x: ( pos.x + 1 ) * window.innerWidth / 2,
        y: ( - pos.y + 1 ) * window.innerHeight / 2 };
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

revealed = [];

function endGame(){
    gameOver = true;
    return;
}

function reveal(initial_reveal, x, y, z){

    if (gameOver) return;

    CLEARING_JOB = true;

    if (revealed.filter(c => c.x == x && c.y == y && c.z == z).length > 0) return;

    var cube = cubeGroup.getObjectByName(`${x},${y},${z}`);

    if(FLAGGED_OBJECTS.includes(cube)) return;

    if(BOMB_OBJECTS.includes(cube)){
        endGame();
        return;
    }


    revealed.push({"x": x, "y": y, "z": z});

    if (x < 0 || y < 0 || z < 0 || x >= bombs_data.length || y >= bombs_data[0].length || z >= bombs_data[0][0].length) return;

    var number = bombs_data[x][y][z];
    
    var distance_from_initial_click = Math.ceil(Math.sqrt(Math.pow(x - initial_reveal.x, 2) + Math.pow(y - initial_reveal.y, 2) + Math.pow(z - initial_reveal.z, 2)));

    if(typeof REVEALED_CUBES[distance_from_initial_click] === 'undefined'){
        REVEALED_CUBES[distance_from_initial_click] = []
    }
    REVEALED_CUBES[distance_from_initial_click].push(cubeGroup.getObjectByName(`${x},${y},${z}`))

    if(number == 0){
        iterate3D(3, 3, 3, function(rX, rY, rZ){

            revealX = parseInt(x) + (rX-1);
            revealY = parseInt(y) + (rY-1);
            revealZ = parseInt(z) + (rZ-1);

            reveal(initial_reveal, revealX, revealY, revealZ);
        });
    }

    return Promise.resolve(1);
}

async function reveal_init(initial_reveal, x,y,z){
    reveal(initial_reveal, x, y, z);
    return Promise.resolve(1);
}

let CLEARING_JOB = false;


let mouse_original_pos = new THREE.Vector2();

$(document).mousedown(function(e){
    mouse_original_pos.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse_original_pos.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

$(document).mouseup(function(e){

    if(gameOver) return;
    
    var mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    if (Math.abs(mouseX - mouse_original_pos.x)*1000 > 5 || Math.abs(mouseY - mouse_original_pos.y)*1000 > 5){
        return;
    }



    if(CLEARING_JOB) return;

    if(!INTERSECTED) return;

    if(e.which == 3) return rightClick(e);
    if(e.which != 1) return;

    var name = INTERSECTED.name;

    var coordinates = name.split(",");
    var iX = coordinates[0]; var iY = coordinates[1]; var iZ = coordinates[2];


    if(bombs_data == null){
        generateBoard({
            x: cubeSize.x, y: cubeSize.y, z: cubeSize.z
        }, {
            x: iX, y: iY, z: iZ
        }, bombs);
    }
    

    REVEALED_CUBES = [];

    reveal_init({
        x: iX,
        y: iY,
        z: iZ
    },iX,iY,iZ).then(() => {
        return;
    });

    var animateClearing = setIntervalX(function(index){

        CLEARING_JOB = true;

        var cubes = REVEALED_CUBES[index];

        try {
            for (cube of cubes) {
                QUEUED_CUBES.push(cube);
            }
        } catch(e){
            CLEARING_JOB = false;
            window.clearInterval(animateClearing);
        }

    }, 100, REVEALED_CUBES.LENGTH);

});

let BOMB_OBJECTS = [];
let FLAGGED_OBJECTS = [];

function rightClick(e){

    if(!INTERSECTED) return;

    var coordinates = INTERSECTED.name.split(",");
    var iX = coordinates[0]; var iY = coordinates[1]; var iZ = coordinates[2];

    if(!FLAGGED_OBJECTS.includes(INTERSECTED)){

        FLAGGED_OBJECTS.push(INTERSECTED);

    } else {
        var index = FLAGGED_OBJECTS.indexOf(INTERSECTED);
        if (index !== -1){
            FLAGGED_OBJECTS.splice(index, 1);
        }
    }


    if(arrayCompare(FLAGGED_OBJECTS, BOMB_OBJECTS)){
        alert("You win!");
    }



}



function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {

       callback(x);

       if (++x === repetitions) {
           window.clearInterval(intervalID);
       }
    }, delay);
    return intervalID;
}


function arrayCompare(_arr1, _arr2) {
    if (
      !Array.isArray(_arr1)
      || !Array.isArray(_arr2)
      || _arr1.length !== _arr2.length
      ) {
        return false;
      }
    
    // .concat() to not mutate arguments
    const arr1 = _arr1.concat().sort((a,b) => (a.uuid > b.uuid) ? 1 : -1 );
    const arr2 = _arr2.concat().sort((a,b) => (a.uuid > b.uuid) ? 1 : -1 );
    
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
         }
    }
    
    return true;
}

init();