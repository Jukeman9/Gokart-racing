// Physics Engine for GoKart Racing Game

class PhysicsEngine {
    constructor() {
        this.gravity = 0;
        this.friction = 0.95;
        this.airResistance = 0.98;
        this.maxSpeed = 200;
        this.trackBounds = [];
        this.checkpoints = [];
        this.collisionObjects = [];
    }

    // Initialize physics world
    initialize(trackData) {
        this.trackBounds = trackData.bounds || [];
        this.checkpoints = trackData.checkpoints || [];
        this.collisionObjects = trackData.obstacles || [];
    }

    // Update physics for all objects
    update(deltaTime, objects) {
        for (const obj of objects) {
            if (obj.physics) {
                this.updateObject(obj, deltaTime);
            }
        }

        // Handle collisions
        this.handleCollisions(objects);
    }

    // Update individual object physics
    updateObject(obj, deltaTime) {
        const dt = Math.min(deltaTime, 1/30); // Cap delta time to prevent large jumps

        // Apply forces
        this.applyForces(obj, dt);
        
        // Update velocity
        this.updateVelocity(obj, dt);
        
        // Update position
        this.updatePosition(obj, dt);
        
        // Apply constraints
        this.applyConstraints(obj);
        
        // Update derived properties
        this.updateDerivedProperties(obj);
    }

    // Apply forces to object
    applyForces(obj, deltaTime) {
        const physics = obj.physics;
        
        // Reset forces
        physics.forceX = 0;
        physics.forceY = 0;
        physics.torque = 0;

        // Apply engine force (acceleration)
        if (obj.controls && obj.controls.accelerate) {
            const engineForce = physics.enginePower * obj.controls.accelerate;
            const forceX = Math.cos(obj.rotation) * engineForce;
            const forceY = Math.sin(obj.rotation) * engineForce;
            
            physics.forceX += forceX;
            physics.forceY += forceY;
        }

        // Apply braking force
        if (obj.controls && obj.controls.brake > 0) {
            const brakeForce = physics.brakePower * obj.controls.brake;
            const velocityMag = Math.sqrt(physics.velocityX ** 2 + physics.velocityY ** 2);
            
            if (velocityMag > 0) {
                const brakeX = -(physics.velocityX / velocityMag) * brakeForce;
                const brakeY = -(physics.velocityY / velocityMag) * brakeForce;
                
                physics.forceX += brakeX;
                physics.forceY += brakeY;
            }
        }

        // Apply steering torque
        if (obj.controls && obj.controls.steer !== 0) {
            const steerForce = physics.steerPower * obj.controls.steer;
            const velocityMag = Math.sqrt(physics.velocityX ** 2 + physics.velocityY ** 2);
            const steerEffectiveness = Math.min(velocityMag / 50, 1); // Steering is more effective at higher speeds
            
            physics.torque += steerForce * steerEffectiveness;
        }

        // Apply drag/friction
        const velocityMag = Math.sqrt(physics.velocityX ** 2 + physics.velocityY ** 2);
        if (velocityMag > 0) {
            const dragCoeff = physics.dragCoefficient * velocityMag * velocityMag;
            const dragX = -(physics.velocityX / velocityMag) * dragCoeff;
            const dragY = -(physics.velocityY / velocityMag) * dragCoeff;
            
            physics.forceX += dragX;
            physics.forceY += dragY;
        }

        // Surface friction (different for track vs grass)
        const surfaceType = this.getSurfaceType(obj.x, obj.y);
        const frictionCoeff = this.getFrictionCoefficient(surfaceType);
        
        physics.forceX -= physics.velocityX * frictionCoeff;
        physics.forceY -= physics.velocityY * frictionCoeff;

        // Angular drag
        physics.torque -= physics.angularVelocity * physics.angularDrag;
    }

    // Update velocity based on forces
    updateVelocity(obj, deltaTime) {
        const physics = obj.physics;
        
        // Linear velocity
        const accelerationX = physics.forceX / physics.mass;
        const accelerationY = physics.forceY / physics.mass;
        
        physics.velocityX += accelerationX * deltaTime;
        physics.velocityY += accelerationY * deltaTime;

        // Angular velocity
        const angularAcceleration = physics.torque / physics.momentOfInertia;
        physics.angularVelocity += angularAcceleration * deltaTime;

        // Apply velocity limits
        const velocityMag = Math.sqrt(physics.velocityX ** 2 + physics.velocityY ** 2);
        if (velocityMag > physics.maxSpeed) {
            const scale = physics.maxSpeed / velocityMag;
            physics.velocityX *= scale;
            physics.velocityY *= scale;
        }

        // Apply angular velocity limits
        physics.angularVelocity = Utils.clamp(physics.angularVelocity, -physics.maxAngularVelocity, physics.maxAngularVelocity);
    }

