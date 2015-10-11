createjs.RGBA = function(r,g,b,a){
	"use strict";
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
	this.str = function() {
		return "rgba("+Math.round(this.r)+","+Math.round(this.g)+","+Math.round(this.b)+","+(this.a/255)+")";
	};
	
	this.CreateRainbow = function(minAlpha, maxAlpha){
		if(minAlpha === undefined){minAlpha = 1;}
		if(maxAlpha === undefined){maxAlpha = 1;}
		
		this.a = createjs.RGBA.rand(minAlpha, maxAlpha);
		var rand = [
			[255,0,0],
			[255,255,0],
			[255,255,0],
			[255,0,255],
			[0,255,0],
			[0,255,255],
			[0,0,255]
		];
		var data = rand[Math.floor(Math.random()*rand.length)];	
		this.r = data[0];
		this.g = data[1];
		this.b = data[2];
		return this;
	};
	
	this.clone = function(){
		return new createjs.RGBA(this.r, this.g, this.b, this.a);
	};
	
	return this;
};

createjs.RGBA.rand = function(min, max) {
	"use strict";
	return (Math.floor(Math.random() * (max*1000 - min*1000 + 1)) + min*1000)/1000;
};
createjs.RGBA.randBetween = function(min, max) {
	"use strict";
	var rand = Math.random();
	return new createjs.RGBA(
		(max.r-min.r)*rand+min.r,
		(max.g-min.g)*rand+min.g,
		(max.b-min.b)*rand+min.b,
		(max.a-min.a)*rand+min.a
	);
};
createjs.RGBA.between = function(a, b, perc){
	"use strict";
	return new createjs.RGBA(
		(b.r-(b.r-a.r)*perc),
		(b.g-(b.g-a.g)*perc),
		(b.b-(b.b-a.b)*perc),
		(b.a-(b.a-a.a)*perc)
	);
};

