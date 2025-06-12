import 'three';
import { TweenLite } from 'gsap/TweenMax';

import InteractiveControls from './controls/InteractiveControls';
import Particles from './particles/Particles';

const glslify = require('glslify');

export default class WebGLView {

	constructor(app) {
		this.app = app;

		// Only use the brain image
		this.brainImage = 'images/sample-01.png';

		this.initThree();
		this.initParticles();
		this.initControls();

		// Initialize with the brain image
		this.initBrain();
	}

	initThree() {
		// scene
		this.scene = new THREE.Scene();

		// camera
		this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.z = 300;

		// renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // clock
		this.clock = new THREE.Clock(true);
	}

	initControls() {
		this.interactive = new InteractiveControls(this.camera, this.renderer.domElement);
	}

	initParticles() {
		this.particles = new Particles(this);
		this.scene.add(this.particles.container);
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		const delta = this.clock.getDelta();

		if (this.particles) this.particles.update(delta);
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}

	initBrain() {
		// Initialize with the brain image
		this.particles.init(this.brainImage);
	}

	// Remove the next() function as we don't need image switching
	// Keeping the method empty in case it's called from elsewhere
	next() {
		// Do nothing - we only have one image
	}

	// ---------------------------------------------------------------------------------------------
	// EVENT HANDLERS
	// ---------------------------------------------------------------------------------------------

	resize() {
		if (!this.renderer) return;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		
		// Adjust camera position based on screen size for mobile
		const isMobile = window.innerWidth <= 768;
		const isSmallMobile = window.innerWidth <= 480;
		
		if (isSmallMobile) {
			this.camera.position.z = 330; // Further = smaller brain (1.65x smaller)
		} else if (isMobile) {
			this.camera.position.z = 360; // Further for tablet
		} else {
			this.camera.position.z = 300; // Default desktop
		}
		
		this.camera.updateProjectionMatrix();

		this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		if (this.interactive) this.interactive.resize();
		if (this.particles) this.particles.resize();
	}
}
