import './style.css';
import { SimpleScene } from './modules/SimpleScene.js';

// State
let scene;
let simulationTime = 0;
let simulationSpeed = 1;
let isRunning = false;
let lastProbeTime = 0;
let nextProbeTime = 0.3 + Math.random() * 0.4; // Random time for first probe (0.3-0.7 years)
let probeCount = 0;
let councilDeployed = false;
let decisionActive = false; // Track if decision mode is active

// Elder Fleet names - each carrying a civilizational principle
const elderNames = [
    'Tjukurrpa',  // Australian Aboriginal - Dreamtime
    'Ma\'at',     // Egyptian - Truth/Balance
    'Ananke',     // Greek - Inevitability
    'Dao',        // Chinese - The Way
    'Urd',        // Norse - Memory of the Past
    'Dharma',     // Hindu/Buddhist - Cosmic Order
    'Ubuntu',     // African - Humanity/Togetherness
    'Logos',      // Greek - Reason/Word
    'Tikkun',     // Hebrew - Repair/Healing
    'Wyrd',       // Anglo-Saxon - Fate/Becoming
    'Ahimsa',     // Sanskrit - Non-violence
    'Mana'        // Polynesian - Spiritual Power
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2000);
    
    // Create scene
    const canvas = document.getElementById('canvas');
    scene = new SimpleScene(canvas);
    console.log('Scene created:', scene);
    
    // Setup controls
    setupControls();
    setupModals();
    
    // Start animation loop
    animate();
});

function animate() {
    requestAnimationFrame(animate);
    
    if (isRunning) {
        // Update simulation time
        // Base speed: 1 year = 20 seconds, so 18.25 days per second
        simulationTime += simulationSpeed * 1.825;
        const years = simulationTime / 365;
        
        // Update display
        document.getElementById('year').textContent = years.toFixed(1);
        document.getElementById('day').textContent = Math.floor(simulationTime % 365);
        
        // Launch probes with randomized timing around every 6 months
        if (probeCount < 100 && years >= nextProbeTime) {
            scene.launchProbe();
            const elderName = elderNames[probeCount % elderNames.length];
            probeCount++;
            lastProbeTime = years;
            
            // Schedule next probe: 6 months ± 2 months (4-8 months)
            nextProbeTime = years + 0.33 + Math.random() * 0.33;
            
            addTimelineEvent(`Elder ${elderName} launched`, 'elder');
            updateEldersList(elderName);
            
            // Update phase name based on progress
            if (years < 5) {
                document.getElementById('phase-name').textContent = 'Phase 1: Launching Elder Fleet';
            }
        }
        
        // Phase 2: Deploy council starting at year 5 with realistic intervals
        if (years >= 5 && !councilDeployed) {
            // Deploy nodes at specific years
            if (years >= 5.0 && !scene.councilNodes.find(n => n.planet === 'Moon')) {
                scene.addCouncilNode('Moon');
                addTimelineEvent('LUNAR-MIND deployed', 'council');
                updateCouncilList('Moon');
            }
            if (years >= 5.5 && !scene.councilNodes.find(n => n.planet === 'Mars')) {
                scene.addCouncilNode('Mars');
                addTimelineEvent('MARS-MIND deployed', 'council');
                updateCouncilList('Mars');
            }
            if (years >= 6.5 && !scene.councilNodes.find(n => n.planet === 'Jupiter')) {
                scene.addCouncilNode('Jupiter');
                addTimelineEvent('JUPITER-MIND deployed', 'council');
                updateCouncilList('Jupiter');
            }
            if (years >= 8.0 && !scene.councilNodes.find(n => n.planet === 'Saturn')) {
                scene.addCouncilNode('Saturn');
                addTimelineEvent('SATURN-MIND deployed', 'council');
                updateCouncilList('Saturn');
                councilDeployed = true; // Mark as fully deployed
            }
            
            document.getElementById('phase-name').textContent = 'Phase 2: Solar Five Deployment';
        }
        
        // Phase 3: System operational
        if (years >= 10) {
            document.getElementById('phase-name').textContent = 'Phase 3: H5 Project Active';
        }
        
        // Enable decision button once we have any probes or council
        if ((probeCount > 0 || councilDeployed) && document.getElementById('btn-decision').disabled) {
            document.getElementById('btn-decision').disabled = false;
        }
    }
    
    // Update scene - ALWAYS update even when paused for decision mode
    scene.update(simulationSpeed);
}