createjs.fParticle = function(parent){
	"use strict";
	// Auto
	this.parent = parent;									// Contains the particle system
	this.spawned = Date.now();								// Time when this particle was spawned
	this.lastupdate = Date.now();							// Time when this.update was run last
	this.shape = null;										// createjs Shape or Bitmap object
	
	// Runtime variables
	this.position = {x: 0, y:0};							// Current position
	this.rotation = 0;										// Current rotation, also a config var
	this.turbScale = 1;										// Current turbulence scale
	this.vortex_angle = 0;									// Current vortex angle
	this.vortex_radius = 0;									// Current vortex radius
	this.vortex_pos = null;									// Current vortex center pos
	
	// Config
	this.lifetime = 100;									// How long the particle should live for
	this.startRadius = 10;									// Scale/Diameter the particle starts off with
	this.endRadius = 0;										// Scale/Diameter the particle should end with
	this.startColor = new createjs.RGBA(255,0,0,255);		// RGBA of the start color
	this.endColor = new createjs.RGBA(255,0,0,0);			// RGBA of the end color
	this.velocity = {x: 0, y:0};							// Velocity setting
	this.turbulence = {										// Turbulence settings
		min:0, max:0, 
		rotMin:0, rotMax:0,
		scaleMin:0, scaleMax:0, scaleSpeed:0
	};						
	this.gravity = {amount:1, time:1000};					// Gravity setting
	this.image = null;										// Bitmap image DOM element
	this.spin = 0;											// Spin speed setting
	this.vortex = 0;										// Vortex speed setting
	
	
	// Data getting function
	
	// Gets a random turbulence pos nr
	this.getTurbulence = function(){
		return createjs.fParticleSystem.toRandom(this.turbulence);
	};
	
	// Returns rnadom turbulence rot nr
	this.getTurbulenceRot = function(){
		return createjs.RGBA.rand(
			this.turbulence.rotMin === undefined ? 0 : this.turbulence.rotMin,
			this.turbulence.rotMax === undefined ? 0 : this.turbulence.rotMax
		);
	};
	
	// Returns gravity this moment in time
	this.getGravity = function(){
		return this.gravity.amount * (Date.now()-this.spawned)/this.gravity.time;
	};
	
	// Updates and return this vortex {x:y}
	this.getVortex = function(){
		var root = this.parent.psysPosition;
		var me = this.position;
		
		if(this.vortex_radius <= 0){
			this.vortex_radius = Math.sqrt(Math.pow(me.x-root.x, 2) + Math.pow(me.y-root.y, 2)); 
			this.vortex_angle = Math.atan2(me.y-root.y, me.x-root.x);
		}
		
		this.vortex_angle += this.vortex*Math.PI/180;
		var out = {
			x:this.vortex_radius*Math.cos(this.vortex_angle), 
			y:this.vortex_radius*Math.sin(this.vortex_angle)
		}; 
		var ret = {x:out.x, y:out.y};
		if(this.vortex_pos === null){
			ret = {x:0,y:0};
		}else{
			ret.x -= this.vortex_pos.x;
			ret.y -= this.vortex_pos.y;
		}
		this.vortex_pos = out;
		return ret; 
	};
	
	// Returns the current turbulence scale offset
	this.getTurbulenceScale = function(){
		var a = this.turbulence.scaleMin === undefined ? 0 : this.turbulence.scaleMin;
		if(this.turbulence.scaleMax === undefined){return 0;}
		var b = this.turbulence.scaleMax;
		var speed = this.turbulence.scaleSpeed === undefined ? Math.abs((b-a)/10) : this.turbulence.scaleSpeed;
		
		var rand = createjs.RGBA.rand(-speed,speed);
		
		this.turbScale+=rand;
		if(this.turbScale>b){this.turbScale = b;}
		else if(this.turbScale<a){this.turbScale = a;}
		
		return this.turbScale;
	};
	

	
	// Generic runtime	
	
	// Returns if the particle is dead
	this.isDead = function() {
		var current_time = Date.now();
		return current_time>this.spawned+this.lifetime;
	};
	
	// Updates the particle		
	this.update = function(pContainer){
		
		var current_time = Date.now();												// Current time
		var perc = (this.spawned+this.lifetime-current_time)/this.lifetime;			
		// Adjust for framerate
		var factor = ((current_time-this.lastupdate)/(1000/createjs.Ticker.framerate));
		
		
		if(perc<0){perc = 0;} // Don't go into the negatives
		
		// If the shape isn't set, create it
		if(this.shape === null) {
			// Make sure start radius is positive so you can divide it
			if(this.startRadius === 0){this.startRadius = 1;}
			// If not an image. create a shape
			if(this.image === null){
				this.shape = new createjs.Shape();
			}
			else{
				// It's an image. Create a bitmap
				this.shape = new createjs.Bitmap(this.image);
				this.shape.regX = this.image.width/2;
				this.shape.regY = this.image.height/2;
			}
			pContainer.addChild(this.shape);
			// Add the child to parent container
		}
		
		var turbulence = this.getTurbulenceScale(),							// Get turbulence scale
			scale = this.endRadius-(this.endRadius-this.startRadius)*perc;  	// Get current scale
		
		var color = createjs.RGBA.between(this.startColor, this.endColor, perc);
		// This is a shape 
		if(this.image === null){ 
			// Only shapes can twen color. Get the current color in the tween
			
			// Redraw
			this.shape.graphics
				.clear()
				.beginRadialGradientFill([color.str(), new createjs.RGBA(color.r, color.g, color.b, 0).str()], [0,1], scale*2,scale*2,0,scale*2,scale*2,scale)
				.drawCircle(scale*2, scale*2, scale); 
			// Center it
			this.shape.regX = scale*2;
			this.shape.regY = scale*2;
			this.shape.scaleX = 1;
			this.shape.scaleY = 1;
		}
		// This is a bitmap
		else{
			this.shape.scaleX = scale;
			this.shape.scaleY = scale;
			this.shape.alpha = color.a/255;
			this.shape.rotation = this.rotation;		// Only bitmaps can have rotation hurdur
		}
		// Figure this out later

		// Add turbulence scale
		this.shape.scaleX += turbulence*factor;
		this.shape.scaleY += turbulence*factor;
		
		// Set position
		this.shape.x = this.position.x;
		this.shape.y = this.position.y;
		
		
		// Let's prepare a new position for the next frame
		 
		var vortex = {x:0, y:0};
		if(this.vortex){
			// No need to run the vortex data if vortex is unneeded
			vortex = this.getVortex();
		}
		
		
		this.position.x += (this.velocity.x+this.getTurbulence()+vortex.x)*factor;
		this.position.y += (this.velocity.y+this.getTurbulence()+this.getGravity()+vortex.y)*factor;
			
		this.lastupdate = current_time;
		this.rotation += (this.getTurbulenceRot()+this.spin)*factor;
	};
	
	this.dispose = function(container) {
		container.removeChild(this.shape);
	};
};
	


