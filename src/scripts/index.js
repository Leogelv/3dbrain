import ready from 'domready';

import App from './App';

ready(() => {
	window.app = new App();
	window.app.init();
	
	// Typewriter effect for brain text
	setTimeout(() => {
		const typewriterElement = document.getElementById('typewriter');
		if (typewriterElement && window.Typewriter) {
			// Clear the initial text
			typewriterElement.innerHTML = '';
			
			const typewriter = new window.Typewriter(typewriterElement, {
				loop: false,
				delay: 75,
				cursor: '|'
			});
			
			typewriter
				.typeString('Brain Programming')
				.pauseFor(200)
				.typeString('<br>')
				.typeString('Activated')
				.pauseFor(500)
				.callFunction(() => {
					// Remove cursor after animation
					const cursor = typewriterElement.querySelector('.Typewriter__cursor');
					if (cursor) cursor.style.display = 'none';
				})
				.start();
		}
	}, 1000);
});