    // Update position based on velocity
    updatePosition(obj, deltaTime) {
        const physics = obj.physics;
        
        // Linear position
        obj.x += physics.velocityX * deltaTime;
        obj.y += physics.velocityY * deltaTime;
        
        // Angular position
        obj.rotation += physics.angularVelocity * deltaTime;
        obj.rotation = Utils.normalizeAngle(obj.rotation);
    }

    // Apply constraints (track boundaries, etc.)
    applyConstraints(obj) {
        // Track boundary collision
        if (this.trackBounds.length > 0) {
            const collision = this.checkTrackBoundaryCollision(obj);
            if (collision) {
                this.resolveTrackCollision(obj, collision);
            }
        }

        // World boundaries (fallback)
        const worldBounds = { x: 0, y: 0, width: 2000, height: 2000 };
        if (obj.x < worldBounds.x) {
            obj.x = worldBounds.x;
            obj.physics.velocityX = Math.abs(obj.physics.velocityX) * 0.5;
        }
        if (obj.x > worldBounds.width) {
            obj.x = worldBounds.width;
            obj.physics.velocityX = -Math.abs(obj.physics.velocityX) * 0.5;
        }
        if (obj.y < worldBounds.y) {
            obj.y = worldBounds.y;
            obj.physics.velocityY = Math.abs(obj.physics.velocityY) * 0.5;
        }
        if (obj.y > worldBounds.height) {
            obj.y = worldBounds.height;
            obj.physics.velocityY = -Math.abs(obj.physics.velocityY) * 0.5;
        }
    }

    // Update derived properties
    updateDerivedProperties(obj) {
        const physics = obj.physics;
        
        // Speed (magnitude of velocity)
        physics.speed = Math.sqrt(physics.velocityX ** 2 + physics.velocityY ** 2);
        
        // Direction of movement
        if (physics.speed > 0.1) {
            physics.movementDirection = Math.atan2(physics.velocityY, physics.velocityX);
        }
        
        // Slip angle (difference between car direction and movement direction)
        if (physics.speed > 0.1) {
            physics.slipAngle = Utils.angleDifference(obj.rotation, physics.movementDirection);
        } else {
            physics.slipAngle = 0;
        }
        
        // Tire grip (affects handling)
        physics.tireGrip = this.calculateTireGrip(obj);
        
        // Update bounding box for collision detection
        this.updateBoundingBox(obj);
    }

    // Calculate tire grip based on slip angle and speed
    calculateTireGrip(obj) {
        const physics = obj.physics;
        const slipAngle = Math.abs(physics.slipAngle);
        const optimalSlipAngle = 0.2; // radians
        
        let grip = 1.0;
        
        // Reduce grip if slip angle is too high
        if (slipAngle > optimalSlipAngle) {
            grip = Math.max(0.3, 1.0 - (slipAngle - optimalSlipAngle) * 2);
        }
        
        // Reduce grip at very low speeds
        if (physics.speed < 10) {
            grip *= physics.speed / 10;
        }
        
        // Surface effect
        const surfaceType = this.getSurfaceType(obj.x, obj.y);
        grip *= this.getGripMultiplier(surfaceType);
        
        return grip;
    }

    // Get surface type at position
    getSurfaceType(x, y) {
        // Simple implementation - check if on track or off track
        if (Utils.isPointOnTrack(x, y, this.trackBounds)) {
            return 'track';
        }
        return 'grass';
    }

    // Get friction coefficient for surface
    getFrictionCoefficient(surfaceType) {
        switch (surfaceType) {
            case 'track': return 2.0;
            case 'grass': return 8.0;
            case 'gravel': return 5.0;
            case 'mud': return 12.0;
            default: return 3.0;
        }
    }

    // Get grip multiplier for surface
    getGripMultiplier(surfaceType) {
        switch (surfaceType) {
            case 'track': return 1.0;
            case 'grass': return 0.6;
            case 'gravel': return 0.7;
            case 'mud': return 0.4;
            default: return 0.8;
        }
    }

