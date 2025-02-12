
const sliderContainer = document.querySelector('.slider-container');
const slider = document.querySelector('.slider');
const slides = document.querySelectorAll('.slider section');

let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let currentIndex = 0;
let velocity = 0;
let lastTime = 0;
let lastPos = 0;

const slideWidth = sliderContainer.clientWidth;

// Set widths so that each slide takes 100% of the container.
slider.style.width = `${slides.length * 100}%`;
slides.forEach(slide => {
    slide.style.width = `${100 / slides.length}%`;
});

// Get X position (works for both touch and mouse events)
function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function touchStart(event) {
    isDragging = true;
    startPos = getPositionX(event);
    prevTranslate = currentTranslate;
    lastPos = startPos;
    lastTime = Date.now();
    slider.style.transition = 'none';
    event.preventDefault();
}

function touchMove(event) {
    if (!isDragging) return;
    const currentPosition = getPositionX(event);
    const diff = currentPosition - startPos;
    currentTranslate = prevTranslate + diff;
    slider.style.transform = `translateX(${currentTranslate}px)`;

    // Calculate velocity (pixels per millisecond)
    const now = Date.now();
    const deltaTime = now - lastTime;
    if (deltaTime > 0) {
        velocity = (currentPosition - lastPos) / deltaTime;
        lastPos = currentPosition;
        lastTime = now;
    }
}

function touchEnd() {
    isDragging = false;
    // Apply inertia (the velocity * a factor determines the extra slide movement)
    const inertiaOffset = velocity * 200; // Adjust this inertia factor as needed
    let momentumTranslate = currentTranslate + inertiaOffset;
    // Determine target slide index based on the momentum position
    let targetIndex = Math.round(-momentumTranslate / slideWidth);
    targetIndex = Math.max(0, Math.min(targetIndex, slides.length - 1));
    currentIndex = targetIndex;
    snapToSlide();
}

function snapToSlide() {
    currentTranslate = -currentIndex * slideWidth;
    slider.style.transition = 'transform 0.7s cubic-bezier(0.25, 1.3, 0.5, 1)';
    slider.style.transform = `translateX(${currentTranslate}px)`;
}

// Event listeners for mouse and touch events
slider.addEventListener('mousedown', touchStart);
slider.addEventListener('mousemove', touchMove);
slider.addEventListener('mouseup', touchEnd);
slider.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });
slider.addEventListener('touchstart', touchStart);
slider.addEventListener('touchmove', touchMove);
slider.addEventListener('touchend', touchEnd);
