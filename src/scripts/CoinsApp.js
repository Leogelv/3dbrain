import * as THREE from 'three';

export default class CoinsApp {
	constructor() {
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.coins = [];
		this.dnaTexture = null;
		this.mouse = new THREE.Vector2();
		this.raycaster = new THREE.Raycaster();
		
		// Animation parameters
		this.time = 0;
		this.animationSpeed = 0.01;
		
		// Boundary constraints (STRICT 500px height limit)
		this.boundarySize = 300; // 600px / 2 for radius
		this.worldBoundary = 10; // Expanded world units for full width distribution
		this.depthBoundary = 3; // Z-axis limits (front/back) - reduced
		this.verticalBoundary = 4; // Y-axis limits (up/down) - STRICT for 500px
		this.verticalOffset = 1; // Reduced offset for tight bounds
		
		// Explosion effect
		this.explosionActive = false;
		this.explosionTime = 0;
		this.explosionDuration = 3; // seconds to return to normal
		
		// Collision detection
		this.coinRadius = 1; // For collision detection
	}

	async init() {
		this.initScene();
		this.initCamera();
		this.initRenderer();
		this.initLights();
		
		this.createDNATexture();
		this.createCoins();
		this.addEventListeners();
		this.animate();
		this.resize();
	}

	initScene() {
		this.scene = new THREE.Scene();
		// Transparent background to show CSS gradient
		this.scene.background = null;
		
		// Add subtle fog for depth
		this.scene.fog = new THREE.Fog(0xe8e5ff, 15, 40);
	}

	initCamera() {
		// Mobile first camera setup
		const isMobile = window.innerWidth <= 768;
		const fov = isMobile ? 85 : 75;
		const cameraDistance = isMobile ? 8 : 10; // Much closer camera for bigger coins
		
		this.camera = new THREE.PerspectiveCamera(
			fov,
			window.innerWidth / 500, // STRICT 500px height aspect ratio
			0.1,
			1000
		);
		this.camera.position.z = cameraDistance;
		this.camera.position.y = isMobile ? 3 : 2; // Raised camera position
	}