    // Handle collisions between objects
    handleCollisions(objects) {
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const obj1 = objects[i];
                const obj2 = objects[j];
                
                if (obj1.physics && obj2.physics && this.checkCollision(obj1, obj2)) {
                    this.resolveCollision(obj1, obj2);
                }
            }
        }
    }

    // Check collision between two objects
    checkCollision(obj1, obj2) {
        const distance = Utils.distance(obj1.x, obj1.y, obj2.x, obj2.y);
        const minDistance = obj1.radius + obj2.radius;
        return distance < minDistance;
    }

    // Resolve collision between two objects
    resolveCollision(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Avoid division by zero
        
        const overlap = (obj1.radius + obj2.radius) - distance;
        const separationX = (dx / distance) * overlap * 0.5;
        const separationY = (dy / distance) * overlap * 0.5;
        
        // Separate objects
        obj1.x -= separationX;
        obj1.y -= separationY;
        obj2.x += separationX;
        obj2.y += separationY;
        
        // Calculate collision response
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        // Relative velocity
        const relativeVelX = obj2.physics.velocityX - obj1.physics.velocityX;
        const relativeVelY = obj2.physics.velocityY - obj1.physics.velocityY;
        
        // Relative velocity in collision normal direction
        const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;
        
        // Don't resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Collision restitution (bounciness)
        const restitution = 0.3;
        
        // Calculate impulse scalar
        const impulseMagnitude = -(1 + restitution) * velAlongNormal;
        const totalMass = obj1.physics.mass + obj2.physics.mass;
        const impulse = impulseMagnitude / totalMass;
        
        // Apply impulse
        const impulseX = impulse * normalX;
        const impulseY = impulse * normalY;
        
        obj1.physics.velocityX -= impulseX * obj2.physics.mass;
        obj1.physics.velocityY -= impulseY * obj2.physics.mass;
        obj2.physics.velocityX += impulseX * obj1.physics.mass;
        obj2.physics.velocityY += impulseY * obj1.physics.mass;
        
        // Add some angular velocity for realistic spinning
        const angularImpulse = 0.1;
        obj1.physics.angularVelocity += angularImpulse * (Math.random() - 0.5);
        obj2.physics.angularVelocity += angularImpulse * (Math.random() - 0.5);
    }

    // Check track boundary collision
    checkTrackBoundaryCollision(obj) {
        // Simplified track boundary check
        const surfaceType = this.getSurfaceType(obj.x, obj.y);
        if (surfaceType !== 'track') {
            // Find closest track boundary point
            let closestDistance = Infinity;
            let closestPoint = null;
            
            for (const point of this.trackBounds) {
                const distance = Utils.distance(obj.x, obj.y, point.x, point.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPoint = point;
                }
            }
            
            if (closestPoint && closestDistance < obj.radius * 2) {
                return {
                    point: closestPoint,
                    distance: closestDistance,
                    normal: {
                        x: (obj.x - closestPoint.x) / closestDistance,
                        y: (obj.y - closestPoint.y) / closestDistance
                    }
                };
            }
        }
        
        return null;
    }

    // Resolve track collision
    resolveTrackCollision(obj, collision) {
        const physics = obj.physics;
        const normal = collision.normal;
        
        // Reflect velocity
        const dotProduct = physics.velocityX * normal.x + physics.velocityY * normal.y;
        const restitution = 0.2;
        
        physics.velocityX -= (1 + restitution) * dotProduct * normal.x;
        physics.velocityY -= (1 + restitution) * dotProduct * normal.y;
        
        // Reduce velocity to simulate energy loss
        physics.velocityX *= 0.7;
        physics.velocityY *= 0.7;
        physics.angularVelocity *= 0.8;
        
        // Move object away from collision
        const separationDistance = obj.radius - collision.distance + 2;
        obj.x += normal.x * separationDistance;
        obj.y += normal.y * separationDistance;
    }

    // Update bounding box for collision detection
    updateBoundingBox(obj) {
        if (!obj.boundingBox) {
            obj.boundingBox = { x: 0, y: 0, width: 0, height: 0 };
        }
        
        obj.boundingBox.x = obj.x - obj.radius;
        obj.boundingBox.y = obj.y - obj.radius;
        obj.boundingBox.width = obj.radius * 2;
        obj.boundingBox.height = obj.radius * 2;
    }

    // Calculate slipstream effect
    calculateSlipstream(kart, otherKarts) {
        let totalEffect = 0;
        
        for (const other of otherKarts) {
            if (other === kart) continue;
            
            const effect = Utils.calculateSlipstreamEffect(kart, other);
            if (effect > 0) {
                totalEffect += effect;
            }
        }
        
        return Math.min(totalEffect, 0.5); // Cap at 50% bonus
    }

    // Apply slipstream effect
    applySlipstream(kart, effect) {
        if (effect > 0) {
            const slipstreamForce = effect * kart.physics.enginePower * 0.5;
            const forceX = Math.cos(kart.rotation) * slipstreamForce;
            const forceY = Math.sin(kart.rotation) * slipstreamForce;
            
            kart.physics.forceX += forceX;
            kart.physics.forceY += forceY;
        }
    }

    // Check checkpoint crossing
    checkCheckpoints(kart) {
        if (!kart.raceData) {
            kart.raceData = {
                currentCheckpoint: 0,
                lapCount: 0,
                checkpointsPassed: [],
                lapTimes: [],
                startTime: Utils.now()
            };
        }
        
        const currentCheckpoint = this.checkpoints[kart.raceData.currentCheckpoint];
        if (currentCheckpoint) {
            const distance = Utils.distance(kart.x, kart.y, currentCheckpoint.x, currentCheckpoint.y);
            
            if (distance < currentCheckpoint.radius) {
                // Checkpoint passed
                kart.raceData.checkpointsPassed.push({
                    checkpoint: kart.raceData.currentCheckpoint,
                    time: Utils.now()
                });
                
                kart.raceData.currentCheckpoint++;
                
                // Check if lap completed
                if (kart.raceData.currentCheckpoint >= this.checkpoints.length) {
                    kart.raceData.currentCheckpoint = 0;
                    kart.raceData.lapCount++;
                    
                    const lapTime = Utils.now() - (kart.raceData.lapTimes.length === 0 ? 
                        kart.raceData.startTime : 
                        kart.raceData.lapTimes[kart.raceData.lapTimes.length - 1].endTime);
                    
                    kart.raceData.lapTimes.push({
                        lapNumber: kart.raceData.lapCount,
                        time: lapTime,
                        endTime: Utils.now()
                    });
                    
                    return { type: 'lap', data: kart.raceData };
                }
                
                return { type: 'checkpoint', data: kart.raceData };
            }
        }
        
        return null;
    }

    // Get race position
    getRacePosition(kart, allKarts) {
        const raceProgress = this.getRaceProgress(kart);
        
        const sortedKarts = allKarts
            .map(k => ({ kart: k, progress: this.getRaceProgress(k) }))
            .sort((a, b) => b.progress - a.progress);
        
        return sortedKarts.findIndex(item => item.kart === kart) + 1;
    }

    // Calculate race progress (0-1)
    getRaceProgress(kart) {
        if (!kart.raceData) return 0;
        
        const lapProgress = kart.raceData.lapCount;
        const checkpointProgress = kart.raceData.currentCheckpoint / this.checkpoints.length;
        
        return lapProgress + checkpointProgress;
    }
}

