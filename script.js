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

	function closeWindow( e ) {
		let main = e.target.parentElement;
		if ( !main.classList.contains( 'window-container' ) ) {
			main = main.parentElement;
		}
		body.removeChild( main );
		if ( Number( main.style.zIndex ) === index ) {
			while ( index > 20 ) {
				index--;
				const ele = document.querySelector( `div[style*="z-index: ${ index }"]` );
				if ( ele ) {
					ele.classList.add( 'window-active' );
					break;
				}
			}
		}
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

	function addWindow( dataView, windowTitle ) {
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

		makeResizableDiv( main );

		if ( getString( dataView, 0, 4 ) === 'Yaz0' ) {
			dataView = window.yaz0.decode( dataView, new DataView( dataView.buffer.slice( 4, 8 ) ).getUint32( 0, false ) );
		}

		formats.forEach( ( format ) => {
			format[ 0 ].forEach( ( magic ) => {
				if ( getString( dataView, 0, magic.length ) === magic ) {
					content.appendChild( format[ 1 ]( dataView ) );
					return;
				}
			} );
		} );
	}

	// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file
	function returnFileSize( number ) {
		if ( number < 1e3 ) {
			return `${ number } bytes`;
		} else if ( number >= 1e3 && number < 1e6 ) {
			return `${ ( number / 1e3 ).toFixed( 1 ) } KB`;
		}
		return `${ ( number / 1e6 ).toFixed( 1 ) } MB`;
	}

	function loadFile( stream ) {
		const reader = new FileReader();
		reader.onloadend = function ( readerEvent ) {
			const buf = readerEvent.target.result;
			addWindow( new DataView( buf ), `${ stream.name } (${ returnFileSize( stream.size ) })` );
		};
		reader.readAsArrayBuffer( stream );
	}

	window.addFormat = addFormat;
	window.addWindow = addWindow;
	window.getString = function( dataView, start, length ) {
		let out = '';
		for (let i=0; i<length; i++) {
			out += String.fromCharCode( dataView.getUint8( start + i ) );
		}
		return out;
	}

	window.addEventListener( 'load', () => {
		body = document.getElementsByTagName( 'body' )[ 0 ];
		template = document.getElementsByClassName( 'window-template' )[ 0 ];

		uploadButton.addEventListener( 'change', ( e ) => {
			const files = e.target.files;
			for ( let file = 0; file < files.length; file++ ) {
				loadFile( files[ file ] );
			}
			e.target.value = null;
		}, false );
		body.appendChild( uploadButton );
		body.appendChild( supported );
	}, false );
} )();