	initRenderer() {
		this.renderer = new THREE.WebGLRenderer({ 
			antialias: true,
			alpha: true 
		});
		
		// Strictly limited to 500px height
		const width = window.innerWidth;
		const height = 500; // STRICT 500px limit
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0x000000, 0); // Transparent background
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		
		document.querySelector('.coins-container').appendChild(this.renderer.domElement);
	}

	initLights() {
		// Ambient light - softer for the light background
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		// Main directional light - softer
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 1024;
		directionalLight.shadow.mapSize.height = 1024;
		this.scene.add(directionalLight);

		// Point lights in purple-blue theme
		const pointLight1 = new THREE.PointLight(0x8b5cf6, 0.3, 25);
		pointLight1.position.set(-8, 3, 8);
		this.scene.add(pointLight1);

		const pointLight2 = new THREE.PointLight(0x3b82f6, 0.3, 25);
		pointLight2.position.set(8, -3, 8);
		this.scene.add(pointLight2);
	}

	createDNATexture() {
		// Create canvas for DNA icon
		const canvas = document.createElement('canvas');
		const size = 1024; // Higher resolution for better quality
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		
		// Create proper circular gradient like in the example
		const centerX = size / 2;
		const centerY = size / 2;
		const radius = size / 2;
		
		// Main gradient - from light center to darker edges
		const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
		bgGradient.addColorStop(0, '#e8e5ff'); // Very light purple center
		bgGradient.addColorStop(0.3, '#d8d3ff'); 
		bgGradient.addColorStop(0.6, '#c7bfff');
		bgGradient.addColorStop(0.8, '#b5a9ff');
		bgGradient.addColorStop(1, '#9f8fff'); // Darker purple edge
		
		// Create circular clipping path
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();
		
		// Fill with gradient
		ctx.fillStyle = bgGradient;
		ctx.fillRect(0, 0, size, size);
		
		// Add inner shadow for depth
		ctx.save();
		ctx.globalCompositeOperation = 'multiply';
		const innerShadow = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius);
		innerShadow.addColorStop(0, 'rgba(255, 255, 255, 1)');
		innerShadow.addColorStop(0.7, 'rgba(220, 210, 255, 1)');
		innerShadow.addColorStop(1, 'rgba(139, 92, 246, 0.4)');
		ctx.fillStyle = innerShadow;
		ctx.fillRect(0, 0, size, size);
		ctx.restore();
		
		// Draw embossed DNA icon
		const iconScale = 0.8; // Larger icon (doubled from 0.4)
		const dnaSize = size * iconScale;
		
		// Shadow for embossed effect
		ctx.save();
		ctx.translate(centerX + 3, centerY + 3);
		ctx.scale(dnaSize / 24, dnaSize / 24);
		ctx.globalAlpha = 0.2;
		ctx.fillStyle = '#6b46c1';
		this.drawDNAPath(ctx, true);
		ctx.restore();
		
		// Main DNA shape with gradient
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.scale(dnaSize / 24, dnaSize / 24);
		
		// Create gradient for DNA
		const dnaGradient = ctx.createLinearGradient(-12, -12, 12, 12);
		dnaGradient.addColorStop(0, '#a78bfa');
		dnaGradient.addColorStop(0.5, '#8b5cf6');
		dnaGradient.addColorStop(1, '#7c3aed');
		
		ctx.fillStyle = dnaGradient;
		this.drawDNAPath(ctx, true);
		
		// Highlight for embossed effect
		ctx.globalCompositeOperation = 'screen';
		ctx.globalAlpha = 0.4;
		ctx.translate(-1, -1);
		ctx.fillStyle = '#ffffff';
		this.drawDNAPath(ctx, true);
		ctx.restore();
		
		// Add overall highlight
		ctx.save();
		ctx.globalCompositeOperation = 'screen';
		ctx.globalAlpha = 0.15;
		const highlight = ctx.createRadialGradient(centerX - radius/3, centerY - radius/3, 0, centerX, centerY, radius);
		highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
		highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
		highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
		ctx.fillStyle = highlight;
		ctx.fillRect(0, 0, size, size);
		ctx.restore();
		
		// Create texture from canvas
		this.dnaTexture = new THREE.CanvasTexture(canvas);
		this.dnaTexture.wrapS = THREE.ClampToEdgeWrapping;
		this.dnaTexture.wrapT = THREE.ClampToEdgeWrapping;
		this.dnaTexture.minFilter = THREE.LinearFilter;
		this.dnaTexture.magFilter = THREE.LinearFilter;
		this.dnaTexture.needsUpdate = true;
	}
	
	drawDNAPath(ctx, fill = false) {
		// Use the exact SVG path from healthicons:dna-outline
		const svgPath = "M35 9.23V6h-2v3H15V6h-2v3.23a16.91 16.91 0 0 0 6.804 13.558a19 19 0 0 1 1.95-1.077A14.9 14.9 0 0 1 17.185 17h13.63A14.9 14.9 0 0 1 24 22.917l-.016.007q-.177.075-.355.148q-1.014.406-1.951.928a16.91 16.91 0 0 0-8.586 13H13v5h2v-3h18v3h2v-5h-.093a16.92 16.92 0 0 0-6.71-11.788a19 19 0 0 1-1.95 1.077A14.9 14.9 0 0 1 30.814 31h-13.63A14.9 14.9 0 0 1 24 25.083l.016-.007q.177-.075.355-.148A16.91 16.91 0 0 0 35 9.23M31.839 33H16.162a15 15 0 0 0-1.057 4h17.79a15 15 0 0 0-1.057-4M16.162 15h15.677c.53-1.264.89-2.608 1.056-4h-17.79a15 15 0 0 0 1.056 4";
		
		// Scale and center
		ctx.save();
		ctx.scale(0.5, 0.5);
		ctx.translate(-24, -24);
		
		// Create Path2D from SVG path string
		const path = new Path2D(svgPath);
		
		if (fill) {
			ctx.fill(path);
		} else {
			ctx.stroke(path);
		}
		
		ctx.restore();
	}

	createEmbossedDNATexture(baseColor) {
		// Create diffuse map (color)
		const diffuseCanvas = document.createElement('canvas');
		diffuseCanvas.width = 512;
		diffuseCanvas.height = 512;
		const diffuseCtx = diffuseCanvas.getContext('2d');
		
		// Create normal map (for embossing)
		const normalCanvas = document.createElement('canvas');
		normalCanvas.width = 512;
		normalCanvas.height = 512;
		const normalCtx = normalCanvas.getContext('2d');
		
		// Clear diffuse canvas with base color
		const color = new THREE.Color(baseColor);
		diffuseCtx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
		diffuseCtx.fillRect(0, 0, diffuseCanvas.width, diffuseCanvas.height);
		
		// Clear normal map with neutral normal (pointing up)
		normalCtx.fillStyle = '#8080ff'; // Neutral normal
		normalCtx.fillRect(0, 0, normalCanvas.width, normalCanvas.height);
		
		// Draw embossed DNA on diffuse map
		const darkerColor = color.clone().multiplyScalar(0.5);
		const lighterColor = color.clone().multiplyScalar(1.5);
		
		diffuseCtx.save();
		diffuseCtx.translate(diffuseCanvas.width / 2, diffuseCanvas.height / 2);
		diffuseCtx.scale(16, 16); // 2x larger DNA icon (was 8, now 16)
		
		// Draw shadow (embossed effect)
		diffuseCtx.fillStyle = `rgb(${darkerColor.r * 255}, ${darkerColor.g * 255}, ${darkerColor.b * 255})`;
		diffuseCtx.translate(1, 1); // Shadow offset
		this.drawDNAPath(diffuseCtx, true);
		
		// Draw highlight
		diffuseCtx.translate(-2, -2); // Move to highlight position
		diffuseCtx.fillStyle = `rgb(${lighterColor.r * 255}, ${lighterColor.g * 255}, ${lighterColor.b * 255})`;
		this.drawDNAPath(diffuseCtx, true);
		
		// Draw main DNA
		diffuseCtx.translate(1, 1); // Center position
		diffuseCtx.fillStyle = `rgb(${color.r * 200}, ${color.g * 200}, ${color.b * 200})`;
		this.drawDNAPath(diffuseCtx, true);
		
		diffuseCtx.restore();
		
		// Create normal map for embossing
		normalCtx.save();
		normalCtx.translate(normalCanvas.width / 2, normalCanvas.height / 2);
		normalCtx.scale(16, 16); // 2x larger DNA icon (was 8, now 16)
		
		// Draw raised areas in normal map (lighter = raised)
		normalCtx.fillStyle = '#c0c0ff'; // Raised normal
		this.drawDNAPath(normalCtx, true);
		
		normalCtx.restore();
		
		// Create textures
		const diffuseTexture = new THREE.CanvasTexture(diffuseCanvas);
		const normalTexture = new THREE.CanvasTexture(normalCanvas);
		
		diffuseTexture.needsUpdate = true;
		normalTexture.needsUpdate = true;
		diffuseTexture.flipY = false;
		normalTexture.flipY = false;
		
		return {
			diffuse: diffuseTexture,
			normal: normalTexture
		};
	}

	createCoins() {
		// Mobile first - fewer coins on mobile
		const isMobile = window.innerWidth <= 768;
		const coinCount = isMobile ? 15 : 20;
		
		for (let i = 0; i < coinCount; i++) {
			const coin = this.createCoin(i, coinCount);
			this.coins.push(coin);
			this.scene.add(coin.group);
		}
	}

	createCoin(index, totalCoins) {
		// Mobile responsive coin size
		const isMobile = window.innerWidth <= 768;
		const coinRadius = isMobile ? 0.8 : 1;
		const coinThickness = 0.2;
		
		// Create group for coin
		const coinGroup = new THREE.Group();
		
		// Create main coin body with rounded edges
		const coinGeometry = new THREE.CylinderGeometry(
			coinRadius, 
			coinRadius, 
			coinThickness, 
			64, // High segment count for smooth curves
			4,  // Height segments for rounding
			false
		);
		
		// Apply rounded edge effect only if position attribute exists
		if (coinGeometry.attributes && coinGeometry.attributes.position) {
			const positions = coinGeometry.attributes.position;
			for (let i = 0; i < positions.count; i++) {
				const x = positions.getX(i);
				const y = positions.getY(i);
				const z = positions.getZ(i);
				
				// Round the top and bottom edges
				if (Math.abs(y) > coinThickness * 0.3) {
					const edgeRadius = coinThickness * 0.3;
					const distance = Math.sqrt(x * x + z * z);
					if (distance > coinRadius - edgeRadius) {
						// Apply smooth rounding to edges
						const factor = Math.cos((Math.PI / 2) * (distance - (coinRadius - edgeRadius)) / edgeRadius);
						positions.setY(i, y * Math.max(0.1, factor));
					}
				}
			}
			positions.needsUpdate = true;
			coinGeometry.computeVertexNormals();
		}
		
		// Rotate to face up
		coinGeometry.rotateX(Math.PI / 2);
		
		// Pastel color palette
		const pastelColors = [
			0xCDCBF8, // Light purple
			0xE5EFFA, // Light blue
			0xC4CFF2, // Medium blue-purple
			0xD8D4F9, // Variation 1
			0xF0F6FB, // Variation 2
			0xB8C7F0, // Variation 3
			0xE1DCF9, // Variation 4
			0xDDE8F8  // Variation 5
		];
		
		const baseColor = pastelColors[index % pastelColors.length];
		
		// Main coin material - soft pastel colors
		const coinMaterial = new THREE.MeshStandardMaterial({
			color: baseColor,
			metalness: 0.1,
			roughness: 0.3,
			emissive: baseColor,
			emissiveIntensity: 0.02
		});
		
		const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
		coinGroup.add(coinMesh);
		
		// Create face geometry (slightly raised circle for the coin face)
		const faceGeometry = new THREE.CircleGeometry(coinRadius * 0.95, 64);
		
		// Create embossed DNA texture for this coin
		const embossedTexture = this.createEmbossedDNATexture(baseColor);
		
		// Front face with embossed DNA texture
		const frontFaceMaterial = new THREE.MeshStandardMaterial({
			map: embossedTexture.diffuse,
			normalMap: embossedTexture.normal,
			color: new THREE.Color(baseColor).multiplyScalar(1.1),
			metalness: 0.05,
			roughness: 0.4,
			normalScale: new THREE.Vector2(0.3, 0.3) // Subtle embossing
		});
		
		const frontFace = new THREE.Mesh(faceGeometry, frontFaceMaterial);
		frontFace.position.z = coinThickness / 2 + 0.001;
		coinGroup.add(frontFace);
		
		// Back face with DNA texture
		const backFace = new THREE.Mesh(faceGeometry, frontFaceMaterial);
		backFace.position.z = -coinThickness / 2 - 0.001;
		backFace.rotation.y = Math.PI;
		coinGroup.add(backFace);
		
		// Create subtle edge highlight (optional - for extra definition)
		const edgeGeometry = new THREE.TorusGeometry(
			coinRadius * 0.98, // Slightly smaller radius
			coinThickness * 0.1, // Very thin torus
			8, 
			64
		);
		
		const edgeColor = new THREE.Color(baseColor).multiplyScalar(1.2); // Lighter version for highlight
		const edgeMaterial = new THREE.MeshStandardMaterial({
			color: edgeColor,
			metalness: 0.05,
			roughness: 0.2,
			transparent: true,
			opacity: 0.6
		});
		
		const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
		// No rotation needed - coin is already rotated
		coinGroup.add(edge);
		
		// Position coins across full width with better distribution
		const layers = 3; // Number of depth layers
		const coinsPerLayer = Math.ceil(totalCoins / layers);
		const currentLayer = Math.floor(index / coinsPerLayer);
		const indexInLayer = index % coinsPerLayer;
		
		// STRICT distribution within 500px height bounds
		if (index % 3 === 0) {
			// Grid-like distribution for some coins - STRICT bounds
			const gridCols = Math.ceil(Math.sqrt(coinsPerLayer));
			const col = indexInLayer % gridCols;
			const row = Math.floor(indexInLayer / gridCols);
			const x = (col / (gridCols - 1) - 0.5) * this.worldBoundary * 1.8 + (Math.random() - 0.5) * 1;
			const y = (row / Math.max(1, Math.ceil(coinsPerLayer / gridCols) - 1) - 0.5) * this.verticalBoundary * 0.8 + this.verticalOffset; // STRICT vertical
			const z = (currentLayer - 1) * (this.depthBoundary / layers) + (Math.random() - 0.5) * 1;
			coinGroup.position.set(x, y, z);
		} else {
			// Circular distribution for other coins - STRICT bounds
			const angle = (indexInLayer / coinsPerLayer) * Math.PI * 2 + (currentLayer * 0.5);
			const radius = Math.random() * this.worldBoundary * 0.8 + this.worldBoundary * 0.3;
			
			const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1;
			const y = Math.sin(angle) * radius * 0.3 + (Math.random() - 0.5) * 1 + this.verticalOffset; // STRICT vertical - very flat
			const z = (currentLayer - 1) * (this.depthBoundary / layers) + (Math.random() - 0.5) * 1;
			coinGroup.position.set(x, y, z);
		}
		
		// Random rotation with more variation
		coinGroup.rotation.set(
			(Math.random() - 0.5) * Math.PI * 0.4, // More random tilt
			Math.random() * Math.PI * 2, // Full rotation
			(Math.random() - 0.5) * Math.PI * 0.4 // More random tilt
		);

		// Animation properties - slower, more subtle
		const coinData = {
			group: coinGroup,
			mesh: coinMesh,
			initialPosition: coinGroup.position.clone(),
			rotationSpeed: {
				x: (Math.random() - 0.5) * 0.005, // Even slower rotation
				y: (Math.random() - 0.5) * 0.01,
				z: (Math.random() - 0.5) * 0.005
			},
			baseRotationSpeed: {
				x: (Math.random() - 0.5) * 0.005,
				y: (Math.random() - 0.5) * 0.01,
				z: (Math.random() - 0.5) * 0.005
			},
			floatSpeed: Math.random() * 0.01 + 0.005,
			floatAmplitude: Math.random() * 0.5 + 0.2, // Reduced amplitude
			depthSpeed: Math.random() * 0.008 + 0.003, // Slower depth movement
			depthAmplitude: Math.random() * 2 + 1, // Much smaller depth movement
			phase: Math.random() * Math.PI * 2,
			forwardPhase: (index / totalCoins) * Math.PI * 2, // Staggered forward movement
			velocity: new THREE.Vector3(0, 0, 0), // For explosion effect
			explosionDirection: new THREE.Vector3(
				(Math.random() - 0.5) * 2,
				(Math.random() - 0.5) * 2,
				(Math.random() - 0.5) * 1
			).normalize()
		};

		return coinData;
	}

	addEventListeners() {
		window.addEventListener('resize', this.resize.bind(this));
		window.addEventListener('mousemove', this.onMouseMove.bind(this));
		
		// Click/tap handler for explosion effect
		const handleClick = () => {
			this.explosionActive = true;
			this.explosionTime = 0;
			
			// Apply initial explosion force
			this.coins.forEach(coin => {
				const force = 3 + Math.random() * 2;
				coin.velocity.copy(coin.explosionDirection).multiplyScalar(force);
				
				// Increase rotation speed
				coin.rotationSpeed.x = coin.baseRotationSpeed.x * 5;
				coin.rotationSpeed.y = coin.baseRotationSpeed.y * 5;
				coin.rotationSpeed.z = coin.baseRotationSpeed.z * 5;
			});
		};
		
		window.addEventListener('click', handleClick);
		window.addEventListener('touchstart', handleClick);
	}

	onMouseMove(event) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	checkCoinCollisions() {
		const minDistance = this.coinRadius * 2.2; // Minimum distance between coin centers
		
		for (let i = 0; i < this.coins.length; i++) {
			for (let j = i + 1; j < this.coins.length; j++) {
				const coin1 = this.coins[i];
				const coin2 = this.coins[j];
				
				const dx = coin1.group.position.x - coin2.group.position.x;
				const dy = coin1.group.position.y - coin2.group.position.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < minDistance && distance > 0) {
					// Calculate collision response
					const overlap = minDistance - distance;
					const separationX = (dx / distance) * overlap * 0.5;
					const separationY = (dy / distance) * overlap * 0.5;
					
					// Move coins apart
					coin1.group.position.x += separationX;
					coin1.group.position.y += separationY;
					coin2.group.position.x -= separationX;
					coin2.group.position.y -= separationY;
					
					// If explosion is active, affect velocities
					if (this.explosionActive) {
						const velocityTransfer = 0.1;
						coin1.velocity.x += separationX * velocityTransfer;
						coin1.velocity.y += separationY * velocityTransfer;
						coin2.velocity.x -= separationX * velocityTransfer;
						coin2.velocity.y -= separationY * velocityTransfer;
					}
				}
			}
		}
	}

	update() {
		this.time += this.animationSpeed;
		
		// Update explosion effect
		if (this.explosionActive) {
			this.explosionTime += 0.016; // ~60fps
			const progress = Math.min(this.explosionTime / this.explosionDuration, 1);
			const damping = 1 - progress;
		}
		
		// Check collisions between coins
		this.checkCoinCollisions();
		
		// Update coins
		this.coins.forEach((coinData, index) => {
			const { group, rotationSpeed, floatSpeed, floatAmplitude, 
					depthSpeed, depthAmplitude, phase, initialPosition, forwardPhase, velocity } = coinData;
			
			// Apply explosion velocity
			if (this.explosionActive) {
				const progress = Math.min(this.explosionTime / this.explosionDuration, 1);
				const damping = 1 - progress;
				
				// Update position with velocity
				group.position.x += velocity.x * 0.016;
				group.position.y += velocity.y * 0.016;
				group.position.z += velocity.z * 0.016;
				
				// Apply damping
				velocity.multiplyScalar(0.98);
				
				// Gradually return rotation speed to normal
				const lerpFactor = progress * 0.02;
				coinData.rotationSpeed.x += (coinData.baseRotationSpeed.x - coinData.rotationSpeed.x) * lerpFactor;
				coinData.rotationSpeed.y += (coinData.baseRotationSpeed.y - coinData.rotationSpeed.y) * lerpFactor;
				coinData.rotationSpeed.z += (coinData.baseRotationSpeed.z - coinData.rotationSpeed.z) * lerpFactor;
				
				// End explosion when complete
				if (progress >= 1) {
					this.explosionActive = false;
				}
			}
			
			// Boundary checking - keep coins within all boundaries
			
			// Horizontal boundaries (X and Y)
			const position2D = new THREE.Vector2(group.position.x, group.position.y);
			const distance = position2D.length();
			
			if (distance > this.worldBoundary) {
				// Bounce back from horizontal boundary
				position2D.normalize().multiplyScalar(this.worldBoundary);
				group.position.x = position2D.x;
				group.position.y = position2D.y;
				
				// Reverse velocity if exploding
				if (this.explosionActive) {
					const normal = position2D.normalize();
					const dot = velocity.dot(new THREE.Vector3(normal.x, normal.y, 0));
					velocity.sub(new THREE.Vector3(normal.x * dot * 2, normal.y * dot * 2, 0));
				}
			}
			
			// STRICT Vertical boundaries (Y axis - top/bottom) for 500px height
			const adjustedY = group.position.y - this.verticalOffset;
			if (Math.abs(adjustedY) > this.verticalBoundary) {
				group.position.y = Math.sign(adjustedY) * this.verticalBoundary + this.verticalOffset;
				if (this.explosionActive) {
					velocity.y *= -0.9; // Stronger bounce for strict bounds
				}
			}
			
			// Depth boundaries (Z axis - front/back)
			if (Math.abs(group.position.z) > this.depthBoundary) {
				group.position.z = Math.sign(group.position.z) * this.depthBoundary;
				if (this.explosionActive) {
					velocity.z *= -0.8; // Bounce with damping
				}
			}
			
			// Subtle rotation animation
			group.rotation.x += rotationSpeed.x;
			group.rotation.y += rotationSpeed.y;
			group.rotation.z += rotationSpeed.z;
			
			// Only apply floating animations when not exploding
			if (!this.explosionActive || this.explosionTime > 1) {
				// STRICT floating animation - very constrained for 500px height
				const floatOffset = Math.sin(this.time * floatSpeed + phase) * floatAmplitude * 0.5; // Reduced amplitude
				const minY = -this.verticalBoundary + 0.5 + this.verticalOffset; // Tighter bounds
				const maxY = this.verticalBoundary - 0.5 + this.verticalOffset; // Tighter bounds
				const targetY = Math.max(minY, Math.min(maxY, initialPosition.y + floatOffset));
				group.position.y += (targetY - group.position.y) * 0.02;
				
				// Staggered forward/backward movement - constrained to depth boundaries
				const forwardOffset = Math.sin(this.time * 0.3 + forwardPhase) * depthAmplitude;
				const targetZ = Math.max(-this.depthBoundary + 1, Math.min(this.depthBoundary - 1, initialPosition.z + forwardOffset));
				group.position.z += (targetZ - group.position.z) * 0.02;
				
				// Very subtle horizontal drift - constrained to world boundaries
				const driftOffset = Math.cos(this.time * 0.003 + phase) * 0.2;
				const targetX = initialPosition.x + driftOffset;
				const maxDistance = this.worldBoundary - 1;
				const currentDistance = Math.sqrt(targetX * targetX + group.position.y * group.position.y);
				
				if (currentDistance <= maxDistance) {
					group.position.x += (targetX - group.position.x) * 0.02;
				}
			}
		});
		
		// Gentle camera movement based on mouse (mobile-friendly)
		const mouseInfluence = window.innerWidth <= 768 ? 0.5 : 1;
		this.camera.position.x += (this.mouse.x * mouseInfluence - this.camera.position.x) * 0.01;
		this.camera.position.y += (this.mouse.y * mouseInfluence - this.camera.position.y) * 0.01;
		this.camera.lookAt(this.scene.position);
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}

	animate() {
		this.update();
		this.draw();
		requestAnimationFrame(this.animate.bind(this));
	}

	resize() {
		// Strictly limited resize - 500px height max
		const width = window.innerWidth;
		const height = 500; // STRICT 500px limit
		
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	}
} 