// Create default physics properties for karts
class KartPhysics {
    constructor(config = {}) {
        // Basic properties
        this.mass = config.mass || 150;
        this.momentOfInertia = config.momentOfInertia || 100;
        
        // Forces and powers
        this.enginePower = config.enginePower || 800;
        this.brakePower = config.brakePower || 1200;
        this.steerPower = config.steerPower || 3;
        
        // Velocity and limits
        this.velocityX = 0;
        this.velocityY = 0;
        this.angularVelocity = 0;
        this.maxSpeed = config.maxSpeed || 150;
        this.maxAngularVelocity = config.maxAngularVelocity || 3;
        
        // Forces
        this.forceX = 0;
        this.forceY = 0;
        this.torque = 0;
        
        // Drag and friction
        this.dragCoefficient = config.dragCoefficient || 0.02;
        this.angularDrag = config.angularDrag || 5;
        
        // Derived properties
        this.speed = 0;
        this.movementDirection = 0;
        this.slipAngle = 0;
        this.tireGrip = 1;
    }

    // Create physics preset for different kart types
    static createPreset(type) {
        switch (type) {
            case 'speed':
                return new KartPhysics({
                    maxSpeed: 180,
                    enginePower: 1000,
                    mass: 120,
                    dragCoefficient: 0.015
                });
            case 'handling':
                return new KartPhysics({
                    maxSpeed: 140,
                    steerPower: 4,
                    mass: 140,
                    brakePower: 1500
                });
            case 'balanced':
                return new KartPhysics({
                    maxSpeed: 160,
                    enginePower: 900,
                    steerPower: 3.5,
                    mass: 130
                });
            default:
                return new KartPhysics();
        }
    }
}

// Global physics engine instance
window.PhysicsEngine = PhysicsEngine;
window.KartPhysics = KartPhysics;