createjs.fParticleSystem = function(config){
	this.container = new createjs.Container();					// Container to put the particles
																// Useful if you want to tween or change the entire set
	
	// INTERNAL //
	this.nextSpawn = Date.now();								// Time when to spawn the next particle.
																// Used to calculate proper # based on framerate
	this.ends = 0; 												// Time when the system runs out. -1 = paused. 
																// Overriden if not -1 and psysLife is -1
	this.particles = [];										// Array of all the particle objects
	this.image_asset = null;									// DOM Image. 				
	this.imageLoaded = false;									// Whether image is loaded or not
	
	
	// CONFIGURABLE //
	
	// Particle System
	this.psysLife = 1000;											// How long the particle system should last. -1 = infinite
	this.psysRate = 2;											// Particles/sec
	this.psysPosition = { x: 1280/2, y: 720/2 };				// Canvas X/Y coordinates of the particles.
	this.psysPositionOffsetX = { min: 0, max: 0 };				// Offset on X where particles can spawn
	this.psysPositionOffsetY = { min: 0, max: 0 };				// Offset on Y where particles can spawn
	this.psysPositionOffsetRadius = null;						// {min:0, max:0} - Overrides OffsetX and y to instead spawn randomly on a circle with min and max radius from psysPosition
	this.psysHoldAtStart = false;								// Pause particles at start
	
	
	// Particle
	this.pLife = { min: 1000, max: 1000 };						// Time in milliseconds the particles should live
	this.pVelocityX = { min: 0, max: 0 };						// Velocity the particle moves at x
	this.pVelocityY = { min: 0, max: 0 };						// Velocity the particle moves at y
	this.pStartRadius = { min: 32, max: 32 };					// Start diameter of particle. If particle is bitmap this is instead scale multiplier.
	this.pEndRadius = { min: 0, max: 0 };						// End diameter of particle. If particle is bitmap this is instead scale multiplier.
	
	this.pGravity = {amount:0, time:1000};						// Affect particle with gravity?
	this.pTurbulence = {										// Creates random physics on a particle
		min:0, max:0, 											// Position pixels that are added each frame
		rotMin:0, rotMax:0,										// Rotation degrees that are added each frame
		scaleMin:0, scaleMax:0, scaleSpeed:0					// Sets a min and max cap and adds random scaleSpeed each frame
	};	
			
	this.pImage = null;											// Use a bitmap instead of a shape
	
	this.pRotation = {min:0, max:0};							// Bitmap only. Randomize rotation at spawn
	this.pSpin = {min:0, max:0};								// Bitmap only. Add a constant spin.
	this.pVortex = {min:0, max:0};								// Spin the particle around psysPosition
	
	this.pStartColor = {										// Shape only. Randomize a color on start.
		min: new createjs.RGBA(255,255,255,255),					// These 2 functions also accept:
		max: new createjs.RGBA(255,255,255,255)							// A function that returns a createjs.RGBA object
	};																// A single RGBA object
	
	this.pEndColor = {											// Shape only. Randomize a color on end.
		min: new createjs.RGBA(255,255,255,255),
		max: new createjs.RGBA(255,255,255,255)
	};
	
	
	
	// PUBLIC METHODS //
	this.pause = function(){									// Pause the particle system
		this.ends = -1;
	}
	
	this.unpause = function(){									// Unpause the particle system
		this.nextSpawn = Date.now();
		this.ends = 0;
		if(this.psysLife === -1){
			return;
		}
		this.ends = Date.now()+this.psysLife;
	}
	

	this.loadConfig = function(config){							// Load in a new config. Does not unset undefined values.
		var accepted = [
			"psysLife",
			"psysRate",
			"psysPosition",
			"psysPositionOffsetX",
			"psysPositionOffsetY",
			"psysPositionOffsetRadius",
			"psysHoldAtStart",
			"pLife",
			"pVelocityX",
			"pVelocityY",
			"pStartRadius",
			"pEndRadius",
			"pGravity",
			"pTurbulence",
			"pImage",
			"pRotation",
			"pSpin",
			"pVortex",
			"pStartColor",
			"pEndColor"
		], i;
		// Go through all accepted values
		for(i = 0; i<accepted.length; i++){
			if(config.hasOwnProperty(accepted[i])){
				this[accepted[i]] = config[accepted[i]];
			}
		}
		
		// Pause
		if(this.psysHoldAtStart){
			this.ends = -1;
		}
		
		// Finite life
		if(this.psysLife>0){
			// Start the particle system if not held
			if(!this.psysHoldAtStart){
				this.unpause(); 
			}
		}
		// Infinite life
		else{
			this.psysLife = -1;
		}
		
		// Use an image. Let's preload it.
		if(this.pImage !== null && this.pImage !== ""){
			this.image_asset = new Image();
			this.image_asset.onload = function(){
				this.imageLoaded = true;
			};
			this.image_asset.src = this.pImage;
		}
		
	};
	
	this.resetTime = function(){
		this.nextSpawn = Date.now()+1000/this.psysRate;
	};
	
	// This should be run at every frame
	this.update = function() {
		var i, p;
		
		
		for(i=0; i<this.particles.length; i++){			
			p = this.particles[i];
			if (p.isDead()) {
				p.dispose(this.container);
				this.particles.splice(i,1);
			} else {
				p.update(this.container);
			}
		}
			
		// Load nextSpawn into a variable and this.nextSpawn
		var ns = this.nextSpawn;
		
		
		// Get current time
		var t = Date.now();
		if(this.ends === -1){
			return;									// Paused
		}
		if(this.image_asset !== null && this.imageLoaded){
			this.resetTime();
			return;									// Waiting for image to load
		}
		if(t>this.ends && this.psysLife !== -1){
			return;									// Finite particle system and time has run out
		}
		if(t<ns){									// It is not yet time to spawn a particle
			return;
		}

		var nr = (t-ns)/1000*this.psysRate; 
		this.resetTime();
		for(i = 0; i<nr; i++){
			// Let's create a particle
			var x, y, deg, radius;
			
			p = new createjs.fParticle(this);
			
			// If image exists. Let's load it in
			if(this.image_asset !== null){p.image = this.image_asset;}
			
			// Get the particle's life
			p.lifetime = createjs.fParticleSystem.toRandom(this.pLife);

			// Get the particle's position
			if(this.psysPositionOffsetRadius !== null){									// If radius exists, use that
				// Circle position
				
				radius = createjs.fParticleSystem.toRandom(this.psysPositionOffsetRadius);
				
				deg = Math.random()*(Math.PI*2); 								// Get a random 360 degree
				p.position = {														// Output
					x: this.psysPosition.x+radius*Math.cos(deg),
					y: this.psysPosition.y+radius*Math.sin(deg)
				};
				
			}
			else{																	// No radius, use a box
				x = createjs.fParticleSystem.toRandom(this.psysPositionOffsetX);
				y = createjs.fParticleSystem.toRandom(this.psysPositionOffsetY);
				p.position = { x: this.psysPosition.x + x, y: this.psysPosition.y + y };
			}
			
			
			// Diameter/Scale of particle
			p.startRadius = createjs.fParticleSystem.toRandom(this.pStartRadius);
			p.endRadius = createjs.fParticleSystem.toRandom(this.pEndRadius);

			// Veolicity
			p.velocity = { 
				x: createjs.fParticleSystem.toRandom(this.pVelocityX),
				y: createjs.fParticleSystem.toRandom(this.pVelocityY)
			};
			
			// Just input these directly
			p.gravity = this.pGravity;
			p.turbulence = this.pTurbulence;
			p.rotation = createjs.fParticleSystem.toRandom(this.pRotation);
			p.spin = createjs.fParticleSystem.toRandom(this.pSpin);
			p.vortex = createjs.fParticleSystem.toRandom(this.pVortex);
			
			
			// Go through the colors
			if(typeof this.pStartColor === "function")p.startColor = this.pStartColor(p);
			else if(!this.pStartColor.hasOwnProperty("min"))p.startColor = this.pStartColor;
			else p.startColor = createjs.RGBA.randBetween(this.pStartColor.min, this.pStartColor.max);
			
			if(this.pEndColor === null){p.endColor = p.pEndColor.clone();}
			else if(typeof this.pEndColor === "function")p.endColor = this.pEndColor(p);
			else if(!this.pEndColor.hasOwnProperty("min"))p.endColor = this.pEndColor;
			else p.endColor = createjs.RGBA.randBetween(this.pEndColor.min, this.pEndColor.max);
			
			
			
			this.particles.push(p);
		}

	};
	
	if(config === undefined){config = {};}
	this.loadConfig(config);
	

}

// Inputs a {min:x, max:y} object or a number and returns a number
createjs.fParticleSystem.toRandom = function(input){							
	if(!isNaN(input)){return Number(input);}
	var min = 0, max = 0;
	if(input.hasOwnProperty("min")){min = input.min;}
	if(input.hasOwnProperty("max")){max = input.max;}
	return createjs.RGBA.rand(min, max);
};

 





