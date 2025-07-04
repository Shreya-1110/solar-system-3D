const canvas = document.getElementById('solarCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color("#0d1b2a");

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1.5);
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
scene.add(ambient);

const loader = new THREE.TextureLoader();

const sunTexture = loader.load('texture/sun.jpg');
const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
const sunGeo = new THREE.SphereGeometry(2, 32, 32);
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const planetData = [
  { name: 'Mercury', radius: 0.2, distance: 4, speed: 0.04, texture: 'mercury.jpg' },
  { name: 'Venus',   radius: 0.4, distance: 6, speed: 0.015, texture: 'venus.jpg' },
  { name: 'Earth',   radius: 0.4, distance: 8, speed: 0.01, texture: 'earth.jpg' },
  { name: 'Mars',    radius: 0.3, distance: 10, speed: 0.008, texture: 'mars.jpg' },
  { name: 'Jupiter', radius: 0.8, distance: 13, speed: 0.006, texture: 'jupiter.jpg' },
  { name: 'Saturn',  radius: 0.7, distance: 16, speed: 0.005, texture: 'saturn.jpg' },
  { name: 'Uranus',  radius: 0.6, distance: 19, speed: 0.004, texture: 'uranus.jpg' },
  { name: 'Neptune', radius: 0.6, distance: 22, speed: 0.003, texture: 'neptune.jpg' }
];

const planets = [];
const controlsDiv = document.getElementById('controls');

// Create visible orbits
planetData.forEach(data => {
  const orbit = new THREE.RingGeometry(data.distance - 0.01, data.distance + 0.01, 64);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(orbit, orbitMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
});

// Create planets
planetData.forEach(data => {
  const geo = new THREE.SphereGeometry(data.radius, 32, 32);
  const texture = loader.load(`texture/${data.texture}`);
  const mat = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  const obj = { ...data, mesh, angle: 0 };
  planets.push(obj);

  // Speed UI
  const label = document.createElement('label');
  label.textContent = data.name;
  const container = document.createElement('div');
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0.001;
  slider.max = 0.05;
  slider.step = 0.001;
  slider.value = data.speed;
  const valueLabel = document.createElement('span');
  valueLabel.textContent = slider.value;

  slider.addEventListener('input', () => {
    const p = planets.find(p => p.name === data.name);
    if (p) p.speed = parseFloat(slider.value);
    valueLabel.textContent = slider.value;
  });

  container.appendChild(slider);
  container.appendChild(valueLabel);
  label.appendChild(container);
  controlsDiv.appendChild(label);
});

// Saturn Ring
const saturn = planets.find(p => p.name === 'Saturn');
if (saturn) {
  const ringGeo = new THREE.RingGeometry(saturn.radius * 1.2, saturn.radius * 2.5, 64);
  const ringTex = loader.load('texture/saturn_ring.png');
  const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  saturn.mesh.add(ring);
}

// Earth's Moon
const earth = planets.find(p => p.name === 'Earth');
if (earth) {
  const moonTex = loader.load('texture/moon.jpg');
  const moonGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const moonMat = new THREE.MeshStandardMaterial({ map: moonTex });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  earth.moon = moon;
  earth.moonAngle = 0;
  scene.add(moon);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planets.map(p => p.mesh));
  if (hits.length > 0) {
    const name = planets.find(p => p.mesh === hits[0].object).name;
    tooltip.style.display = 'block';
    tooltip.textContent = name;
    tooltip.style.left = event.clientX + 10 + 'px';
    tooltip.style.top = event.clientY + 10 + 'px';
  } else {
    tooltip.style.display = 'none';
  }
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planets.map(p => p.mesh));
  if (hits.length > 0) {
    const pos = hits[0].object.position;
    camera.position.set(pos.x + 5, pos.y + 2, pos.z + 5);
    camera.lookAt(pos);
  }
});

let isPaused = false;
document.getElementById('toggle').addEventListener('click', () => {
  isPaused = !isPaused;
  document.getElementById('toggle').textContent = isPaused ? 'Resume' : 'Pause';
});

const themeBtn = document.getElementById('themeToggle');
let isDark = true;
themeBtn.addEventListener('click', () => {
  isDark = !isDark;
  document.body.style.backgroundColor = isDark ? 'black' : 'white';
  document.body.style.color = isDark ? 'white' : 'black';
  scene.background = new THREE.Color(isDark ? '#0d1b2a' : '#f0f0f0');
  themeBtn.textContent = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
});

// Add Stars
function addStars() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = THREE.MathUtils.randFloatSpread(600);
    const y = THREE.MathUtils.randFloatSpread(600);
    const z = THREE.MathUtils.randFloatSpread(600);
    vertices.push(x, y, z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  scene.add(new THREE.Points(geometry, material));
}
addStars();

// Animate
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach(p => {
      p.angle += p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.distance;
      p.mesh.position.z = Math.sin(p.angle) * p.distance;

      if (p.name === 'Earth' && p.moon) {
        p.moonAngle += 0.03;
        const d = 0.8;
        p.moon.position.x = p.mesh.position.x + Math.cos(p.moonAngle) * d;
        p.moon.position.z = p.mesh.position.z + Math.sin(p.moonAngle) * d;
        p.moon.position.y = p.mesh.position.y;
      }
    });
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
