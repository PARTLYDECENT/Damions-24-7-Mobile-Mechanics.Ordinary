// --- Hantu Raya Mechanical Details & PLY Mapping ---
const HantuRayaDetails = {
    // Grid settings matching hantu_raya_bounds.ply
    grid: {
        xMin: -30, xMax: 30, xStep: 5,
        yMin: -12, yMax: 24, yStep: 4,
        zMin: -75, zMax: 65, zStep: 5
    },

    // Every single part labeled and positioned
    components: [
        // --- CHASSIS STRUCTURE ---
        {
            id: "b_pillar_hoop",
            name: "B-Pillar Main Roll Hoop",
            category: "chassis",
            bounds: { x: [-21, 21], y: [2, 24], z: [-11, -9] },
            description: "Main central rollover protection hoop matching reference cabin dimensions."
        },
        {
            id: "windshield_hoop",
            name: "A-Pillar Windshield Hoop",
            category: "chassis",
            bounds: { x: [-21, 21], y: [2, 24], z: [-46, -44] },
            description: "Windshield pillar frame protecting the front cockpit."
        },
        {
            id: "roof_bars",
            name: "Roof Longitudinal Rails",
            category: "chassis",
            bounds: { x: [-21, 21], y: [23, 25], z: [-45, -10] },
            description: "Top cage tubes connecting B-pillar hoop to windshield hoop."
        },
        {
            id: "sill_rails",
            name: "Lower Frame Sill Rails",
            category: "chassis",
            bounds: { x: [-21, 21], y: [1, 3], z: [-72, 30] },
            description: "Main lower structural box rails running along the vehicle floor."
        },
        {
            id: "front_bumper",
            name: "Nose Tube & Bumper",
            category: "chassis",
            bounds: { x: [-15, 15], y: [3, 9], z: [-75, -71] },
            description: "Protective front bumper and radiator mount base."
        },
        {
            id: "bed_tubes",
            name: "Buggy Bed Side Loops",
            category: "chassis",
            bounds: { x: [-22, 22], y: [2, 17], z: [30, 65] },
            description: "Triangulated rear spaceframe bed loops replacing reference mid-wheel space."
        },
        
        // --- COCKPIT ---
        {
            id: "driver_seat",
            name: "Driver Skeletal Bucket Seat",
            category: "interior",
            bounds: { x: [-13, -3], y: [4.5, 17], z: [-29, -11] },
            description: "Skeletal driver racing seat with side bolsters."
        },
        {
            id: "passenger_seat",
            name: "Passenger Skeletal Bucket Seat",
            category: "interior",
            bounds: { x: [3, 13], y: [4.5, 17], z: [-29, -11] },
            description: "Skeletal passenger racing seat with side bolsters."
        },
        {
            id: "steering_system",
            name: "Steering Column & Spoke Wheel",
            category: "interior",
            bounds: { x: [-11, -5], y: [11, 16], z: [-43, -29] },
            description: "Left-hand drive steering column and 3-spoke wheel."
        },
        {
            id: "floor_panel",
            name: "Diamond Plate Floor Panel",
            category: "interior",
            bounds: { x: [-20, 20], y: [4, 5.5], z: [-58, -12] },
            description: "Procedural diamond grate metal floor backing panel."
        },

        // --- ENGINE & DRIVETRAIN ---
        {
            id: "vtwin_engine",
            name: "700cc V-Twin Engine Block",
            category: "engine",
            bounds: { x: [-9.0, 9.0], y: [4.0, 24.0], z: [-1.0, 17.0] },
            description: "Air-cooled 2x V-twin motor with primary drive covers and timing gears."
        },
        {
            id: "carburetor_filter",
            name: "Intake Carb & Air Filter",
            category: "engine",
            bounds: { x: [-2.5, 9.0], y: [15.0, 24.0], z: [4.0, 12.0] },
            description: "Intake carburetor and red high-flow air filter cone with chrome cap."
        },
        {
            id: "exhaust_pipes",
            name: "Dual Swept Exhaust Pipes",
            category: "engine",
            bounds: { x: [-10.0, 0.0], y: [5.0, 25.0], z: [-6.0, 60.0] },
            description: "Dual pipes exiting engine cylinders and sweeping rearward under the bed."
        },
        {
            id: "transmission",
            name: "Basic Transmission Gearbox",
            category: "engine",
            bounds: { x: [-6.0, 6.0], y: [3.5, 15.5], z: [16.0, 30.0] },
            description: "Manual gearbox casing including front bellhousing and tailcone output."
        },
        {
            id: "driveshaft",
            name: "Rear Driveshaft & Yokes",
            category: "engine",
            bounds: { x: [-3.0, 3.0], y: [-2.0, 10.0], z: [28.0, 42.0] },
            description: "Chrome driveshaft transmitting torque from transmission output to rear axle."
        },
        {
            id: "fuel_bottle",
            name: "Hanging Fuel Test Bottle",
            category: "engine",
            bounds: { x: [-4.0, 4.0], y: [11.5, 23.5], z: [4.5, 11.5] },
            description: "Temporary gravity-feed test bottle containing fuel mixture, hanging from subframe."
        },

        // --- SUSPENSION ---
        {
            id: "front_ifs",
            name: "Independent Front Suspension (A-Arms)",
            category: "suspension",
            bounds: { x: [-28, 28], y: [-7, 11], z: [-66, -54] },
            description: "Double triangular A-arms, knuckles, steering spindles, and shock towers."
        },
        {
            id: "front_coilovers",
            name: "Front Coilovers (Mounts & Springs)",
            category: "suspension",
            bounds: { x: [-21, 21], y: [-1.5, 21], z: [-61, -59] },
            description: "Heavy-duty coilover shocks with upper/lower mounts, bells, and helical coils."
        },
        {
            id: "rear_axle",
            name: "Rear Solid Axle & Differential",
            category: "suspension",
            bounds: { x: [-28, 28], y: [-2, 3], z: [44, 46] },
            description: "Rear solid axle tubes, outer hubs, and center differential pumpkin casing."
        },
        {
            id: "leaf_springs",
            name: "Multi-Leaf Spring Packs",
            category: "suspension",
            bounds: { x: [-23, 23], y: [-3, 10], z: [19, 66] },
            description: "Triple-stacked leaf springs under axle with shackles and U-bolt clamps."
        },

        // --- WHEELS ---
        {
            id: "wheel_fl",
            name: "Front Left Wheel",
            category: "wheel",
            bounds: { x: [-30, -24], y: [-12, 10], z: [-66, -54] },
            description: "Front left simple tire and center rim cap (radius 11, width 5.5)."
        },
        {
            id: "wheel_fr",
            name: "Front Right Wheel",
            category: "wheel",
            bounds: { x: [24, 30], y: [-12, 10], z: [-66, -54] },
            description: "Front right simple tire and center rim cap (radius 11, width 5.5)."
        },
        {
            id: "wheel_rl",
            name: "Rear Left Wheel",
            category: "wheel",
            bounds: { x: [-30, -24], y: [-13, 11], z: [39, 51] },
            description: "Rear left simple tire and center rim cap (radius 12, width 6.0)."
        },
        {
            id: "wheel_rr",
            name: "Rear Right Wheel",
            category: "wheel",
            bounds: { x: [24, 30], y: [-13, 11], z: [39, 51] },
            description: "Rear right simple tire and center rim cap (radius 12, width 6.0)."
        }
    ],

    // Function to calculate which PLY point indices fall inside a component's bounding box
    getIndicesForComponent: function(componentId) {
        const comp = this.components.find(c => c.id === componentId);
        if (!comp) return [];

        const indices = [];
        let index = 0;

        const { xMin, xMax, xStep, yMin, yMax, yStep, zMin, zMax, zStep } = this.grid;
        
        // Loop structure matching PLY generation
        for (let x = xMin; x <= xMax; x += xStep) {
            for (let y = yMin; y <= yMax; y += yStep) {
                for (let z = zMin; z <= zMax; z += zStep) {
                    // Check if point falls within bounds
                    const inX = x >= comp.bounds.x[0] && x <= comp.bounds.x[1];
                    const inY = y >= comp.bounds.y[0] && y <= comp.bounds.y[1];
                    const inZ = z >= comp.bounds.z[0] && z <= comp.bounds.z[1];

                    if (inX && inY && inZ) {
                        indices.push(index);
                    }
                    index++;
                }
            }
        }
        return indices;
    }
};

if (typeof module !== 'undefined') {
    module.exports = HantuRayaDetails;
}
