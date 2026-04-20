const fs = require('fs');
let code = fs.readFileSync('js/app-enhanced.js', 'utf8');

if (!code.includes('Native Swipe Support')) {
    code += `

// Native Swipe Support for Mobile Carousels
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    const track = e.target.closest('.ig-media-track');
    if (!track) return;
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

document.addEventListener('touchend', e => {
    const track = e.target.closest('.ig-media-track');
    if (!track) return;
    touchEndX = e.changedTouches[0].screenX;
    
    // Calculate distance and determine direction
    const distance = touchStartX - touchEndX;
    const isSwipe = Math.abs(distance) > 40; // Minimum swipe threshold
    
    if (isSwipe) {
        const postId = track.id.replace('track-', '');
        if (distance > 0) {
            // Swipe Left (Next)
            if (window.moveCarousel) window.moveCarousel(postId, 1);
        } else {
            // Swipe Right (Prev)
            if (window.moveCarousel) window.moveCarousel(postId, -1);
        }
    }
}, {passive: true});
`;
    fs.writeFileSync('js/app-enhanced.js', code);
    console.log('Swipe patch applied.');
} else {
    console.log('Swipe patch already present.');
}
