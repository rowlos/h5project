import * as THREE from 'three';

// Speed of light: 299,792 km/s
// Our scale: Earth at 100 units = 1 AU = 150 million km
// So 1 unit = 1.5 million km
// Light travels 1 AU in 8.3 minutes = 499 seconds
// So in our scale, light travels 100 units in 499 seconds

export class LightSpeedComm {
    constructor(scene) {
        this.scene = scene;
        this.activeSignals = [];
        this.c = 100 / 499; // Speed of light in units per second (100 units = 1 AU = 499 seconds)
    }
    
    // Send an expanding circular pulse from Earth
    broadcastDecision(sourcePos, targets) {
        // Clear any existing pulses first
        this.activeSignals = this.activeSignals.filter(signal => {
            if (signal.type === 'pulse') {
                this.scene.remove(signal.mesh);
                signal.mesh.geometry.dispose();
                signal.mesh.material.dispose();
                return false;
            }
            return true;
        });
        
        // Always create expanding ring pulse
        console.log('Creating light pulse from:', sourcePos);
        const pulse = this.createExpandingPulse(sourcePos);
        this.activeSignals.push(pulse);
        console.log('Pulse created and added to activeSignals:', pulse);
        console.log('Total active signals:', this.activeSignals.length);
        return [pulse];
    }
    
    createExpandingPulse(center) {
        // Create a thin expanding ring like a wavefront
        const geometry = new THREE.RingGeometry(1, 6, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, // Make it glow
            depthWrite: false // Ensure it renders on top
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(center);
        ring.rotation.x = -Math.PI / 2; // Lay flat on orbital plane
        ring.renderOrder = 999; // Render on top of other objects
        
        this.scene.add(ring);
        console.log('Added pulse ring to scene at position:', center);
        
        return {
            mesh: ring,
            center: center.clone(),
            startTime: Date.now(),
            radius: 1, // Start at 1 to be visible immediately
            type: 'pulse',
            active: true
        };
    }
    
    createSignal(from, to, travelTime, type) {
        // Create a larger, brighter sphere to represent the light signal
        const geometry = new THREE.SphereGeometry(3, 16, 16);
        const color = type === 'outgoing' ? 0x00ffff : 0x00ff00;
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const signal = new THREE.Mesh(geometry, material);
        
        // Position at source
        signal.position.copy(from);
        
        // Add to scene
        this.scene.add(signal);
        
        // Create trail line
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        const trail = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(trail);
        
        const signalData = {
            mesh: signal,
            trail: trail,
            trailPoints: [],
            from: from.clone(),
            to: to.clone(),
            startTime: Date.now(),
            travelTime: travelTime * 1000, // Convert to milliseconds
            type: type,
            active: true
        };
        
        this.activeSignals.push(signalData);
        return signalData;
    }
    
    update(simulationSpeed = 1) {
        const now = Date.now();
        
        this.activeSignals = this.activeSignals.filter(signal => {
            if (!signal.active) return false;
            
            if (signal.type === 'pulse') {
                // Update expanding pulse
                const elapsed = (now - signal.startTime) / 1000; // seconds
                
                // Light travels at c in our units
                // 1 AU = 100 units = 499 seconds real time
                // At 300x speed: 499 seconds = 1.663 visual seconds
                // So light travels 100 units in 1.663 seconds = 60 units per second
                // Always animate at 300x speed regardless of simulation speed
                const lightSpeedVisual = 60; // units per visual second at 300x speed
                signal.radius = 1 + (elapsed * lightSpeedVisual); // Start at 1 for visibility
                
                // Update ring geometry - thin line for clean appearance
                const thickness = 5; // Thin ring like a wavefront
                const innerRadius = Math.max(1, signal.radius - thickness/2);
                const outerRadius = signal.radius + thickness/2;
                const newGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
                signal.mesh.geometry.dispose();
                signal.mesh.geometry = newGeometry;
                
                // Steady opacity with slow fade
                signal.mesh.material.opacity = Math.max(0.3, 1.0 - (signal.radius / 50000));
                
                // Don't remove until VERY far away or manually stopped
                // Neptune is at 3000 units, so go way beyond that
                if (signal.radius > 10000) {
                    this.scene.remove(signal.mesh);
                    signal.mesh.geometry.dispose();
                    signal.mesh.material.dispose();
                    return false;
                }
            } else {
                // Old signal code (for backwards compatibility)
                const elapsed = now - signal.startTime;
                const progress = Math.min(elapsed / signal.travelTime, 1.0);
                
                signal.mesh.position.lerpVectors(signal.from, signal.to, progress);
                
                if (signal.trailPoints) {
                    signal.trailPoints.push(signal.mesh.position.clone());
                    if (signal.trailPoints.length > 20) {
                        signal.trailPoints.shift();
                    }
                    if (signal.trailPoints.length > 1 && signal.trail) {
                        signal.trail.geometry.setFromPoints(signal.trailPoints);
                    }
                }
                
                if (progress >= 1.0) {
                    this.scene.remove(signal.mesh);
                    if (signal.trail) this.scene.remove(signal.trail);
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // Stop all active pulses (when exiting decision mode)
    stopAllPulses() {
        this.activeSignals = this.activeSignals.filter(signal => {
            if (signal.type === 'pulse') {
                this.scene.remove(signal.mesh);
                signal.mesh.geometry.dispose();
                signal.mesh.material.dispose();
                return false;
            }
            return true;
        });
    }
    
    // Calculate actual light delay in seconds
    calculateLightDelay(distance) {
        // distance is in our units where 100 = 1 AU
        // Light takes 499 seconds to travel 1 AU (100 units)
        return (distance / 100) * 499; // Convert to AU then to seconds
    }
    
    // Format delay for display (round-trip = 2x one-way)
    formatDelay(seconds) {
        const roundTrip = seconds * 2;
        if (roundTrip < 60) {
            return `${roundTrip.toFixed(0)}s`;
        } else if (roundTrip < 3600) {
            return `${(roundTrip / 60).toFixed(1)} min`;
        } else if (roundTrip < 86400) {
            return `${(roundTrip / 3600).toFixed(1)} hours`;
        } else if (roundTrip < 31536000) {
            return `${(roundTrip / 86400).toFixed(1)} days`;
        } else {
            return `${(roundTrip / 31536000).toFixed(1)} years`;
        }
    }
}