import ready from 'domready';
import CoinsApp from './CoinsApp';

ready(async () => {
	// Show loading indicator
	const loadingDiv = document.createElement('div');
	loadingDiv.className = 'loading';
	loadingDiv.textContent = 'Loading coins...';
	document.body.appendChild(loadingDiv);

	try {
		// Initialize coins app
		window.coinsApp = new CoinsApp();
		await window.coinsApp.init();
		
		// Remove loading indicator
		document.body.removeChild(loadingDiv);
		
		console.log('3D Coins animation initialized successfully');
	} catch (error) {
		console.error('Error initializing coins app:', error);
		loadingDiv.textContent = 'Error loading coins. Please refresh the page.';
		loadingDiv.style.color = '#ff6b6b';
	}
}); 