// http://www.pipian.com/ierukana/hacking/ds_narc.html

addFormat( {
	name: 'NARC',
	extensions: [ '.narc', '.szs' ],
	magic: [
		[ 0, 0x4E ], // N
		[ 1, 0x41 ], // A
		[ 2, 0x52 ], // R
		[ 3, 0x43 ] // C
	],
	func: function ( array ) {
		const isLittleEndian = new DataView( array.slice( 4, 6 ).buffer ).getUint16( 0, 0 ) !== 0xFFFE,
			te8 = new TextDecoder( 'utf-8' ),
			fileData = {},
			outputData = [];

		for ( let offset = 0x10; offset < array.length; offset++ ) {

			const magic = te8.decode( array.slice( offset, offset + 4 ) );
			if (
				magic !== 'FATB' && magic !== 'BTAF' &&
				magic !== 'FNTB' && magic !== 'BTNF' &&
				magic === 'FIMG' && magic === 'GMIF'
			) {
				continue;
			}

			console.log( 'Processing chunk', magic );

			const chunkSize = new DataView(
					array.slice( offset + 0x04, offset + 0x04 + 4 ).buffer
				).getUint32( 0, isLittleEndian ),
				chunkData = array.slice( offset, offset + chunkSize );

			if ( magic === 'FATB' || magic === 'BTAF' ) { // File allocation table

				fileData.entryAmount = new DataView(
					array.slice( 0x10 + 0x08, 0x10 + 0x08 + 4 ).buffer
				).getUint32( 0, isLittleEndian );
				fileData.entryOffsets = [];
				for ( let i = 0; i < fileData.entryAmount; i++ ) {
					fileData.entryOffsets.push( [
						new DataView( chunkData.slice(
							0x0C + i * 0x08,
							0x0C + i * 0x08 + 0x04
						).buffer ).getUint32( 0, isLittleEndian ),
						new DataView( chunkData.slice(
							0x0C + i * 0x08 + 0x04,
							0x0C + i * 0x08 + 0x08
						).buffer ).getUint32( 0, isLittleEndian )
					] );
				}

			} else if ( magic === 'FNTB' || magic === 'BTNF' ) { // File name table

				let cursor = 0x10;
				fileData.fileNames = [];
				for ( let j = 0; j < fileData.entryAmount; j++ ) {
					const nameLength = new DataView(
						chunkData.slice( cursor, cursor + 1 ).buffer
					).getUint8( 0 );
					fileData.fileNames.push(
						te8.decode( chunkData.slice( cursor + 1, cursor + 1 + nameLength ) )
					);
					cursor += 1 + nameLength;
				}

			} else if ( magic === 'FIMG' || magic === 'GMIF' ) { // File content

				fileData.fileContent = [];
				for ( let k = 0; k < fileData.entryAmount; k++ ) {
					fileData.fileContent.push(
						chunkData.slice(
							0x08 + fileData.entryOffsets[ k ][ 0 ],
							0x08 + fileData.entryOffsets[ k ][ 1 ]
						)
					);
					outputData[ k ] = [
						fileData.fileNames[ k ],
						fileData.fileContent[ k ]
					];
				}

			}

			offset += chunkSize - 1;
		}
		console.log( 'NARC - Output Data', outputData );
		const output = document.createElement( 'table' ),
			head = output.appendChild( document.createElement( 'thead' ) ),
			body = output.appendChild( document.createElement( 'tbody' ) );
		output.className = 'wikitable stickytable';
		head.innerHTML = '<tr><th colspan="3">Files</th></tr>';

		outputData.forEach( ( d ) => {
			const row = body.insertRow( -1 ),
				button = document.createElement( 'input' ),
				download = document.createElement( 'input' );
			button.type = 'button';
			button.value = 'Open';
			download.type = 'button';
			download.value = '\u21E9';
			button.addEventListener( 'click', () => window.addWindow( d[ 1 ], d[ 0 ] ) );
			download.addEventListener( 'click', () => {
				const blobData = new Blob( [ d[ 1 ].buffer ], { type: 'text/plain' } ),
					a = document.createElement( 'a' );
				a.download = d[ 0 ];
				a.setAttribute( 'href', URL.createObjectURL( blobData ) );
				a.click();
			} );
			row.insertCell( -1 ).textContent = d[ 0 ];
			row.insertCell( -1 ).appendChild( button );
			row.insertCell( -1 ).appendChild( download );
		} );
		console.log( 'SARC - FileData', fileData );
		return output;
	}
} );
