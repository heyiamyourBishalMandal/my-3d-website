import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- 1. Scene Setup ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- 2. Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false; 

// --- 3. Load Model & Kinetic Engine ---
let productGroup = null;
const loader = new GLTFLoader();

loader.load('./product.glb', (gltf) => {
  productGroup = gltf.scene;
  productGroup.scale.set(0.15, 0.15, 0.15);
  
  // Center the entire group in the global world space first
  const box = new THREE.Box3().setFromObject(productGroup);
  const center = box.getCenter(new THREE.Vector3());
  productGroup.position.sub(center);
  scene.add(productGroup);

  const meshes = [];

  // Step 1: Gather meshes and calculate their true directions away from the center
  productGroup.traverse((child) => {
    if (child.isMesh) {
      // Compute individual mesh bounding box to find its true center point
      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());
      
      // Create a normalized directional vector pointing outward from center
      const explodeDirection = meshCenter.clone().normalize();

      meshes.push({
        mesh: child,
        origX: child.position.x,
        origY: child.position.y,
        origZ: child.position.z,
        direction: explodeDirection
      });
    }
  });

  // STEP 2: THE INTRO "BOOM" SLAM ANIMATION
  // We instantly throw the pieces far away, then slam them together on load
  meshes.forEach((item) => {
    gsap.from(item.mesh.position, {
      x: item.origX + item.direction.x * 6,
      y: item.origY + item.direction.y * 6,
      z: item.origZ + item.direction.z * 6,
      duration: 1.4,
      ease: 'power4.out'
    });
  });

  // STEP 3: THE SCROLL "SLOW BLAST"
  // We wait 1.4 seconds for the intro slam to finish BEFORE enabling ScrollTrigger
  setTimeout(() => {
    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#scroll-sections',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    meshes.forEach((item) => {
      // Smoothly blast components outward along their calculated vectors as you scroll
      scrollTimeline.to(item.mesh.position, {
        x: item.origX + item.direction.x * 4, // Multiplier handles explosion distance
        y: item.origY + item.direction.y * 4,
        z: item.origZ + item.direction.z * 4,
        ease: 'none'
      }, 0);

      // Add erratic part rotations during the blast for realism
      scrollTimeline.to(item.mesh.rotation, {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        ease: 'none'
      }, 0);
    });
  }, 1400); 

});

// --- 4. Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 5. Animation Loop ---
const tick = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();