// three.js - Advanced Implementation for Modz4.0
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

let scene, camera, renderer, controls, transformControls;
let objects = [];
let dotNetRef;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedObject = null;
let isRunning = true;
let gridHelper, axesHelper;
let particleSystem;

// Initialize Three.js scene
export function initializeThree(canvas, dotNetReference) {
    dotNetRef = dotNetReference;
    isRunning = true;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    mainLight.position.set(5, 12, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4466ff, 0.8);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);
    
    const backLight = new THREE.PointLight(0xffaa66, 0.5);
    backLight.position.set(0, 2, -10);
    scene.add(backLight);
    
    // Helpers
    gridHelper = new THREE.GridHelper(30, 30, 0x88aaff, 0x335588);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    
    axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Ground plane with subtle texture
    const groundGeometry = new THREE.CircleGeometry(20, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.8, metalness: 0.2 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);
    
    // Add sample objects with variety
    addSampleCube();
    addSampleSphere();
    addSampleTorus();
    addSampleCone();
    
    // Particle system for atmosphere
    createParticles();
    
    // Controls
    initControls(camera, renderer.domElement);
    
    // Transform controls
    initTransformControls(camera, renderer.domElement);
    
    // Event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    
    animate();
}

export function stopAnimation() {
    isRunning = false;
    if (dotNetRef) {
        dotNetRef = null;
    }
}

function initControls(camera, domElement) {
    controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.target.set(0, 1, 0);
}

function initTransformControls(camera, domElement) {
    transformControls = new TransformControls(camera, domElement);
    transformControls.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    scene.add(transformControls);
}

function createParticles() {
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * 40;
        positions[i*3+1] = (Math.random() - 0.5) * 20;
        positions[i*3+2] = (Math.random() - 0.5) * 40;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.1, transparent: true });
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

function addSampleCube() {
    const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff8844, emissive: 0x331100, roughness: 0.3, metalness: 0.1 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.position.set(3, 0.6, 2);
    cube.rotation.y = 0.5;
    scene.add(cube);
    objects.push(cube);
}

function addSampleSphere() {
    const geometry = new THREE.SphereGeometry(0.9, 48, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x113355, roughness: 0.2, metalness: 0.3 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.position.set(-2.5, 0.9, -1.5);
    scene.add(sphere);
    objects.push(sphere);
}

function addSampleTorus() {
    const geometry = new THREE.TorusGeometry(1, 0.3, 32, 64);
    const material = new THREE.MeshStandardMaterial({ color: 0xaa66ff, emissive: 0x221133, roughness: 0.4 });
    const torus = new THREE.Mesh(geometry, material);
    torus.castShadow = true;
    torus.receiveShadow = true;
    torus.position.set(-0.5, 1, 3);
    torus.rotation.x = Math.PI / 2;
    torus.rotation.z = 0.3;
    scene.add(torus);
    objects.push(torus);
}

function addSampleCone() {
    const geometry = new THREE.ConeGeometry(0.8, 1.6, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x66cc88, emissive: 0x113322, roughness: 0.3 });
    const cone = new THREE.Mesh(geometry, material);
    cone.castShadow = true;
    cone.receiveShadow = true;
    cone.position.set(1.5, 0.8, -2.5);
    scene.add(cone);
    objects.push(cone);
}

function onMouseDown(event) {
    if (transformControls.dragging) return;
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        transformControls.attach(selectedObject);
    } else {
        selectedObject = null;
        transformControls.detach();
    }
}

function onMouseMove(event) {
    // For future features like hover highlighting
}

