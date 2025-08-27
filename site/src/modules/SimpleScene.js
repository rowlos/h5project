import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimpleSolarSystem } from './SimpleSolarSystem.js';
import { ProbeSystem } from './ProbeSystem.js';
import { LightSpeedComm } from './LightSpeedComm.js';

export class SimpleScene {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Setup Three.js
        this.scene = new THREE.Scene();
        // Remove fog for brightness
        
        // Camera - zoomed way out to see Saturn's full orbit
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            50000  // Increased far plane to prevent disappearing
        );
        this.camera.position.set(1000, 1500, 2000);  // Further out to see Neptune at 3000
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight - 60);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add orbit controls for zoom/pan/rotate
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 20000;  // Increased max zoom out
        this.controls.minDistance = 50;
        
        // Lights - MAXIMUM brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Full white ambient
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 2, 5000); // Sun light
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
        
        // Systems
        this.solarSystem = new SimpleSolarSystem(this.scene);
        this.probeSystem = new ProbeSystem(this.scene);
        this.lightComm = new LightSpeedComm(this.scene);
        
        // Add stars
        this.addStars();
        
        // Council nodes
        this.councilNodes = [];
        
        // Animation state
        this.clock = new THREE.Clock();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    addStars() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < 10000; i++) {
            vertices.push(
                (Math.random() - 0.5) * 3000,
                (Math.random() - 0.5) * 3000,
                (Math.random() - 0.5) * 3000
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }
    
    launchProbe() {
        const earthPos = this.solarSystem.getEarthPosition();
        
        // Get Earth's orbital velocity
        const planets = this.solarSystem.getPlanets();
        const earth = planets.find(p => p.name === 'Earth');
        
        // Calculate probe velocity
        // Distance from Earth (100) to Mars (152) = 52 units
        // Should take 6 months = 182.5 days
        // Speed needed = 52 / 182.5 = 0.285 units per day
        // With new time scale (1.825 days/frame at 1x), need 0.285 * 1.825 = 0.52 units/frame
        const probeSpeed = 0.52; // calibrated for 6 months Earth to Mars
        
        // Get Earth's velocity direction (tangent to orbit)
        // Earth is moving perpendicular to its radius vector
        const earthRadius = earthPos.clone().normalize();
        const earthDirection = new THREE.Vector3(
            -earthRadius.z, // perpendicular in x
            0,
            earthRadius.x   // perpendicular in z
        ).normalize();
        
        // Launch mostly in Earth's direction with some outward component
        // 70% forward (Earth's direction), 30% outward
        const outwardDirection = earthRadius.clone();
        const launchDirection = earthDirection.multiplyScalar(0.7).add(outwardDirection.multiplyScalar(0.3)).normalize();
        
        // Add small random variation (±10 degrees)
        const angleVariation = (Math.random() - 0.5) * 0.17; // ±0.085 radians = ±10 degrees
        launchDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleVariation);
        
        const earthVelocity = launchDirection.multiplyScalar(probeSpeed);
        
        const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff00aa, 0x00ff00];  // Brighter colors
        const color = colors[Math.floor(Math.random() * colors.length)];
        return this.probeSystem.launchProbe(earthPos, `ELDER-${this.probeSystem.getProbeCount() + 1}`, color, earthVelocity);
    }
    
    addCouncilNode(planetName) {
        const position = this.solarSystem.getPlanetPosition(planetName);
        
        const geometry = new THREE.OctahedronGeometry(5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            wireframe: true
        });
        const node = new THREE.Mesh(geometry, material);
        node.position.copy(position);
        node.position.y += 15;
        
        this.scene.add(node);
        this.councilNodes.push({ mesh: node, planet: planetName });
        
        return node;
    }
    
    update(simulationSpeed = 1) {
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        this.controls.update();
        
        // Update systems
        this.solarSystem.update(deltaTime, simulationSpeed);
        this.probeSystem.update(deltaTime, simulationSpeed);
        // Always update light communication even when paused (for decision mode)
        // Use 1 to ensure pulse animates at normal speed regardless of simulation speed
        this.lightComm.update(1);
        
        // Update council nodes to follow their planets
        this.councilNodes.forEach(node => {
            const planetPos = this.solarSystem.getPlanetPosition(node.planet);
            node.mesh.position.copy(planetPos);
            node.mesh.position.y += 15;
            node.mesh.rotation.y += 0.01;
        });
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    triggerDecision() {
        // Get Earth position
        const earthPos = this.solarSystem.getEarthPosition();
        
        // Collect all targets (council nodes and probes)
        const targets = [];
        
        // Earth-MIND is always present (instant consensus with self)
        targets.push({
            position: earthPos.clone(),
            name: 'Earth-MIND',
            type: 'council'
        });
        
        // Add other council nodes
        this.councilNodes.forEach(node => {
            if (node.planet !== 'Earth') {
                targets.push({
                    position: node.mesh.position.clone(),
                    name: node.planet,
                    type: 'council'
                });
            }
        });
        
        // Add ALL probes for validation
        this.probeSystem.probes.forEach((probe, i) => {
            targets.push({
                position: probe.mesh.position.clone(),
                name: `Elder-${i + 1}`,
                type: 'probe'
            });
        });
        
        // Always send light-speed pulse, even with no targets
        return this.lightComm.broadcastDecision(earthPos, targets);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / (window.innerHeight - 60);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight - 60);
    }
    
    reset() {
        this.probeSystem.clear();
        this.councilNodes.forEach(node => {
            this.scene.remove(node.mesh);
        });
        this.councilNodes = [];
    }
}