// Council deployment is now handled inline in the animation loop

function setupControls() {
    console.log('Setting up controls...');
    
    // Play button
    const playBtn = document.getElementById('btn-play');
    playBtn.addEventListener('click', () => {
        isRunning = !isRunning;
        playBtn.textContent = isRunning ? 'Pause' : 'Resume';
    });
    
    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        simulationTime = 0;
        lastProbeTime = 0;
        nextProbeTime = 0.3 + Math.random() * 0.4;
        probeCount = 0;
        councilDeployed = false;
        isRunning = false;
        decisionActive = false;
        scene.reset();
        
        document.getElementById('btn-play').textContent = 'Start Simulation';
        document.getElementById('btn-decision').disabled = true;
        document.getElementById('speed-slider').disabled = false;
        document.getElementById('elder-list').innerHTML = '<p class="placeholder">No probes launched yet</p>';
        document.getElementById('council-list').innerHTML = '<p class="placeholder">Council not yet established</p>';
        document.getElementById('timeline-events').innerHTML = '';
        document.getElementById('phase-name').textContent = 'Initialization';
    });
    
    // Speed control
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        if (!decisionActive) { // Only allow speed changes when not in decision mode
            const speeds = [0.1, 0.5, 1, 2, 5, 10];
            simulationSpeed = speeds[parseInt(e.target.value)];
            document.getElementById('speed-display').textContent = `${simulationSpeed}x`;
        }
    });
    
    // Decision button
    const decisionBtn = document.getElementById('btn-decision');
    console.log('Decision button element:', decisionBtn);
    if (decisionBtn) {
        // Remove any existing handlers
        decisionBtn.onclick = null;
        decisionBtn.removeEventListener('click', window.handleDecision);
        
        // Create handler
        window.handleDecision = function(e) {
            // Decision button clicked
            
            // Simple inline version
            if (!scene) {
                alert('Scene not ready!');
                return;
            }
            
            // STOP simulation completely
            const currentSpeed = simulationSpeed;
            simulationSpeed = 0;
            decisionActive = true;
            document.getElementById('speed-display').textContent = 'PAUSED (Decision Mode)';
            document.getElementById('speed-slider').disabled = true;
            
            // Trigger the light pulse - this should always create a pulse
            try {
                scene.triggerDecision();
            } catch (error) {
                alert('Error triggering decision: ' + error.message);
            }
            
            // Create decision panel with exit button
            let panel = document.getElementById('decision-panel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'decision-panel';
                panel.className = 'decision-panel';
                panel.innerHTML = `
                    <h3>Light-Speed Decision</h3>
                    <p style="color: #00ffff">Broadcasting at 300x light speed...</p>
                    <div id="consensus-view" style="margin: 10px 0; padding: 10px; background: rgba(0,255,255,0.1); border-radius: 4px;">
                        <div style="margin-bottom: 5px;"><strong>Council Consensus:</strong> <span id="council-votes">0 APPROVE / 0 DENY</span></div>
                        <div><strong>Elder Consensus:</strong> <span id="elder-votes">0 APPROVE / 0 DENY</span></div>
                    </div>
                    <div id="response-list" style="margin-top: 10px; font-size: 0.9em; max-height: 250px; overflow-y: auto; padding-right: 5px;"></div>
                    <button onclick="window.exitDecisionMode()" style="margin-top: 15px; padding: 5px 10px; background: #ff4444; border: none; color: white; cursor: pointer; border-radius: 4px;">Exit Decision Mode</button>
                `;
                document.querySelector('.main-container').appendChild(panel);
            }
            panel.style.display = 'block';
            
            // Calculate and display response times
            const earthPos = scene.solarSystem.getEarthPosition();
            const responses = [];
            
            // Earth-MIND always exists (instant response)
            responses.push({
                name: 'Earth-MIND',
                distance: 0,
                oneWay: 0,
                roundTrip: 0,
                type: 'council'
            });
            
            // Collect other council nodes
            if (scene.councilNodes.length > 0) {
                scene.councilNodes.forEach(node => {
                    const distance = earthPos.distanceTo(node.mesh.position);
                    const oneWaySeconds = scene.lightComm.calculateLightDelay(distance);
                    const roundTripSeconds = oneWaySeconds * 2;
                    const displayName = node.planet === 'Moon' ? 'LUNAR-MIND' : `${node.planet.toUpperCase()}-MIND`;
                    responses.push({
                        name: displayName,
                        distance: distance,
                        oneWay: oneWaySeconds,
                        roundTrip: roundTripSeconds,
                        type: 'council'
                    });
                });
            }
            
            if (scene.probeSystem.probes.length > 0) {
                scene.probeSystem.probes.forEach((probe, i) => {
                    const distance = earthPos.distanceTo(probe.mesh.position);
                    const oneWaySeconds = scene.lightComm.calculateLightDelay(distance);
                    const roundTripSeconds = oneWaySeconds * 2;
                    responses.push({
                        name: `Elder-${i + 1}`,
                        distance: distance,
                        oneWay: oneWaySeconds,
                        roundTrip: roundTripSeconds,
                        type: 'probe'
                    });
                });
            }
            
            // Sort by round-trip time
            responses.sort((a, b) => a.roundTrip - b.roundTrip);
            
            // Display initial list
            const responseList = document.getElementById('response-list');
            let html = '<strong>Awaiting responses (300x speed):</strong><br>';
            responses.forEach(r => {
                const color = r.type === 'council' ? '#00ff88' : '#ff00ff';
                const rtFormatted = scene.lightComm.formatDelay(r.oneWay);
                html += `<div id="resp-${r.name.replace(/\s/g, '-')}" style="color: #666; margin: 2px 0;">
                    ⏳ ${r.name}: ${rtFormatted} RTT
                </div>`;
            });
            responseList.innerHTML = html;
            
            // Track votes
            let councilApprove = 0, councilDeny = 0;
            let elderApprove = 0, elderDeny = 0;
            
            // Schedule responses at 300x speed (1 real second = 300 seconds of light travel)
            responses.forEach(r => {
                const visualDelayMs = (r.roundTrip / 300) * 1000; // Divide by 300 for 300x speed
                setTimeout(() => {
                    const elem = document.getElementById(`resp-${r.name.replace(/\s/g, '-')}`);
                    if (elem && decisionActive) {
                        const color = r.type === 'council' ? '#00ff88' : '#ff00ff';
                        let vote;
                        let isApprove;
                        
                        if (r.type === 'probe') {
                            // Elders ACK and then vote
                            isApprove = Math.random() > 0.2;
                            const elderVote = isApprove ? 'APPROVE' : 'DENY';
                            vote = `ACK + ${elderVote}`;
                            // Update elder consensus
                            if (isApprove) elderApprove++;
                            else elderDeny++;
                            document.getElementById('elder-votes').textContent = 
                                `${elderApprove} APPROVE / ${elderDeny} DENY`;
                        } else {
                            // Council just votes
                            isApprove = Math.random() > 0.3;
                            vote = isApprove ? 'APPROVE' : 'DENY';
                            // Update council consensus
                            if (isApprove) councilApprove++;
                            else councilDeny++;
                            document.getElementById('council-votes').textContent = 
                                `${councilApprove} APPROVE / ${councilDeny} DENY`;
                        }
                        
                        const rtFormatted = scene.lightComm.formatDelay(r.oneWay);
                        elem.innerHTML = `✓ ${r.name}: <span style="color: ${color}">${vote}</span> (${rtFormatted} RTT)`;
                        elem.style.color = color;
                    }
                }, visualDelayMs);
            });
            
            // Store current speed for exit
            window.savedDecisionSpeed = currentSpeed;
            
            // Exit function
            window.exitDecisionMode = function() {
                simulationSpeed = window.savedDecisionSpeed || 1;
                decisionActive = false;
                document.getElementById('speed-display').textContent = `${simulationSpeed}x`;
                document.getElementById('speed-slider').disabled = false;
                if (panel) panel.style.display = 'none';
                // Stop the light pulse
                if (scene && scene.lightComm) {
                    scene.lightComm.stopAllPulses();
                }
            };
        };
        
        // Add both onclick and addEventListener
        decisionBtn.onclick = window.handleDecision;
        decisionBtn.addEventListener('click', window.handleDecision);
        console.log('Decision button handler attached');
    } else {
        console.error('Decision button not found!');
    }
}