function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsedTime = performance.now() / 1000;
    
    // Animate particles
    if (particleSystem) {
        particleSystem.rotation.y += 0.0005;
    }
    
    // Simple rotation for some objects
    objects.forEach(obj => {
        if (obj.geometry.type === 'BoxGeometry' && obj !== selectedObject) {
            obj.rotation.y += 0.005;
        }
        if (obj.geometry.type === 'TorusGeometry' && obj !== selectedObject) {
            obj.rotation.z += 0.01;
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
    
    // Report FPS
    if (Math.floor(elapsedTime) % 1 === 0 && dotNetRef) {
        const fps = Math.round(1 / delta);
        dotNetRef.invokeMethodAsync('UpdateFPS', fps)
            .catch(err => console.warn('FPS update failed:', err));
    }
}

// Public API
export function loadDefaultScene() { /* already loaded */ }

export function getObjectCount() {
    return objects.length;
}

export function setPlayMode(isPlaying) {
    controls.enabled = !isPlaying;
    transformControls.enabled = !isPlaying;
}

export function saveScene(filename) {
    const sceneData = {
        objects: objects.map(obj => ({
            type: obj.geometry.type,
            position: obj.position.toArray(),
            rotation: obj.rotation.toArray(),
            scale: obj.scale.toArray(),
            color: obj.material.color.getHex(),
            emissive: obj.material.emissive ? obj.material.emissive.getHex() : null
        }))
    };
    const json = JSON.stringify(sceneData, null, 2);
    localStorage.setItem(filename, json);
}

export function loadScene(filename) {
    const json = localStorage.getItem(filename);
    if (json) {
        const sceneData = JSON.parse(json);
        while (objects.length > 1) {
            const obj = objects.pop();
            scene.remove(obj);
        }
        sceneData.objects.forEach(objData => {
            let geometry;
            switch (objData.type) {
                case 'BoxGeometry': geometry = new THREE.BoxGeometry(1, 1, 1); break;
                case 'SphereGeometry': geometry = new THREE.SphereGeometry(0.9, 32); break;
                case 'TorusGeometry': geometry = new THREE.TorusGeometry(1, 0.3, 16, 50); break;
                case 'ConeGeometry': geometry = new THREE.ConeGeometry(0.8, 1.6, 16); break;
                default: return;
            }
            const material = new THREE.MeshStandardMaterial({ color: objData.color, emissive: objData.emissive || 0 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.fromArray(objData.position);
            mesh.rotation.fromArray(objData.rotation);
            mesh.scale.fromArray(objData.scale);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        });
    }
}

// Sprite Editor (advanced)
export function initializeSpriteEditor(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let drawing = false;
    let lastX = 0, lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Pressure-sensitive? We'll simulate with distance
        const dist = Math.hypot(x - lastX, y - lastY);
        const dynamicSize = Math.min(currentSize * (1 + dist * 0.1), currentSize * 3);
        
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = dynamicSize;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        lastX = x; lastY = y;
    });
    
    canvas.addEventListener('mouseup', () => { drawing = false; });
    canvas.addEventListener('mouseleave', () => { drawing = false; });
}

let currentColor = '#000000';
let currentSize = 5;

export function setSpriteTool(tool, color, size) {
    currentColor = color;
    currentSize = size;
    // Could change cursor, etc.
}

export function getSpriteCanvasData() {
    const canvas = document.getElementById('spriteCanvas');
    return canvas.toDataURL('image/png');
}

export function exportSpriteCanvas() {
    const canvas = document.getElementById('spriteCanvas');
    const link = document.createElement('a');
    link.download = 'sprite.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Photo Editor (advanced)
export function initializePhotoEditor(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Segoe UI"';
    ctx.fillText('Drop image', 180, 250);
}

export function drawImageToCanvas(imageData) {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
}

export function applyImageFilter(filter) {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch (filter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
                data[i] = data[i+1] = data[i+2] = avg;
            }
            break;
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                data[i] = Math.min(255, r*0.393 + g*0.769 + b*0.189);
                data[i+1] = Math.min(255, r*0.349 + g*0.686 + b*0.168);
                data[i+2] = Math.min(255, r*0.272 + g*0.534 + b*0.131);
            }
            break;
        case 'invert':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i+1] = 255 - data[i+1];
                data[i+2] = 255 - data[i+2];
            }
            break;
        case 'blur':
            const width = canvas.width, height = canvas.height;
            const output = ctx.getImageData(0, 0, width, height);
            const out = output.data;
            for (let y = 1; y < height-1; y++) {
                for (let x = 1; x < width-1; x++) {
                    let r=0,g=0,b=0;
                    for (let dy=-1; dy<=1; dy++) {
                        for (let dx=-1; dx<=1; dx++) {
                            const idx = ((y+dy)*width + (x+dx))*4;
                            r += data[idx];
                            g += data[idx+1];
                            b += data[idx+2];
                        }
                    }
                    const idx = (y*width + x)*4;
                    out[idx] = r/9;
                    out[idx+1] = g/9;
                    out[idx+2] = b/9;
                    out[idx+3] = data[idx+3];
                }
            }
            ctx.putImageData(output, 0, 0);
            return;
        case 'sharpen':
            // Simple sharpen kernel
            const w = canvas.width, h = canvas.height;
            const outImg = ctx.getImageData(0, 0, w, h);
            const outD = outImg.data;
            for (let y = 1; y < h-1; y++) {
                for (let x = 1; x < w-1; x++) {
                    let r=0,g=0,b=0;
                    for (let dy=-1; dy<=1; dy++) {
                        for (let dx=-1; dx<=1; dx++) {
                            const idx = ((y+dy)*w + (x+dx))*4;
                            const kernel = (dx===0 && dy===0) ? 5 : -1;
                            r += data[idx] * kernel;
                            g += data[idx+1] * kernel;
                            b += data[idx+2] * kernel;
                        }
                    }
                    const idx = (y*w + x)*4;
                    outD[idx] = Math.min(255, Math.max(0, r));
                    outD[idx+1] = Math.min(255, Math.max(0, g));
                    outD[idx+2] = Math.min(255, Math.max(0, b));
                    outD[idx+3] = data[idx+3];
                }
            }
            ctx.putImageData(outImg, 0, 0);
            return;
        case 'edge':
            const w2 = canvas.width, h2 = canvas.height;
            const edgeImg = ctx.getImageData(0, 0, w2, h2);
            const edgeD = edgeImg.data;
            for (let y = 1; y < h2-1; y++) {
                for (let x = 1; x < w2-1; x++) {
                    let rx=0, ry=0, gx=0, gy=0, bx=0, by=0;
                    for (let dy=-1; dy<=1; dy++) {
                        for (let dx=-1; dx<=1; dx++) {
                            const idx = ((y+dy)*w2 + (x+dx))*4;
                            const kernelX = dx;
                            const kernelY = dy;
                            rx += data[idx] * kernelX;
                            gx += data[idx+1] * kernelX;
                            bx += data[idx+2] * kernelX;
                            ry += data[idx] * kernelY;
                            gy += data[idx+1] * kernelY;
                            by += data[idx+2] * kernelY;
                        }
                    }
                    const idx = (y*w2 + x)*4;
                    const magnitude = Math.sqrt(rx*rx + ry*ry + gx*gx + gy*gy + bx*bx + by*by) / 2;
                    edgeD[idx] = edgeD[idx+1] = edgeD[idx+2] = Math.min(255, magnitude);
                    edgeD[idx+3] = data[idx+3];
                }
            }
            ctx.putImageData(edgeImg, 0, 0);
            return;
    }
    ctx.putImageData(imageData, 0, 0);
}

