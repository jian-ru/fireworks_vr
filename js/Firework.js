// Firework

function Particle(pos, vel, life, radius, rgbColor, scene)
{
	this.life = life;
	this.mesh = new THREE.Mesh(
		new THREE.IcosahedronGeometry(radius, 0),
		new THREE.MeshLambertMaterial({
			color: rgbColor
		})
	);
	this.mesh.position.set(pos.x, pos.y, pos.z);
	this.mesh.userData.velocity = vel.clone();
	
	this.scene = scene;
	scene.add(this.mesh);
}

Particle.prototype.update = function(deltaTime)
{
	var oldLife = this.life;
	this.life -= deltaTime;
	
	if (oldLife > 0.0 && this.life <= 0.0)
	{
		this.scene.remove(this.mesh);
	}
	
	if (this.life > 0.0)
	{
		var dv = new THREE.Vector3(0, -9.8, 0);
		dv.multiplyScalar(deltaTime);
	
		var vel = this.mesh.userData.velocity;
		vel = new THREE.Vector3(vel.x, vel.y, vel.z);
		vel.multiplyScalar(deltaTime);
		this.mesh.position.add(vel);
		
		this.mesh.userData.velocity.add(dv);
	}
}

Particle.prototype.isAlive = function()
{
	return this.life > 0.0;
}

function Trail(pos, scene)
{
	Particle.call(this, pos, new THREE.Vector3(0, 0, 0),
		Math.random() + 0.5, 0.25 + Math.random() * 0.1, 0xff7700, scene);
}

Trail.prototype = Object.create(Particle.prototype);
Trail.prototype.constructor = Trail;


function Spark(pos, vel, scene)
{
	Particle.call(this, pos, vel,
		Math.random() + 0.5, 0.2 + Math.random() * 0.1, 0xffff00, scene);
}

Spark.prototype = Object.create(Particle.prototype);
Spark.prototype.constructor = Spark;


function Firework(pos, vel, scene)
{
	this.exploded = false;
	this.finished = false;
	
	this.rocket = new THREE.Mesh(
		new THREE.IcosahedronGeometry(0.5, 0),
		new THREE.MeshLambertMaterial({
			color: 0xff0000
		})
	);
	this.rocket.position.set(pos.x, pos.y, pos.z);
	this.rocket.userData.velocity = vel.clone();
	
	this.sparks = [];
	
	this.trailTimer = 0.0;
	this.trails = [];
	
	this.scene = scene;
	scene.add(this.rocket);
}

Firework.prototype.update = function(deltaTime)
{
	var dv = new THREE.Vector3(0, -9.8, 0);
	dv.multiplyScalar(deltaTime);
	
	if (!this.exploded)
	{
		// update position
		var vel = this.rocket.userData.velocity;
		vel = new THREE.Vector3(vel.x, vel.y, vel.z);
		vel.multiplyScalar(deltaTime);
		this.rocket.position.add(vel);
		
		// update velocity
		this.rocket.userData.velocity.add(dv);
	}
	
	// update trail particles
	for (var i = 0; i < this.trails.length; ++i)
	{
		this.trails[i].update(deltaTime);
		if (!this.trails[i].isAlive())
		{
			this.trails[i] = this.trails[this.trails.length - 1];
			this.trails.pop();
			--i;
		}
	}
	
	this.trailTimer -= deltaTime;
	if (!this.exploded && this.trailTimer < 0.0)
	{
		this.trailTimer = 0.1;
		this.trails.push(new Trail(this.rocket.position, this.scene));
	}
	
	// update sparks
	for (var i = 0; i < this.sparks.length; ++i)
	{
		this.sparks[i].update(deltaTime);
		if (!this.sparks[i].isAlive())
		{
			this.sparks[i] = this.sparks[this.sparks.length - 1];
			this.sparks.pop();
			--i;
		}
	}
	
	if (this.exploded && !this.trails.length && !this.sparks.length)
	{
		this.finished = true;
	}
}

Firework.prototype.explode = function()
{
	this.exploded = true;
	this.scene.remove(this.rocket);
	
	// spawn sparks
	var numSparks = Math.floor((Math.random() * 0.6 + 0.4) * 100);
	for (var i = 0; i < numSparks; ++i)
	{
		var theta = Math.random() * Math.PI;
		var phi = Math.random() * 2.0 * Math.PI;
		var vel = new THREE.Vector3(
			Math.sin(phi) * Math.sin(theta),
			Math.cos(theta),
			Math.cos(phi) * Math.sin(theta));
		vel.multiplyScalar((Math.random() * 0.4 + 0.8) * 10.0);
		
		this.sparks.push(new Spark(
			this.rocket.position,
			vel,
			scene
		));
	}
}