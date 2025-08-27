import { 
    PHASES, 
    PROBE_LAUNCH_INTERVAL,
    PROBE_LAUNCH_END_YEAR,
    TRAJECTORY_TYPES,
    COUNCIL_DEPLOYMENTS,
    DAYS_PER_YEAR,
    calculateLightDelay,
    formatTime,
    PLANETS
} from './constants.js';

export class Simulation {
    constructor(scene, ui) {
        this.scene = scene;
        this.ui = ui;
        
        // Simulation state
        this.time = 0; // in days
        this.speed = 1; // time multiplier
        this.running = false;
        this.currentPhase = 0;
        
        // Tracking
        this.lastProbeTime = 0;
        this.probeCount = 0;
        this.deployedCouncil = new Set();
        this.timeline = [];
        this.elders = [];
        this.council = [];
        
        // Animation
        this.lastFrameTime = Date.now();
    }
    
    start() {
        this.running = true;
        this.animate();
        this.addTimelineEvent('ChronoMesh mission initialized', 'milestone');
    }
    
    pause() {
        this.running = false;
    }
    
    reset() {
        this.time = 0;
        this.currentPhase = 0;
        this.lastProbeTime = 0;
        this.probeCount = 0;
        this.deployedCouncil.clear();
        this.timeline = [];
        this.elders = [];
        this.council = [];
        
        // Clear scene objects
        this.scene.probes.forEach(probe => {
            this.scene.scene.remove(probe.mesh);
            this.scene.scene.remove(probe.trail);
        });
        this.scene.probes = [];
        
        this.scene.councilNodes.forEach(node => {
            if (node.mesh.parent) {
                node.mesh.parent.remove(node.mesh);
            }
        });
        this.scene.councilNodes = [];
        
        this.updateUI();
        this.addTimelineEvent('Mission reset', 'milestone');
    }
    
    setSpeed(speedIndex) {
        const speeds = [0, 1, 10, 100, 1000];
        this.speed = speeds[speedIndex];
        document.getElementById('speed-display').textContent = 
            this.speed === 0 ? 'Paused' : `${this.speed}x`;
    }
    