export function updateImageAdjustments(brightness, contrast, saturation, blur) {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    brightness = Number(brightness) || 0;
    contrast = Number(contrast) || 0;
    saturation = Number(saturation) || 0;
    
    for (let i = 0; i < data.length; i += 4) {
        // Brightness
        data[i] += brightness;
        data[i+1] += brightness;
        data[i+2] += brightness;
        
        // Contrast
        let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        data[i] = factor * (data[i] - 128) + 128;
        data[i+1] = factor * (data[i+1] - 128) + 128;
        data[i+2] = factor * (data[i+2] - 128) + 128;
        
        // Saturation (simple)
        const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
        data[i] = gray + (data[i] - gray) * (1 + saturation/100);
        data[i+1] = gray + (data[i+1] - gray) * (1 + saturation/100);
        data[i+2] = gray + (data[i+2] - gray) * (1 + saturation/100);
        
        // Clamp
        data[i] = Math.min(255, Math.max(0, data[i]));
        data[i+1] = Math.min(255, Math.max(0, data[i+1]));
        data[i+2] = Math.min(255, Math.max(0, data[i+2]));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

export function getCanvasImageData() {
    const canvas = document.getElementById('photoCanvas');
    return canvas.toDataURL('image/png');
}

export function exportCanvasImage() {
    const canvas = document.getElementById('photoCanvas');
    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Animation Editor
export function initializeAnimationEditor() {
    console.log('Animation editor initialized');
}

export function previewSpriteAnimation(frames) {
    console.log('Preview animation with frames:', frames);
}

// Make functions globally accessible
window.initializeThree = initializeThree;
window.stopAnimation = stopAnimation;
window.loadDefaultScene = loadDefaultScene;
window.getObjectCount = getObjectCount;
window.setPlayMode = setPlayMode;
window.saveScene = saveScene;
window.loadScene = loadScene;
window.initializeSpriteEditor = initializeSpriteEditor;
window.setSpriteTool = setSpriteTool;
window.getSpriteCanvasData = getSpriteCanvasData;
window.exportSpriteCanvas = exportSpriteCanvas;
window.initializePhotoEditor = initializePhotoEditor;
window.drawImageToCanvas = drawImageToCanvas;
window.applyImageFilter = applyImageFilter;
window.updateImageAdjustments = updateImageAdjustments;
window.getCanvasImageData = getCanvasImageData;
window.exportCanvasImage = exportCanvasImage;
window.initializeAnimationEditor = initializeAnimationEditor;
window.previewSpriteAnimation = previewSpriteAnimation;