let subtitleWidth = null, currentFontSize = null;
function adjustSubtitleFontSize() {
    const subtitle = document.getElementById('subtitle');
    if (subtitle === null) return;

    if (subtitleWidth === null) {
        subtitleWidth = subtitle.offsetWidth;
        currentFontSize = parseFloat(window.getComputedStyle(subtitle).fontSize);
    }
    const parentWidth = subtitle.parentElement.offsetWidth;

    if (subtitleWidth > parentWidth) {
        const newFontSize = currentFontSize * (parentWidth / subtitleWidth);
        subtitle.style.fontSize = `${newFontSize}px`;
    }
}
window.addEventListener('resize', adjustSubtitleFontSize);
adjustSubtitleFontSize();
const bannerText = document.querySelector('.banner-text');
if (bannerText !== null)
    bannerText.classList.add('show');
