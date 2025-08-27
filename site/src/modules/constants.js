// Physical and astronomical constants
export const AU = 149597870.7; // km (Astronomical Unit)
export const C = 299792.458; // km/s (Speed of light)
export const SECONDS_PER_DAY = 86400;
export const DAYS_PER_YEAR = 365.25;

// Planetary data (simplified circular orbits)
export const PLANETS = [
    { name: 'Mercury', semiMajorAxis: 0.387, period: 87.97, radius: 2439.7, color: '#8C7853' },
    { name: 'Venus', semiMajorAxis: 0.723, period: 224.70, radius: 6051.8, color: '#FFC649' },
    { name: 'Earth', semiMajorAxis: 1.000, period: 365.25, radius: 6371.0, color: '#4169E1' },
    { name: 'Mars', semiMajorAxis: 1.524, period: 686.98, radius: 3389.5, color: '#DC143C' },
    { name: 'Jupiter', semiMajorAxis: 5.204, period: 4332.59, radius: 69911, color: '#FFA500' },
    { name: 'Saturn', semiMajorAxis: 9.537, period: 10759.22, radius: 58232, color: '#DAA520' },
    { name: 'Uranus', semiMajorAxis: 19.191, period: 30688.50, radius: 25362, color: '#4FD0E7' },
    { name: 'Neptune', semiMajorAxis: 30.069, period: 60182.00, radius: 24622, color: '#4166F5' }
];

// Mission phases
export const PHASES = [
    {
        name: 'Elder Probe Launches',
        description: 'Launching uncatchable probes on interstellar trajectories',
        startYear: 0,
        endYear: 10,
        color: '#ff00ff'
    },
    {
        name: 'Council Deployment',
        description: 'Establishing AI nodes across the solar system',
        startYear: 10,
        endYear: 15,
        color: '#00ff88'
    },
    {
        name: 'System Operational',
        description: 'Full bicameral governance system active',
        startYear: 15,
        endYear: Infinity,
        color: '#00d9ff'
    }
];

// Probe launch parameters
export const PROBE_LAUNCH_INTERVAL = 0.2; // Launch every 0.2 years (about 2.5 months)
export const PROBE_LAUNCH_END_YEAR = 10; // Stop launching after 10 years

// Trajectory types with realistic speeds (km/s)
export const TRAJECTORY_TYPES = [
    { type: 'jupiter_assist', speed: 17, color: '#ff00ff' },
    { type: 'solar_oberth', speed: 25, color: '#ff69b4' },
    { type: 'out_of_ecliptic', speed: 20, color: '#9370db' },
    { type: 'saturn_flyby', speed: 18, color: '#ba55d3' },
    { type: 'pluto_escape', speed: 16, color: '#8b008b' },
    { type: 'inner_system', speed: 22, color: '#ff1493' },
    { type: 'polar_jupiter', speed: 19, color: '#dda0dd' },
    { type: 'asteroid_belt', speed: 15, color: '#ee82ee' },
    { type: 'solar_approach', speed: 35, color: '#ff00ff' }
];

// Council deployment schedule
export const COUNCIL_DEPLOYMENTS = [
    { name: 'EARTH-MIND', location: 'Earth', year: 10.5 },
    { name: 'LUNA-MIND', location: 'Moon', year: 11.0 },
    { name: 'MARS-MIND', location: 'Mars', year: 12.0 },
    { name: 'JUPITER-MIND', location: 'Jupiter', year: 13.5 },
    { name: 'SATURN-MIND', location: 'Saturn', year: 14.5 }
];

// Light delay calculations (in seconds)
export function calculateLightDelay(distance) {
    // distance in AU, returns delay in seconds
    return (distance * AU) / C;
}

// Format time for display
export function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
        return `${(seconds / 60).toFixed(1)}min`;
    } else if (seconds < 86400) {
        return `${(seconds / 3600).toFixed(1)}hr`;
    } else if (seconds < 31536000) {
        return `${(seconds / 86400).toFixed(1)}d`;
    } else {
        return `${(seconds / 31536000).toFixed(1)}yr`;
    }
}