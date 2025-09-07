( () => {
	let body,
		index = 20,
		template;
	const supported = document.createElement( 'table' ),
		uploadButton = document.createElement( 'input' ),
		supportedHead = supported.appendChild( document.createElement( 'thead' ) ),
		supportedBody = supported.appendChild( document.createElement( 'tbody' ) ),
		formats = [],
		allAccept = [];
	uploadButton.type = 'file';
	uploadButton.multiple = true;
	uploadButton.setAttribute( 'aria-label', 'Upload files' );
	supported.className = 'wikitable supported-table';
	supportedHead.innerHTML = '<tr><th colspan="2">Currently supported</th></tr><tr><th>Format</th><th>File extensions</th></tr>';

	// https://www.w3schools.com/howto/howto_js_draggable.asp
	// https://dev.to/mazhugasergei/-draggable-resizable-window-on-your-website-3b7i
	function mousedown( e ) {
		let elmnt = e.target.parentElement;
		if ( !elmnt.classList.contains( 'window-container' ) ) {
			elmnt = elmnt.parentElement;
		}
		let prevX = e.clientX,
			prevY = e.clientY;
		document.addEventListener( 'mouseup', mouseup, false );
		document.addEventListener( 'mousemove', mousemove, false );

		function mousemove( f ) {
			e.preventDefault();
			const newX = f.clientX - prevX,
				newY = f.clientY - prevY;
			prevX = f.clientX;
			prevY = f.clientY;
			elmnt.style.left = elmnt.offsetLeft + newX + 'px';
			elmnt.style.top = elmnt.offsetTop + newY + 'px';
		}

		function mouseup() {
			document.removeEventListener( 'mouseup', mouseup );
			document.removeEventListener( 'mousemove', mousemove );
		}
	}

	function mousedownResizer( e ) {
		let elmnt = e.target.parentElement;
		const currentResizer = e.target;
		if ( !elmnt.classList.contains( 'window-container' ) ) {
			elmnt = elmnt.parentElement;
		}
		let prevX = e.clientX,
			prevY = e.clientY;
		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );
		function mousemove( f ) {
			if ( currentResizer.dataset.side === 'br' ) {
				elmnt.style.width = elmnt.offsetWidth + ( f.clientX - prevX ) + 'px';
				elmnt.style.height = elmnt.offsetHeight + ( f.clientY - prevY ) + 'px';
			} else if ( currentResizer.dataset.side === 'bl' ) {
				elmnt.style.width = elmnt.offsetWidth + ( prevX - f.clientX ) + 'px';
				elmnt.style.height = elmnt.offsetHeight + ( f.clientY - prevY ) + 'px';
				elmnt.style.left = elmnt.offsetLeft + ( f.clientX - prevX ) + 'px';
			} else if ( currentResizer.dataset.side === 'tr' ) {
				elmnt.style.width = elmnt.offsetWidth + ( f.clientX - prevX ) + 'px';
				elmnt.style.height = elmnt.offsetHeight + ( prevY - f.clientY ) + 'px';
				elmnt.style.top = elmnt.offsetTop + ( f.clientY - prevY ) + 'px';
			} else if ( currentResizer.dataset.side === 'tl' ) {
				elmnt.style.width = elmnt.offsetWidth + ( prevX - f.clientX ) + 'px';
				elmnt.style.height = elmnt.offsetHeight + ( prevY - f.clientY ) + 'px';
				elmnt.style.top = elmnt.offsetTop + ( f.clientY - prevY ) + 'px';
				elmnt.style.left = elmnt.offsetLeft + ( f.clientX - prevX ) + 'px';
			} else if ( currentResizer.dataset.side === 't' ) {
				elmnt.style.height = elmnt.offsetHeight + ( prevY - f.clientY ) + 'px';
				elmnt.style.top = elmnt.offsetTop + ( f.clientY - prevY ) + 'px';
			} else if ( currentResizer.dataset.side === 'b' ) {
				elmnt.style.height = elmnt.offsetHeight + ( f.clientY - prevY ) + 'px';
			} else if ( currentResizer.dataset.side === 'l' ) {
				elmnt.style.width = elmnt.offsetWidth + ( prevX - f.clientX ) + 'px';
				elmnt.style.left = elmnt.offsetLeft + ( f.clientX - prevX ) + 'px';
			} else if ( currentResizer.dataset.side === 'r' ) {
				elmnt.style.width = elmnt.offsetWidth + ( f.clientX - prevX ) + 'px';
			}
			prevX = f.clientX;
			prevY = f.clientY;
		}
		function mouseup() {
			document.removeEventListener( 'mousemove', mousemove );
			document.removeEventListener( 'mouseup', mouseup );
		}
	}

	function closeWindow( e ) {
		let main = e.target.parentElement;
		if ( !main.classList.contains( 'window-container' ) ) {
			main = main.parentElement;
		}
		body.removeChild( main );
	}

	function resizeWindow( e ) {
		let main = e.target.parentElement;
		if ( !main.classList.contains( 'window-container' ) ) {
			main = main.parentElement;
		}
		main.classList.toggle( 'hidden' );
		e.target.textContent = main.classList.contains( 'hidden' ) ? '+' : '─';
		moveToFront( e );
	}

	function moveToFront( e ) {
		let main = e.target.parentElement;
		if ( !main.classList.contains( 'window-container' ) ) {
			main = main.parentElement;
		}
		if ( Number( main.style.zIndex ) === index ) {
			return;
		}
		index++;
		const active = document.querySelector( '.window-active' );
		if ( active ) {
			active.classList.remove( 'window-active' );
		}
		main.classList.add( 'window-active' );
		main.style.zIndex = index;
	}

	function addFormat( data ) {
		formats.push( [ data.magic, data.func ] );
		const row = supportedBody.insertRow( -1 );
		row.insertCell( -1 ).textContent = data.name;
		row.insertCell( -1 ).textContent = data.extensions.join( ', ' );
		data.extensions.forEach( ( extension ) => {
			if ( !allAccept.includes( extension ) ) {
				allAccept.push( extension );
			}
		} );
		uploadButton.accept = allAccept.join( ', ' );
	}

	function addWindow( array, windowTitle ) {
		const main = template.children[ 0 ].cloneNode( true ),
			title = main.querySelector( '.window-title' ),
			minimize = main.querySelector( '.window-minimize' ),
			close = main.querySelector( '.window-close' ),
			content = main.querySelector( '.window-content' );
		body.appendChild( main );
		title.textContent = windowTitle;
		title.addEventListener( 'mousedown', mousedown, false );
		title.addEventListener( 'mousedown', moveToFront, false );
		content.addEventListener( 'mousedown', moveToFront, false );
		minimize.addEventListener( 'click', resizeWindow, false );
		close.addEventListener( 'click', closeWindow, false );
		moveToFront( { target: title } );
		const resizers = document.querySelectorAll( '.resizer' );

		for ( let j = 0; j < resizers.length; j++ ) {
			resizers[ j ].addEventListener( 'mousedown', mousedownResizer, false );
		}

		if (
			array[ 0 ] === 89 && // Y
			array[ 1 ] === 97 && // a
			array[ 2 ] === 122 && // z
			array[ 3 ] === 48 // 0
		) {
			array = window.yaz0.decode( array.slice( 0x10 ), new DataView(
				array.slice( 4, 8 ).buffer
			).getUint32( 0, false ) );
		}

		formats.forEach( ( format ) => {
			let c = 0;

			format[ 0 ].forEach( ( b ) => {
				if ( array[ b[ 0 ] ] === b[ 1 ] ) {
					c++;
				}
			} );

			if ( c === format[ 0 ].length ) {
				content.appendChild( format[ 1 ]( array ) );
				return;
			}
		} );
	}

	function loadFile( stream ) {
		const reader = new FileReader();
		reader.onloadend = function ( readerEvent ) {
			addWindow( new Uint8Array( readerEvent.target.result ), stream.name );
		};
		reader.readAsArrayBuffer( stream );
	}

	window.addFormat = addFormat;
	window.addWindow = addWindow;
	window.addEventListener( 'load', () => {
		body = document.getElementsByTagName( 'body' )[ 0 ];
		template = document.getElementsByClassName( 'window-template' )[ 0 ];

		uploadButton.addEventListener( 'change', ( e ) => {
			const files = e.target.files;
			for ( let file = 0; file < files.length; file++ ) {
				loadFile( files[ file ] );
			}
		}, false );
		body.appendChild( uploadButton );
		body.appendChild( supported );
	}, false );
} )();
