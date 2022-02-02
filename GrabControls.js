var isDragging = false;
class GrabControls{

    constructor(renderer, rotation_object){

        if (renderer == undefined) {
            console.error("Renderer not given.");
            return;
        }
        if (rotation_object == undefined){
            console.error("Rotation object not given.");
            return;
        }

        this.renderer = renderer;

        

        this.rotation_object = rotation_object;
        this.domElement = document;

        isDragging = false;
        this.previousMousePosition = {
            x: 0,
            y: 0
        };

        this.run = function(){

            var rotation_object = this.rotation_object;
            var previousMousePosition = this.previousMousePosition;
    
    
            $(document).on('mousedown', function(e) {
                isDragging = true;
            })
            .on('mousemove', function(e) {
    
                if (rotation_object == null) return;
            
                var deltaMove = {
                    x: (e.offsetX-previousMousePosition.x)/2,
                    y: (e.offsetY-previousMousePosition.y)/2
                };
            
                if(isDragging) {
                        
                    var deltaRotationQuaternion = new THREE.Quaternion()
                        .setFromEuler(new THREE.Euler(
                            toRadians(deltaMove.y * 1),
                            toRadians(deltaMove.x * 1),
                            0,
                            'XYZ'
                        ));
                    
                    rotation_object.quaternion.multiplyQuaternions(deltaRotationQuaternion, rotation_object.quaternion);
                }
                
                previousMousePosition = {
                    x: e.offsetX,
                    y: e.offsetY
                };
            });
    
            $(document).on('mouseup', function(e) {
                isDragging = false;
            });
        }
    }

}




function toRadians(angle) {
	return angle * (Math.PI / 180);
}

function toDegrees(angle) {
	return angle * (180 / Math.PI);
}