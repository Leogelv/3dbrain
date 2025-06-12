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
		
		// Detect mobile device
		this.isMobile = window.innerWidth <= 768;

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
		this.camera.position.z = this.isMobile ? 400 : 300;

		// renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));

		document.querySelector('.container').appendChild(this.renderer.domElement);

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
		this.camera.updateProjectionMatrix();

		this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		
		// Update mobile detection on resize
		this.isMobile = window.innerWidth <= 768;
		this.camera.position.z = this.isMobile ? 400 : 300;

		if (this.interactive) this.interactive.resize();
		if (this.particles) this.particles.resize();
	}
}
