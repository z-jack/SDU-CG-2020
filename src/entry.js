import { OBJLoader2 } from "three/examples/jsm/loaders/OBJLoader2";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import {
  Mesh,
  Scene,
  EdgesGeometry,
  PerspectiveCamera,
  WebGLRenderer,
  MeshBasicMaterial,
  Raycaster,
  Vector2,
  Vector3,
  PlaneGeometry,
  PointLight,
  LineBasicMaterial,
  LineSegments,
  Geometry,
  PointsMaterial,
  Points,
  DoubleSide,
} from "three";
import RBF from "./rbf";

function isRBF(buffer) {
  if (!(buffer instanceof ArrayBuffer)) return false;
  if (buffer.byteLength < 4) return false;
  return (
    [...new Int8Array(buffer.slice(0, 4))]
      .map((x) => String.fromCharCode(x))
      .join("") == "#RBF"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const loader = new OBJLoader2();
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    75,
    (window.innerWidth - 48) / (window.innerHeight - 48),
    0.1,
    2000
  );

  camera.position.y = 30;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xeeeeee);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth - 48, window.innerHeight - 48);
  document.body.append(renderer.domElement);

  const groundGeometry = new PlaneGeometry(100, 100, 10, 10);
  const groundMaterial = new MeshBasicMaterial({
    color: 0x555555,
    wireframe: true,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotateX(Math.PI / 2);
  scene.add(ground);

  const lights = Array(4)
    .fill(0)
    .map((_) => new PointLight(0xffffff, 0.3));
  lights.forEach((light, index) => {
    light.position.set(
      Math.sign(index - 1.5) * Math.abs(index % 2) * 500,
      500,
      Math.sign(index - 1.5) * Math.abs((index % 2) - 1) * 500
    );
    scene.add(light);
  });

  const orbitControl = new OrbitControls(camera, renderer.domElement);
  orbitControl.keys = {
    UP: 87,
    BOTTOM: 83,
    LEFT: 65,
    RIGHT: 68,
  };

  const transformControl = new TransformControls(camera, renderer.domElement);
  transformControl.addEventListener(
    "mouseDown",
    () => (orbitControl.enabled = false)
  );
  transformControl.addEventListener(
    "mouseUp",
    () => (orbitControl.enabled = true)
  );
  let mode = 0;
  const allModes = ["translate", "rotate", "scale"];
  window.addEventListener("dblclick", () => {
    mode += 1;
    mode %= 3;
    transformControl.setMode(allModes[mode]);
  });
  scene.add(transformControl);

  const rayCaster = new Raycaster();
  const mouse = new Vector2();
  function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.offsetX / (window.innerWidth - 48)) * 2 - 1;
    mouse.y = -(event.offsetY / (window.innerHeight - 48)) * 2 + 1;
  }
  renderer.domElement.addEventListener("mousemove", onMouseMove, false);

  const hint = document.getElementById("hint");
  const fileLoader = document.getElementById("file-loader");
  const objId = document.getElementById("obj-id");
  const objectArray = [];

  fileLoader.addEventListener("change", (event) => {
    console.log(event);
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (isRBF(reader.result)) {
          console.log("RBF!");
          const { originalPoints, reconstructedPoints } = RBF(reader.result);
          console.log(originalPoints, reconstructedPoints);

          const originalGeometry = new Geometry();
          originalGeometry.vertices.push(
            ...originalPoints.map((point) => new Vector3(...point))
          );
          const originalMaterial = new PointsMaterial({
            size: 1,
            color: 0xff0000,
          });
          const originalDots = new Points(originalGeometry, originalMaterial);
          scene.add(originalDots);

          const reconstructedGeometry = new Geometry();
          reconstructedGeometry.vertices.push(
            ...reconstructedPoints.map((point) => new Vector3(...point))
          );
          const reconstructedMaterial = new PointsMaterial({
            size: 0.5,
            color: 0x00ff00,
          });
          const reconstructedDots = new Points(
            reconstructedGeometry,
            reconstructedMaterial
          );
          scene.add(reconstructedDots);
          return;
        }
        const result = loader.parse(reader.result);
        console.log(result);
        result.children.forEach((mesh) => {
          console.log(mesh);

          mesh.material.polygonOffset = true;
          mesh.material.polygonOffsetFactor = 1;
          mesh.material.polygonOffsetUnits = 1;
          mesh.material.side = DoubleSide;

          var geo = new EdgesGeometry(mesh.geometry);
          var mat = new LineBasicMaterial({
            color: 0xff0000,
            linewidth: 5,
          });
          var wireframe = new LineSegments(geo, mat);
          mesh.add(wireframe);

          transformControl.attach(mesh);
          objectArray.forEach((mesh) => scene.remove(mesh));
          objectArray.splice(0, objectArray.length);
          objectArray.push(mesh);
          scene.add(mesh);
        });
      };

      reader.readAsArrayBuffer(file);
    }
  });

  hint.setAttribute("class", "success");
  hint.innerHTML = "已就绪";

  const coloredFaces = [];
  function animate() {
    requestAnimationFrame(animate);
    orbitControl.update();

    coloredFaces.forEach((face) => {
      face.color.fromArray([]);
    });
    coloredFaces.splice(0, coloredFaces.length);
    objId.innerHTML = "";

    rayCaster.setFromCamera(mouse, camera);
    const intersects = rayCaster.intersectObjects(objectArray);
    for (var i = 0; i < intersects.length; i++) {
      // intersects[i].object.material.color.set(0xff0000);
      intersects[i].face.color.set(0xff0000);
      intersects[i].object.geometry.colorsNeedUpdate = true;
      intersects[i].object.geometry.elementsNeedUpdate = true;
      coloredFaces.push(intersects[i].face);
      objId.innerHTML = intersects[i].faceIndex;
    }

    renderer.render(scene, camera);
  }
  animate();
});
