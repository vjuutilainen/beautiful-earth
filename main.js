var initScene = function(){

  width = window.innerWidth;
  height = window.innerHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( width, height );
  renderer.setClearColor( 0x000000 );

  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000000 );

  camera.position.z = 2000;
  camera.position.x = 0;
  camera.position.y = 0;

  controls = new THREE.TrackballControls( camera, renderer.domElement );

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;


  scene = new THREE.Scene();

  light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 0, 1000 );
        light.position.normalize();
        scene.add( light );

   earth = new Earth();
   
   getData(earth.gridcenter,earth.defaultRange);
   prepareUI();
   animate();

}

var getData = function(location,range){

  var xhr = new XMLHttpRequest();
  xhr.open("GET",'Location?x='+location.x.toString()+'&y='+location.y.toString()+'&range='+range.toString(),true);
  xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function(obj){
      if(xhr.readyState == 4 && xhr.status == 200){
       
        var data = JSON.parse(xhr.responseText);

        earth.terrain = new Area(data,range);
        earth.terrain.draw();

        earth.loading = false;

      }
    }

  xhr.send();

}

var Earth = function(){

    this.defaultRange = 100; // area of 100 x 100, 
    this.terrain;

    this.gridcenter = { x: 2160/2, y: 1080/2};
   
    this.terrainScale = 1000; // one grid segment is arc minute (1852 meters), multiply that
    this.elevationScale = 1; // these are meters before scaling 


}

Earth.prototype = {

    update: function(){

    }

   
}

var Area = function(data,range){

  this.range = range;
  this.data = data;
  this.material = new THREE.MeshLambertMaterial( { shading: THREE.FlatShading, wireframe:true, vertexColors: THREE.VertexColors } );
  
}

Area.prototype = {

  draw: function(){

    if(scene.getObjectByName('terrain') !== undefined){
        scene.remove(scene.getObjectByName('terrain'));
      }

    var vertexColors = [];

    var dimx = earth.terrainScale*this.range*2;
    var dimy = earth.terrainScale*this.range*2;

    var geometry = new THREE.PlaneGeometry( dimx, dimy, (this.range*2)-1, (this.range*2)-1);

    console.log(this.data);
  for(var i = 0; i < this.data.data.length; i++){

       geometry.vertices[i].z = this.data.data[i].z*earth.elevationScale;       
  }




  var faceIndices = [ 'a', 'b', 'c'];

  // loop through each face
  for ( var i = 0; i < geometry.faces.length; i ++ ) {

          thisFace  = geometry.faces[i];
          vertexCount = 3; // assume face is THREE.Face3

          // loop through each vertex
          for( var v = 0; v < vertexCount; v++ ) {

            vertexIndex = thisFace[faceIndices[v]];

            p = geometry.vertices[ vertexIndex ];

            elevationColorChange = ((p.z/earth.elevationScale)-this.data.elevation.min)/(this.data.elevation.max-this.data.elevation.min);

            var color = new THREE.Color();
            color.setHSL( elevationColorChange, 1, 0.5);
           
            thisFace.vertexColors[ v ] = color;

          }

        }


var terrain = new THREE.Mesh(geometry, this.material);
terrain.name = 'terrain';
scene.add(terrain);
console.log('added terrain with dimensions x ' + dimx + ' and y ' + dimy + ' and ' + this.range*2 + ' segments per side ');

  }

}

var coordinatesToGrid = function(location){

    var degreeDim = {
      xmin: -180,
      xmax: 180,
      ymin: -90,
      ymax: 90

    };

    location.y = -location.y;

    // if full dataset
    //var xRatio = 21601 / 360;
    //var yRatio = 10801 / 180;

    // if sample
    var xRatio = 2160 / 360;
    var yRatio = 1080 / 180;

    // 10 degrees -> 190 from 0, 190 * x-increment
    var gridx = Math.floor((location.x - degreeDim.xmin) * xRatio); 
    var gridy = Math.floor((location.y - degreeDim.ymin) * yRatio);

    console.log('coordinates ' + location.x + ' ' + -location.y + ' to ' + gridx + ' ' + gridy + ' ' );


  return {x:gridx, y:gridy};

}

var animate = function(time) {

  earth.update();
  renderer.render( scene, camera );
  controls.update();

  

  requestAnimationFrame(animate);


 }

 var prepareUI = function(){

  var locate = document.getElementById("locate");
  var submit = document.getElementById("submit");

  submit.onclick = function(){

    var targetLocation = coordinatesToGrid({x: document.selector.lon.value, y: document.selector.lat.value});
    var target_r = document.selector.range.value.split('x')[0]/2;
    getData(targetLocation,target_r);

  }

  locate.onclick = function(){
   
    var handlePosition = function(position){
      
      var targetLocation = coordinatesToGrid({x: position.coords.longitude, y: position.coords.latitude});
      document.selector.lon.value = position.coords.longitude;
      document.selector.lat.value = position.coords.latitude;

      var target_r = document.selector.range.value.split('x')[0]/2;
      getData(targetLocation,target_r);

    }

    navigator.geolocation.getCurrentPosition(handlePosition);



  }

  /*
  form.onsubmit = function(e){
    e.preventDefault();



    
    
  }
  */
}

window.onload = function(){

  initScene();

}