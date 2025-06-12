import ready from 'domready';

import App from './App';

ready(() => {
	window.app = new App();
	window.app.init();
	
	// Start "ACTIVATED" animation after a short delay
	setTimeout(() => {
		const activatedElement = document.querySelector('.activated-animation');
		if (activatedElement) {
			activatedElement.style.display = 'block';
		}
	}, 1000);
});
