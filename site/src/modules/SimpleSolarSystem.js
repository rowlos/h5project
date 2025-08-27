import * as THREE from 'three';

// Simple but effective solar system visualization
export class SimpleSolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.time = 0;
        
        this.createSolarSystem();
    }
    
    getPlanets() {
        return this.planets;
    }
    
    createSolarSystem() {
        // Sun - bright yellow
        const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(sun);
        
        // Planet data - more accurate relative distances (Earth = 100)
        const planetData = [
            { name: 'Mercury', distance: 39, size: 6, color: 0xffffff, speed: 4 },
            { name: 'Venus', distance: 72, size: 10, color: 0xffff00, speed: 3 },
            { name: 'Earth', distance: 100, size: 10, color: 0x00aaff, speed: 2 },
            { name: 'Mars', distance: 152, size: 8, color: 0xff3333, speed: 1.5 },
            { name: 'Jupiter', distance: 520, size: 25, color: 0xffaa00, speed: 0.8 },  // 5.2x Earth
            { name: 'Saturn', distance: 950, size: 20, color: 0xffff66, speed: 0.5 },  // 9.5x Earth
            { name: 'Uranus', distance: 1920, size: 15, color: 0x66ffff, speed: 0.3 }, // 19.2x Earth
            { name: 'Neptune', distance: 3000, size: 15, color: 0x4444ff, speed: 0.2 } // 30x Earth
        ];
        
        planetData.forEach(data => {
            // Create orbit
            const orbitGeometry = new THREE.RingGeometry(data.distance - 1, data.distance + 1, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x666666, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = -Math.PI / 2;
            this.scene.add(orbit);
            
            // Add text label using Sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.font = '32px Arial';
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.textAlign = 'center';
            context.fillText(data.name, 128, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(data.distance, 20, 0);
            sprite.scale.set(40, 10, 1);
            this.scene.add(sprite);
            
            // Create planet
            const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
            const planetMaterial = new THREE.MeshBasicMaterial({ 
                color: data.color
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            this.planets.push({
                mesh: planet,
                distance: data.distance,
                speed: data.speed,
                name: data.name,
                angle: Math.random() * Math.PI * 2
            });
            
            this.scene.add(planet);
        });
    }
    
    update(deltaTime, simulationSpeed = 1) {
        this.time += deltaTime;
        
        // Update planet positions
        // Earth should complete one orbit per year (365 days)
        // With new base speed: 1.825 days per frame at 1x speed (1 year = 20 seconds)
        const daysPerFrame = simulationSpeed * 1.825;
        
        this.planets.forEach(planet => {
            // Calculate orbital period relative to Earth (Earth = 1 year)
            let orbitalPeriod = 1;
            switch(planet.name) {
                case 'Mercury': orbitalPeriod = 0.24; break;
                case 'Venus': orbitalPeriod = 0.62; break;
                case 'Earth': orbitalPeriod = 1.0; break;
                case 'Mars': orbitalPeriod = 1.88; break;
                case 'Jupiter': orbitalPeriod = 11.86; break;
                case 'Saturn': orbitalPeriod = 29.46; break;
                case 'Uranus': orbitalPeriod = 84; break;
                case 'Neptune': orbitalPeriod = 165; break;
            }
            
            // Angle change per frame
            const angleChange = (2 * Math.PI / (365 * orbitalPeriod)) * daysPerFrame;
            planet.angle += angleChange;
            
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            planet.mesh.rotation.y += 0.01;
        });
    }
    
    getEarthPosition() {
        const earth = this.planets.find(p => p.name === 'Earth');
        if (earth) {
            // Return Earth's actual current position
            return new THREE.Vector3(
                Math.cos(earth.angle) * earth.distance,
                0,
                Math.sin(earth.angle) * earth.distance
            );
        }
        return new THREE.Vector3(100, 0, 0);
    }
    
    getPlanetPosition(name) {
        // Special case for Moon - it's close to Earth
        if (name === 'Moon') {
            const earth = this.planets.find(p => p.name === 'Earth');
            if (earth) {
                // Moon is about 2.5 units from Earth (to scale)
                const moonAngle = this.time * 3; // Moon orbits faster
                return new THREE.Vector3(
                    Math.cos(earth.angle) * earth.distance + Math.cos(moonAngle) * 2.5,
                    0,
                    Math.sin(earth.angle) * earth.distance + Math.sin(moonAngle) * 2.5
                );
            }
        }
        
        const planet = this.planets.find(p => p.name === name);
        if (planet) {
            // Return planet's actual current position
            return new THREE.Vector3(
                Math.cos(planet.angle) * planet.distance,
                0,
                Math.sin(planet.angle) * planet.distance
            );
        }
        return new THREE.Vector3(0, 0, 0);
    }
}