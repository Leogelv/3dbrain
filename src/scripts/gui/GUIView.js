import ControlKit from '@brunoimbrizi/controlkit';
import Stats from 'stats.js';

export default class GUIView {

	constructor(app) {
		this.app = app;

		this.particlesHitArea = false;
		this.particlesRandom = 2;
		this.particlesDepth = 4;
		this.particlesSize = 1.5;
		
		this.touchRadius = 0.15;

		this.range = [0, 1];
		this.rangeRandom = [1, 10];
		this.rangeSize = [0, 3];
		this.rangeDepth = [1, 10];
		this.rangeRadius = [0, 0.5];

		this.showPanel = false;

		this.initControlKit();
		// this.initStats();

		// Initially hide the panel
		this.disable();
		this.initToggle();
	}

	initControlKit() {
		this.controlKit = new ControlKit();
		this.controlKit.addPanel({ width: 300, enable: false })

		.addGroup({label: 'Touch', enable: true })
		.addCanvas({ label: 'trail', height: 64 })
		.addSlider(this, 'touchRadius', 'rangeRadius', { label: 'radius', onChange: this.onTouchRadiusChange.bind(this) })
		
		.addGroup({label: 'Particles', enable: true })
		// .addCheckbox(this, 'particlesHitArea', { label: 'hit area', onChange: this.onParticlesChange.bind(this) })
		.addSlider(this, 'particlesRandom', 'rangeRandom', { label: 'random', onChange: this.onParticlesRandomChange.bind(this) })
		.addSlider(this, 'particlesDepth', 'rangeDepth', { label: 'depth', onChange: this.onParticlesDepthChange.bind(this) })
		.addSlider(this, 'particlesSize', 'rangeSize', { label: 'size', onChange: this.onParticlesSizeChange.bind(this) })

		// store reference to canvas
		const component = this.controlKit.getComponentBy({ label: 'trail' });
		if (!component) return;

		this.touchCanvas = component._canvas;
		this.touchCtx = this.touchCanvas.getContext('2d');
	}

	initToggle() {
		// Create arrow toggle
		const toggle = document.createElement('div');
		toggle.className = 'gui-arrow-toggle';
		toggle.innerHTML = '<div class="arrow">▶</div>';
		document.body.appendChild(toggle);

		toggle.addEventListener('click', () => {
			this.showPanel = !this.showPanel;
			const arrow = toggle.querySelector('.arrow');
			
			if (this.showPanel) {
				this.enable();
				arrow.style.transform = 'rotate(180deg)';
			} else {
				this.disable();
				arrow.style.transform = 'rotate(0deg)';
			}
		});
	}

	initStats() {
		this.stats = new Stats();

		this.stats.showPanel(0);
		document.body.appendChild(this.stats.dom);
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		if (this.stats) this.stats.update();

		// draw touch texture
		if (this.touchCanvas && this.touchCtx) {
			if (!this.app.webgl) return;
			if (!this.app.webgl.particles) return;
			if (!this.app.webgl.particles.touch) return;
			const source = this.app.webgl.particles.touch.canvas;
			const x = Math.floor((this.touchCanvas.width - source.width) * 0.5);
			this.touchCtx.fillRect(0, 0, this.touchCanvas.width, this.touchCanvas.height);
			this.touchCtx.drawImage(source, x, 0);
		}
	}

	enable() {
		this.controlKit.enable();
		if (this.stats) this.stats.dom.style.display = '';
	}

	disable() {
		this.controlKit.disable();
		if (this.stats) this.stats.dom.style.display = 'none';
	}

	toggle() {
		if (this.controlKit._enabled) this.disable();
		else this.enable();
	}

	onTouchRadiusChange() {
		if (this.app.webgl) this.app.webgl.particles.touch.radius = this.touchRadius;
	}

	onParticlesRandomChange() {
		if (this.app.webgl) this.app.webgl.particles.object3D.material.uniforms.uRandom.value = this.particlesRandom;
	}

	onParticlesDepthChange() {
		if (this.app.webgl) this.app.webgl.particles.object3D.material.uniforms.uDepth.value = this.particlesDepth;
	}

	onParticlesSizeChange() {
		if (this.app.webgl) this.app.webgl.particles.object3D.material.uniforms.uSize.value = this.particlesSize;
	}

	setTouchCanvas(canvas) {
		this.touchCanvas = canvas;
		this.controlKit._panels[0]._groups[0]._components[0].setCanvas(canvas);
	}
}
