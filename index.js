let scene, camera, renderer, skyboxGeo, skybox, pivot, controls;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var cubeGroup;
var registered_cells = []
let INTERSECTED;

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

    

    

    document.addEventListener('pointermove', onDocumentMouseMove, false);


    animate();

    var controls = new ObjectControls(camera, renderer.domElement, pivot);

    controls.setRotationSpeed(0.0275);
    controls.enableVerticalRotation();

    controls.setMaxVerticalRotationAngle(Math.PI / 2 - 0.5, Math.PI / 2 - 0.5);

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
    const cellMaterial = new THREE.MeshLambertMaterial({color: 0xdbdbdb, opacity: 0.9, transparent: true});
    const cell = new THREE.Mesh(cellGeo, cellMaterial);

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

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cubeGroup);

    if ( intersects.length > 0 ) {

        if ( INTERSECTED != intersects[ 0 ].object ) {

            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );

        }

    } else {

        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;

    }


    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    skybox.rotation.y += 0.0001;
    skybox.rotation.x += 0.00001;

    

    
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / (window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

init();