function setupModals() {
    // Whitepaper
    document.getElementById('btn-whitepaper').addEventListener('click', () => {
        window.open('/whitepaper.html', '_blank');
    });
    
    // About
    document.getElementById('btn-about').addEventListener('click', () => {
        document.getElementById('about-modal').classList.add('active');
    });
    
    // GitHub
    document.getElementById('btn-github').addEventListener('click', () => {
        window.open('https://github.com/yourusername/chronomesh', '_blank');
    });
    
    // Close modals
    document.querySelectorAll('.btn-modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// UI Updates
const timeline = [];

function addTimelineEvent(text, type) {
    timeline.unshift({ text, type, time: simulationTime });
    if (timeline.length > 10) timeline.pop();
    
    const container = document.getElementById('timeline-events');
    container.innerHTML = '';
    timeline.forEach(event => {
        const div = document.createElement('div');
        div.className = `timeline-event ${event.type}`;
        div.innerHTML = `<small>Year ${(event.time / 365).toFixed(1)}</small><br>${event.text}`;
        container.appendChild(div);
    });
}

const launchedElders = [];

function updateEldersList(elderName) {
    if (elderName) {
        launchedElders.push(elderName);
    }
    const container = document.getElementById('elder-list');
    container.innerHTML = '';
    
    // Show last 5 launched elders
    const recent = launchedElders.slice(-5).reverse();
    recent.forEach(name => {
        const div = document.createElement('div');
        div.className = 'elder-item';
        div.innerHTML = `Elder ${name}`;
        container.appendChild(div);
    });
    
    if (launchedElders.length > 5) {
        const div = document.createElement('div');
        div.className = 'elder-item';
        div.style.opacity = '0.6';
        div.innerHTML = `... and ${launchedElders.length - 5} more`;
        container.appendChild(div);
    }
}

function updateCouncilList(location) {
    const container = document.getElementById('council-list');
    if (container.querySelector('.placeholder')) {
        container.innerHTML = '';
    }
    const div = document.createElement('div');
    div.className = 'council-item';
    const displayName = location === 'Moon' ? 'LUNAR' : location.toUpperCase();
    div.textContent = `${displayName}-MIND Active`;
    container.appendChild(div);
}

function triggerDecision() {
    console.log('Decision triggered!', scene);
    
    // Check if scene exists
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }
    
    // Save current speed and slow down for decision visualization
    savedSpeed = simulationSpeed;
    simulationSpeed = 0.1; // Slow to 0.1x speed to see light propagation
    decisionActive = true;
    
    // Update speed display
    document.getElementById('speed-display').textContent = `0.1x (Decision Mode)`;
    document.getElementById('speed-slider').disabled = true;
    
    try {
        // Trigger the visual light-speed communication
        const signals = scene.triggerDecision();
        console.log('Signals created:', signals);
    } catch (error) {
        console.error('Error triggering decision:', error);
        // Reset on error
        simulationSpeed = savedSpeed;
        decisionActive = false;
        document.getElementById('speed-display').textContent = `${simulationSpeed}x`;
        document.getElementById('speed-slider').disabled = false;
        return;
    }
    
    // Create or update decision panel
    const panel = document.getElementById('decision-panel');
    if (!panel) {
        const decisionPanel = document.createElement('div');
        decisionPanel.id = 'decision-panel';
        decisionPanel.className = 'decision-panel';
        decisionPanel.innerHTML = '<h3>Decision Status</h3><div id="decision-content"></div>';
        document.querySelector('.main-container').appendChild(decisionPanel);
    }
    
    const content = document.getElementById('decision-content');
    content.innerHTML = '<p style="color: #00ffff">Broadcasting at light speed...</p><div id="response-list"></div>';
    
    // Show panel
    document.getElementById('decision-panel').style.display = 'block';
    
    // Calculate actual delays and schedule response displays
    let earthPos;
    try {
        earthPos = scene.solarSystem.getEarthPosition();
    } catch (error) {
        console.error('Error getting Earth position:', error);
        return;
    }
    
    const responseList = document.getElementById('response-list');
    const responses = [];
    
    // Collect all responses with their delays
    if (scene.councilNodes.length > 0) {
        scene.councilNodes.forEach(node => {
            const distance = earthPos.distanceTo(node.mesh.position);
            const delaySeconds = scene.lightComm.calculateLightDelay(distance) * 2; // Round trip
            responses.push({
                name: node.planet,
                delay: delaySeconds,
                type: 'council',
                formatted: scene.lightComm.formatDelay(delaySeconds / 2)
            });
        });
    }
    
    if (scene.probeSystem.probes.length > 0) {
        scene.probeSystem.probes.forEach((probe, i) => {
            const distance = earthPos.distanceTo(probe.mesh.position);
            const delaySeconds = scene.lightComm.calculateLightDelay(distance) * 2; // Round trip
            responses.push({
                name: `Elder-${i + 1}`,
                delay: delaySeconds,
                type: 'probe',
                formatted: scene.lightComm.formatDelay(delaySeconds / 2)
            });
        });
    }
    
    // Sort by delay
    responses.sort((a, b) => a.delay - b.delay);
    
    // Show initial list with "waiting" status
    let listHtml = '<div style="margin-top: 10px; font-size: 0.9em"><strong>Awaiting responses:</strong><br>';
    responses.forEach(r => {
        const color = r.type === 'council' ? '#00ff88' : '#ff00ff';
        listHtml += `<div id="resp-${r.name}" style="color: #666">⏳ ${r.name}: ${r.formatted} RTT</div>`;
    });
    listHtml += '</div>';
    responseList.innerHTML = listHtml;
    
    // Schedule each response to appear at the correct time
    responses.forEach(r => {
        // Convert real seconds to visual seconds (at 0.1x speed, 1 year = 200 seconds)
        // 1 AU takes 499 seconds real = 0.0158 years = 3.16 visual seconds at 0.1x
        const visualDelay = (r.delay / 31536000) * 200 * 1000; // Convert to milliseconds
        
        setTimeout(() => {
            const elem = document.getElementById(`resp-${r.name}`);
            if (elem) {
                const color = r.type === 'council' ? '#00ff88' : '#ff00ff';
                const vote = r.type === 'council' && Math.random() > 0.3 ? 'APPROVE' : 'ACKNOWLEDGE';
                elem.innerHTML = `✓ ${r.name}: <span style="color: ${color}">${vote}</span> (${r.formatted} RTT)`;
                elem.style.color = color;
            }
        }, Math.min(visualDelay, 30000)); // Cap at 30 seconds for display
    });
    
    // Return to normal speed after 30 seconds
    setTimeout(() => {
        document.getElementById('decision-panel').style.display = 'none';
        simulationSpeed = savedSpeed;
        decisionActive = false;
        document.getElementById('speed-display').textContent = `${simulationSpeed}x`;
        document.getElementById('speed-slider').disabled = false;
        
        // Update slider position
        const speeds = [0.1, 0.5, 1, 2, 5, 10];
        const sliderValue = speeds.indexOf(simulationSpeed);
        if (sliderValue >= 0) {
            document.getElementById('speed-slider').value = sliderValue;
        }
    }, 30000);
}

// Make triggerDecision globally accessible
window.triggerDecision = triggerDecision;