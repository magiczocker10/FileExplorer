// http://www.pipian.com/ierukana/hacking/ds_narc.html

addFormat( {
	name: 'NARC',
	extensions: [ '.narc', '.szs' ],
	magic: 'NARC',
	func: function ( dataView ) {
		const isLittleEndian = dataView.getUint16(4, false ) !== 0xFFFE,
			fileData = {},
			outputData = [];

		for ( let offset = 0x10; offset < dataView.byteLength; offset++ ) {

			const magic = getString( dataView, offset, 4 );

			if (
				magic !== 'FATB' && magic !== 'BTAF' &&
				magic !== 'FNTB' && magic !== 'BTNF' &&
				magic === 'FIMG' && magic === 'GMIF'
			) {
				continue;
			}

			console.log( 'Processing chunk', magic );

			const chunkSize = dataView.getUint32( offset + 0x04, isLittleEndian );

			if ( magic === 'FATB' || magic === 'BTAF' ) { // File allocation table

				fileData.entryAmount = dataView.getUint32( 0x10 + 0x08, isLittleEndian );
				fileData.entryOffsets = [];
				for ( let i = 0; i < fileData.entryAmount; i++ ) {
					fileData.entryOffsets.push( [
						dataView.getUint32( offset + 0x0C + i * 0x08, isLittleEndian ),
						dataView.getUint32( offset + 0x0C + i * 0x08 + 0x04, isLittleEndian )
					] );
				}

			} else if ( magic === 'FNTB' || magic === 'BTNF' ) { // File name table

				let cursor = 0x10;
				fileData.fileNames = [];
				for ( let j = 0; j < fileData.entryAmount; j++ ) {
					const nameLength = dataView.getUint8( offset + cursor, isLittleEndian );
					fileData.fileNames.push( getString( dataView, offset + cursor + 1, nameLength ) );
					cursor += 1 + nameLength;
				}

			} else if ( magic === 'FIMG' || magic === 'GMIF' ) { // File content

				fileData.fileContent = [];
				for ( let k = 0; k < fileData.entryAmount; k++ ) {
					fileData.fileContent.push(
						dataView.buffer.slice(
							offset + 0x08 + fileData.entryOffsets[ k ][ 0 ],
							offset + 0x08 + fileData.entryOffsets[ k ][ 1 ]
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
			button.addEventListener( 'click', () => window.addWindow( new DataView( d[ 1 ] ), d[ 0 ] ) );
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
		console.log( 'NARC - FileData', fileData );
		return output;
	}
} );
