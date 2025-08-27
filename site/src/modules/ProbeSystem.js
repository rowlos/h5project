import * as THREE from 'three';

export class ProbeSystem {
    constructor(scene) {
        this.scene = scene;
        this.probes = [];
    }
    
    launchProbe(fromPosition, name = 'ELDER', color = 0xff00ff, earthVelocity = null) {
        // Create probe mesh (much bigger and brighter for visibility)
        const geometry = new THREE.ConeGeometry(8, 20, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: color
        });
        const probe = new THREE.Mesh(geometry, material);
        
        // Position at Earth's exact current position
        probe.position.copy(fromPosition);
        
        // Use provided velocity with small boost for escape
        let velocity;
        if (earthVelocity) {
            velocity = earthVelocity.clone();
            // Add 10-30% boost for escape trajectory
            const boost = 1.1 + Math.random() * 0.2;
            velocity.multiplyScalar(boost);
        } else {
            // Fallback
            velocity = new THREE.Vector3(0.003, 0, 0);
        }
        
        // Create trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        
        this.scene.add(probe);
        this.scene.add(trail);
        
        this.probes.push({
            mesh: probe,
            trail: trail,
            trailPoints: [],
            velocity: velocity,
            name: name,
            launchTime: Date.now()
        });
        
        return probe;
    }
    
    update(deltaTime, simulationSpeed = 1) {
        this.probes.forEach(probe => {
            // Update position - scale velocity by simulation speed
            const scaledVelocity = probe.velocity.clone().multiplyScalar(simulationSpeed);
            probe.mesh.position.add(scaledVelocity);
            
            // Add to trail
            probe.trailPoints.push(probe.mesh.position.clone());
            if (probe.trailPoints.length > 150) {
                probe.trailPoints.shift();
            }
            
            // Update trail
            if (probe.trailPoints.length > 1) {
                probe.trail.geometry.setFromPoints(probe.trailPoints);
            }
            
            // Point in direction of travel
            const nextPos = probe.mesh.position.clone().add(probe.velocity);
            probe.mesh.lookAt(nextPos);
            
            // Slow rotation
            probe.mesh.rotation.z += 0.01;
        });
    }
    
    getProbeCount() {
        return this.probes.length;
    }
    
    clear() {
        this.probes.forEach(probe => {
            this.scene.remove(probe.mesh);
            this.scene.remove(probe.trail);
        });
        this.probes = [];
    }
}