    animate() {
        if (!this.running) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        
        // Update simulation time (1 real second = speed days)
        this.time += this.speed * deltaTime; // Normal time progression
        
        // Check for phase changes
        this.updatePhase();
        
        // Check for scheduled events
        this.checkScheduledEvents();
        
        // Update scene
        this.scene.update(this.time);
        
        // Update UI
        this.updateUI();
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
    
    updatePhase() {
        const year = this.time / DAYS_PER_YEAR;
        let newPhase = 0;
        
        for (let i = 0; i < PHASES.length; i++) {
            if (year >= PHASES[i].startYear && year < PHASES[i].endYear) {
                newPhase = i;
                break;
            }
        }
        
        if (newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            document.getElementById('phase-name').textContent = PHASES[newPhase].name;
            this.addTimelineEvent(`Entering phase: ${PHASES[newPhase].name}`, 'milestone');
        }
    }
    
    checkScheduledEvents() {
        const year = this.time / DAYS_PER_YEAR;
        
        // Continuous probe launches during first 10 years
        if (year < PROBE_LAUNCH_END_YEAR && year - this.lastProbeTime >= PROBE_LAUNCH_INTERVAL) {
            this.launchNewProbe();
            this.lastProbeTime = year;
        }
        
        // Check for council deployments
        COUNCIL_DEPLOYMENTS.forEach(deployment => {
            if (year >= deployment.year && !this.deployedCouncil.has(deployment.name)) {
                this.deployCouncil(deployment);
            }
        });
    }
    
    launchNewProbe() {
        this.probeCount++;
        
        // Select random trajectory type
        const trajectory = TRAJECTORY_TYPES[Math.floor(Math.random() * TRAJECTORY_TYPES.length)];
        
        const launch = {
            name: `ELDER-${this.probeCount}`,
            trajectory: trajectory.type,
            speed: trajectory.speed,
            color: trajectory.color
        };
        
        this.launchProbe(launch);
    }
    
    launchProbe(launch) {
        
        // Add to scene
        const probe = this.scene.addProbe(launch);
        
        // Add to tracking
        this.elders.push({
            name: launch.name,
            trajectory: launch.trajectory,
            launchYear: this.time / DAYS_PER_YEAR,
            probe: probe
        });
        
        // Update UI
        this.addTimelineEvent(`${launch.name} launched (${launch.trajectory})`, 'elder');
        this.updateEldersList();
    }
    
    deployCouncil(deployment) {
        this.deployedCouncil.add(deployment.name);
        
        // Add to scene
        const node = this.scene.addCouncilNode(deployment.location);
        
        // Add to tracking
        this.council.push({
            name: deployment.name,
            location: deployment.location,
            deployYear: this.time / DAYS_PER_YEAR,
            node: node
        });
        
        // Update UI
        this.addTimelineEvent(`${deployment.name} deployed to ${deployment.location}`, 'council');
        this.updateCouncilList();
        
        // Enable decision button after first council member
        if (this.council.length === 1) {
            document.getElementById('btn-decision').disabled = false;
        }
    }
    
    triggerDecision() {
        if (this.council.length === 0) return;
        
        // Show decision modal
        const modal = document.getElementById('decision-modal');
        modal.classList.add('active');
        
        // Create light-speed communication visualization
        const earthPos = this.scene.planetMeshes.get('Earth').mesh.position;
        
        this.council.forEach(member => {
            const planet = this.scene.planetMeshes.get(member.location);
            if (!planet) return;
            
            const distance = earthPos.distanceTo(planet.mesh.position) / 80; // Unscale (updated scale)
            const delay = calculateLightDelay(distance);
            
            // Create visual ring
            this.scene.createLightSpeedRing(earthPos, planet.mesh.position, delay);
        });
        
        // Simulate decision process
        this.simulateDecision();
    }
    
    simulateDecision() {
        const viz = document.getElementById('decision-visualization');
        let html = '<div class="decision-steps">';
        
        // Calculate delays
        const delays = {};
        this.council.forEach(member => {
            const planetData = PLANETS.find(p => p.name === member.location);
            if (planetData) {
                delays[member.name] = calculateLightDelay(planetData.semiMajorAxis);
            }
        });
        
        // Show transmission
        html += '<div class="decision-step">';
        html += '<h4>1. Broadcasting Decision Request</h4>';
        html += '<ul>';
        
        Object.entries(delays).forEach(([name, delay]) => {
            html += `<li>${name}: Signal arrives in ${formatTime(delay)}</li>`;
        });
        
        html += '</ul></div>';
        
        // Show responses
        html += '<div class="decision-step">';
        html += '<h4>2. Council Responses</h4>';
        html += '<ul>';
        
        this.council.forEach(member => {
            const vote = Math.random() > 0.3 ? 'APPROVE' : 'DENY';
            const color = vote === 'APPROVE' ? '#00ff88' : '#ff4444';
            html += `<li style="color: ${color}">${member.name}: ${vote}</li>`;
        });
        
        html += '</ul></div>';
        
        // Show elder votes (much delayed)
        if (this.elders.length > 0) {
            html += '<div class="decision-step">';
            html += '<h4>3. Elder Probe Verdicts (Years Later)</h4>';
            html += '<ul>';
            
            this.elders.slice(0, 3).forEach(elder => {
                const yearsAway = (this.time / DAYS_PER_YEAR) - elder.launchYear;
                const distance = yearsAway * 0.1; // Approximate distance in AU
                const delay = calculateLightDelay(distance);
                
                const vote = Math.random() > 0.5 ? 'APPROVE' : 'DENY';
                const color = vote === 'APPROVE' ? '#00ff88' : '#ff4444';
                html += `<li style="color: ${color}">${elder.name}: ${vote} (${formatTime(delay)} delay)</li>`;
            });
            
            html += '</ul></div>';
        }
        
        html += '</div>';
        viz.innerHTML = html;
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            document.getElementById('decision-modal').classList.remove('active');
        }, 10000);
    }
    
    addTimelineEvent(text, type) {
        const event = {
            time: this.time,
            year: this.time / DAYS_PER_YEAR,
            text: text,
            type: type
        };
        
        this.timeline.unshift(event);
        if (this.timeline.length > 20) {
            this.timeline.pop();
        }
        
        this.updateTimeline();
    }
    
    updateTimeline() {
        const container = document.getElementById('timeline-events');
        container.innerHTML = '';
        
        this.timeline.forEach(event => {
            const div = document.createElement('div');
            div.className = `timeline-event ${event.type}`;
            div.innerHTML = `
                <div style="font-size: 0.75rem; color: #8892b0">
                    Year ${event.year.toFixed(1)}
                </div>
                <div>${event.text}</div>
            `;
            container.appendChild(div);
        });
    }
    
    updateEldersList() {
        const container = document.getElementById('elder-list');
        
        if (this.elders.length === 0) {
            container.innerHTML = '<p class="placeholder">No probes launched yet</p>';
            return;
        }
        
        container.innerHTML = '';
        this.elders.forEach(elder => {
            const div = document.createElement('div');
            div.className = 'elder-item';
            
            const yearsAway = (this.time / DAYS_PER_YEAR) - elder.launchYear;
            const distance = yearsAway * 0.1; // Approximate
            const delay = calculateLightDelay(distance);
            
            div.innerHTML = `
                <strong>${elder.name}</strong><br>
                <small>Trajectory: ${elder.trajectory}</small><br>
                <small>Light delay: ${formatTime(delay)}</small>
            `;
            container.appendChild(div);
        });
    }
    
    updateCouncilList() {
        const container = document.getElementById('council-list');
        
        if (this.council.length === 0) {
            container.innerHTML = '<p class="placeholder">Council not yet established</p>';
            return;
        }
        
        container.innerHTML = '';
        this.council.forEach(member => {
            const div = document.createElement('div');
            div.className = 'council-item';
            
            const planetData = PLANETS.find(p => p.name === member.location);
            const delay = planetData ? calculateLightDelay(planetData.semiMajorAxis) : 0;
            
            div.innerHTML = `
                <strong>${member.name}</strong><br>
                <small>Location: ${member.location}</small><br>
                <small>Light delay: ${formatTime(delay)}</small>
            `;
            container.appendChild(div);
        });
    }
    
    updateUI() {
        const year = this.time / DAYS_PER_YEAR;
        const day = Math.floor(this.time % DAYS_PER_YEAR);
        
        document.getElementById('year').textContent = year.toFixed(1);
        document.getElementById('day').textContent = day;
    }
}