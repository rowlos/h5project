import * as THREE from 'three';
import { PLANETS } from './constants.js';

export class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight - 60; // Account for nav bar
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000814, 500, 3000);  // Extended fog range
        
        // Camera setup - zoomed out to see full solar system
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.width / this.height,
            0.1,
            5000
        );
        this.camera.position.set(0, 400, 600);  // Much further back
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Lights
        this.setupLights();
        
        // Solar system objects
        this.sun = null;
        this.planets = [];
        this.planetMeshes = new Map();
        this.probes = [];
        this.councilNodes = [];
        
        // Visual elements
        this.orbits = [];
        this.lightRings = [];
        
        // Setup solar system
        this.createSolarSystem();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Sun light (point light)
        this.sunLight = new THREE.PointLight(0xffffff, 2, 500);
        this.sunLight.position.set(0, 0, 0);
        this.scene.add(this.sunLight);
        
        // Directional light for overall illumination
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);
    }
    
    createSolarSystem() {
        // Create sun
        const sunGeometry = new THREE.SphereGeometry(12, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 1
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);
        
        // Add sun glow
        const glowGeometry = new THREE.SphereGeometry(18, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.3
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(sunGlow);
        
        // Create planets and orbits
        PLANETS.forEach((planetData, index) => {
            // Skip planets beyond Saturn for cleaner visualization
            if (index > 5) return;
            
            // Create orbit line
            const orbitRadius = planetData.semiMajorAxis * 80; // Larger scale for better visualization
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitPoints = [];
            
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(
                    Math.cos(angle) * orbitRadius,
                    0,
                    Math.sin(angle) * orbitRadius
                ));
            }
            
            orbitGeometry.setFromPoints(orbitPoints);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x404040,
                transparent: true,
                opacity: 0.3
            });
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            this.scene.add(orbit);
            this.orbits.push(orbit);
            
            // Create planet - not to scale, but visible!
            let planetSize = 4; // Base size
            if (planetData.name === 'Jupiter') planetSize = 10;
            else if (planetData.name === 'Saturn') planetSize = 8;
            else if (planetData.name === 'Earth') planetSize = 5;
            else if (planetData.name === 'Mars') planetSize = 4;
            else if (planetData.name === 'Venus') planetSize = 5;
            else if (planetData.name === 'Mercury') planetSize = 3;
            
            const planetGeometry = new THREE.SphereGeometry(
                planetSize,
                32,
                32
            );
            const planetMaterial = new THREE.MeshPhongMaterial({
                color: planetData.color,
                emissive: planetData.color,
                emissiveIntensity: 0.2
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Create container for planet (for orbital rotation)
            const planetContainer = new THREE.Object3D();
            planetContainer.add(planet);
            planet.position.x = orbitRadius;
            
            this.scene.add(planetContainer);
            this.planetMeshes.set(planetData.name, {
                container: planetContainer,
                mesh: planet,
                data: planetData,
                orbitRadius: orbitRadius,
                angle: Math.random() * Math.PI * 2 // Random starting position
            });
        });
        
        // Add starfield
        this.createStarfield();
    }
    
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const starsVertices = [];
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    addProbe(probeData) {
        const probeGeometry = new THREE.ConeGeometry(1, 3, 4);  // Bigger probes
        const probeColor = probeData.color || '#ff00ff';
        const probeMaterial = new THREE.MeshBasicMaterial({
            color: probeColor,
            emissive: probeColor,
            emissiveIntensity: 1
        });
        const probe = new THREE.Mesh(probeGeometry, probeMaterial);
        
        // Start from Earth's current position
        const earth = this.planetMeshes.get('Earth');
        let earthPosition = new THREE.Vector3(0, 0, 0);
        let earthVelocity = new THREE.Vector3(0, 0, 0);
        
        if (earth) {
            earthPosition.copy(earth.mesh.position);
            probe.position.copy(earthPosition);
            
            // Calculate Earth's orbital velocity (for realistic probe launch)
            const earthAngle = Math.atan2(earth.mesh.position.z, earth.mesh.position.x);
            const earthSpeed = (2 * Math.PI * earth.orbitRadius) / (earth.data.period * 10); // Orbital speed
            earthVelocity.x = -Math.sin(earthAngle) * earthSpeed;
            earthVelocity.z = Math.cos(earthAngle) * earthSpeed;
        }
        
        // Add trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: probeColor,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        
        this.scene.add(probe);
        this.scene.add(trail);
        
        // Create escape velocity - combine Earth's orbital velocity with probe's escape velocity
        const escapeDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        // Probe velocity = Earth's orbital velocity + escape velocity
        const escapeVelocity = escapeDirection.multiplyScalar(probeData.speed * 0.01);
        const totalVelocity = earthVelocity.clone().multiplyScalar(0.001).add(escapeVelocity);
        
        this.probes.push({
            mesh: probe,
            trail: trail,
            trailPoints: [],
            data: probeData,
            velocity: totalVelocity,
            position: probe.position.clone() // Track position independently
        });
        
        return probe;
    }
    
    addCouncilNode(location) {
        const planet = this.planetMeshes.get(location);
        if (!planet) return;
        
        // Create council node marker
        const nodeGeometry = new THREE.OctahedronGeometry(4);  // Bigger node
        const nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            wireframe: true
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        
        // Position relative to planet
        planet.mesh.add(node);
        node.position.y = 10;  // Further from planet
        
        // Add pulsing ring
        const ringGeometry = new THREE.RingGeometry(6, 8, 32);  // Bigger ring
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        node.add(ring);
        
        this.councilNodes.push({
            mesh: node,
            ring: ring,
            location: location
        });
        
        return node;
    }
    
    createLightSpeedRing(fromPosition, toPosition, delay) {
        // Create expanding ring to show light-speed communication
        const distance = fromPosition.distanceTo(toPosition);
        const ringGeometry = new THREE.RingGeometry(0.1, 1, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        ring.position.copy(fromPosition);
        ring.lookAt(toPosition);
        
        this.scene.add(ring);
        this.lightRings.push({
            mesh: ring,
            startTime: Date.now(),
            duration: delay * 1000,
            startPos: fromPosition.clone(),
            endPos: toPosition.clone(),
            maxScale: distance / 10
        });
        
        return ring;
    }
    
    update(simulationTime) {
        // Update planet positions
        this.planetMeshes.forEach((planet, name) => {
            const period = planet.data.period;
            const angle = (simulationTime / period) * Math.PI * 2;
            
            planet.mesh.position.x = Math.cos(angle) * planet.orbitRadius;
            planet.mesh.position.z = Math.sin(angle) * planet.orbitRadius;
            
            // Rotate planet on its axis
            planet.mesh.rotation.y += 0.01;
        });
        
        // Update probes
        this.probes.forEach(probe => {
            // Update position using velocity
            probe.position.add(probe.velocity);
            probe.mesh.position.copy(probe.position);
            
            // Add to trail
            probe.trailPoints.push(probe.position.clone());
            if (probe.trailPoints.length > 100) { // Longer trails
                probe.trailPoints.shift();
            }
            
            // Update trail geometry
            if (probe.trailPoints.length > 1) {
                probe.trail.geometry.setFromPoints(probe.trailPoints);
            }
            
            // Rotate probe
            probe.mesh.rotation.x += 0.02;
            probe.mesh.rotation.z += 0.01;
            
            // Point probe in direction of travel
            const direction = probe.velocity.clone().normalize();
            probe.mesh.lookAt(probe.position.clone().add(direction));
        });
        
        // Update council node animations
        this.councilNodes.forEach(node => {
            node.mesh.rotation.y += 0.01;
            node.ring.rotation.z += 0.02;
            
            // Pulsing effect
            const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 1;
            node.ring.scale.set(pulse, pulse, 1);
        });
        
        // Update light-speed rings
        const now = Date.now();
        this.lightRings = this.lightRings.filter(ring => {
            const elapsed = now - ring.startTime;
            const progress = Math.min(elapsed / ring.duration, 1);
            
            if (progress >= 1) {
                this.scene.remove(ring.mesh);
                return false;
            }
            
            // Expand ring
            const scale = progress * ring.maxScale;
            ring.mesh.scale.set(scale, scale, 1);
            
            // Fade out
            ring.mesh.material.opacity = 0.8 * (1 - progress);
            
            // Move along path
            ring.mesh.position.lerpVectors(ring.startPos, ring.endPos, progress);
            
            return true;
        });
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight - 60;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
}