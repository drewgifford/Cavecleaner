let scene, camera, renderer, skyboxGeo, skybox, pivot, controls;
var mouse = new THREE.Vector2();

var cubeGroup;
var registered_cells = []
let INTERSECTED;
let cell_color = 0xdbdbdb;

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

    

    buildCube(5,5,5);

    camera.lookAt(0,0,0);
    var controls = new GrabControls(renderer, pivot);

    controls.run();

    

    

    document.addEventListener('pointermove', onDocumentMouseMove, false);

    animate();

}

function buildCube(width, height, length){

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

    pivot = new THREE.Group();
    pivot.position.set(0,0,0);

    pivot.rotation.y = 2 * Math.PI / 3
    pivot.rotation.x = 1 * Math.PI / 6

    pivot.add(cubeGroup);

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

function animate(){
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    skybox.rotation.y += 0.0001;
    skybox.rotation.x += 0.00001;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());


    var intersects = raycaster.intersectObject(cubeGroup, true);


    if (intersects.length > 0) {
        
        var object = intersects[0].object;
        $('html,body').css('cursor', 'pointer');

        if (INTERSECTED && object != INTERSECTED){

            INTERSECTED.material.color.set(cell_color);
            INTERSECTED = null;

        }
        object.material.color.set(0xffff00);
        INTERSECTED = object;
 
    } else {
        $('html,body').css('cursor', 'default');
        if (INTERSECTED){
            INTERSECTED.material.color.set(cell_color);
            INTERSECTED = null;
        }
    }
    

    
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

init();

revealed = [];
function reveal(x, y, z){

    console.log("Attempting to reveal",x, y, z);

    if (revealed.includes({"x": x, "y": y, "z": z})) return;

    var number = bombs_data[x][y][z];
    revealed.push({"x": x, "y": y, "z": z});

    console.log("Finding Object", x, y, z);
    cubeGroup.getObjectByName(`${x},${y},${z}`).material.color.set(0x00ffff);

    console.log("What's the number?", number);

    if(number == 0){
        iterate3D(3, 3, 3, function(rX, rY, rZ){
            revealX = parseInt(x) + (rX-1);
            revealY = parseInt(y) + (rY-1);
            revealZ = parseInt(z) + (rZ-1);
            reveal(revealX, revealY, revealZ);
        });
    }
}

$(document).click(function(e){

    if(!INTERSECTED) return;

    var name = INTERSECTED.name;

    var coordinates = name.split(",");
    var iX = coordinates[0]; var iY = coordinates[1]; var iZ = coordinates[2];

    reveal(iX,iY,iZ);

});