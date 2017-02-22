// simple InViewport Script
export default function elementInViewport(el, offsetTop, offsetBottom) {
	offsetTop = offsetTop || 0;
	offsetBottom = offsetBottom || 0;

	let elementHeight = el.outerHeight(),
		windowHeight = window.innerHeight,
		rect = el[0].getBoundingClientRect(),
		elHeight = el[0].clientHeight;

	let result = {
		visible: false,
		bothVisible: false,
		bottomVisible: false,
		topVisible: false
	};

	//console.log( rect.top, rect.bottom, elHeight );

	// check if bottom is visble
	let bottomVisible = rect.bottom >= offsetBottom && rect.bottom <= windowHeight,
		topVisible = rect.top >= offsetTop && rect.top <= windowHeight,
		isVisible = rect.top < (windowHeight + offsetTop) && rect.bottom > offsetBottom;

	result.bottomVisible = bottomVisible;
	result.topVisible = topVisible;
	result.bothVisible = topVisible && bottomVisible;
	result.visible = isVisible;

	return result;
}
