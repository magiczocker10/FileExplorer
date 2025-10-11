/* https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d */
function makeResizableDiv( element ) {
	const resizers = element.querySelectorAll( '.resizer' ),
		minWidth = 450,
		minHeight = 300;
	let originalWidth = 0,
		originalHeight = 0,
		originalX = 0,
		originalY = 0,
		originalMouseX = 0,
		originalMouseY = 0,
		currentResizer;

	function resize( e ) {
		const sides = currentResizer.dataset.side.split( ' ' );
		if ( sides.includes( 'b' ) ) { /* Bottom */
			const height = originalHeight + ( e.pageY - originalMouseY );
			if ( height > minHeight ) {
				element.style.height = `${ height }px`;
			}
		} else if ( sides.includes( 't' ) ) { /* Top */
			const height = originalHeight - ( e.pageY - originalMouseY );
			if ( height > minHeight ) {
				element.style.height = `${ height }px`;
				element.style.top = originalY + ( e.pageY - originalMouseY ) + 'px';
			}
		}
		if ( sides.includes( 'r' ) ) { /* Right */
			const width = originalWidth + ( e.pageX - originalMouseX );
			if ( width > minWidth ) {
				element.style.width = `${ width }px`;
			}
		} else if ( sides.includes( 'l' ) ) { /* Left */
			const width = originalWidth - ( e.pageX - originalMouseX );
			if ( width > minWidth ) {
				element.style.width = `${ width }px`;
				element.style.left = originalX + ( e.pageX - originalMouseX ) + 'px';
			}
		}
	}

	resizers.forEach( ( resizer ) => {
		resizer.addEventListener( 'mousedown', ( e ) => {
			e.preventDefault();
			const compStyle = getComputedStyle( element, null ),
				rect = element.getBoundingClientRect();
			originalWidth = parseFloat( compStyle.getPropertyValue( 'width' ).replace( 'px', '' ) );
			originalHeight = parseFloat( compStyle.getPropertyValue( 'height' ).replace( 'px', '' ) );
			originalX = rect.left;
			originalY = rect.top;
			originalMouseX = e.pageX;
			originalMouseY = e.pageY;
			currentResizer = e.target;
			window.addEventListener( 'mousemove', resize, false );
			window.addEventListener( 'mouseup', () => {
				window.removeEventListener( 'mousemove', resize );
			}, false );
		} );
	} );
}
