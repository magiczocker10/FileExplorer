// http://www.pipian.com/ierukana/hacking/ds_narc.html

addFormat( {
	name: 'SARC',
	extensions: [ '.sarc', '.szs' ],
	magic: [
		[ 0, 0x53 ], // S
		[ 1, 0x41 ], // A
		[ 2, 0x52 ], // R
		[ 3, 0x43 ] // C
	],
	func: function ( array ) {
		const isLittleEndian = new DataView( array.slice( 6, 8 ).buffer ).getUint16( 0, 0 ) === 0xFFFE,
			te8 = new TextDecoder( 'utf-8' ),
			fileData = {
				fileSize: new DataView( array.slice( 8, 12 ).buffer ).getUint32( 0, 1 ),
				dataOffsetBeginning: new DataView(
					array.slice( 0x0C, 0x10 ).buffer
				).getUint32( 0, 1 ),
				nodes: [],
				version: new DataView( array.slice( 0x10, 0x12 ).buffer ).getUint16( 0, 1 )
			},
			outputData = [];
		for ( let offset = 0x14; offset < array.length; offset++ ) {

			const magic = te8.decode( array.slice( offset, offset + 4 ) );
			if (
				magic !== 'SFAT' &&
				magic !== 'SFNT'
			) {
				continue;
			}

			console.log( 'SARC - Processing chunk', magic );

			const chunkData = array.slice( offset, array.length );

			if ( magic === 'SFAT' ) { // File allocation table
				fileData.sfat = {
					nodeCount: new DataView(
						chunkData.slice( 0x06, 0x08 ).buffer
					).getUint16( 0, isLittleEndian ),
					hashKey: new DataView(
						chunkData.slice( 0x08, 0x0C ).buffer
					).getUint32( 0, isLittleEndian )
				};
				for ( let i = 0; i < fileData.sfat.nodeCount; i++ ) {
					const cursor = 0x0C + 0x10 * i,
						nodeData = {
							hash: chunkData.slice( cursor, cursor + 4 ),
							attributes: chunkData.slice( cursor + 4, cursor + 8 ),
							dataStart: new DataView(
								chunkData.slice( cursor + 8, cursor + 12 ).buffer
							).getUint32( 0, isLittleEndian ),
							dataEnd: new DataView(
								chunkData.slice( cursor + 12, cursor + 16 ).buffer
							).getUint32( 0, isLittleEndian )
						};
					fileData.nodes.push( nodeData );
				}

			} else if ( magic === 'SFNT' ) { // File name table
				let index = -1,
					lastZero = false,
					cursorSFNT = 0x07;
				while ( index <= fileData.sfat.nodeCount ) {
					const byte = chunkData.slice( cursorSFNT, cursorSFNT + 1 );
					cursorSFNT++;
					if ( byte[ 0 ] === 0 ) {
						if ( lastZero ) {
							continue;
						}
						if ( index + 1 === fileData.sfat.nodeCount ) {
							break;
						}
						index++;
						lastZero = true;
						fileData.nodes[ index ].name = '';
					} else {
						lastZero = false;
						fileData.nodes[ index ].name += te8.decode( byte );
					}
				}
				for ( let j = 0; j < fileData.sfat.nodeCount; j++ ) {
					fileData.nodes[ j ].content = array.slice(
						fileData.dataOffsetBeginning + fileData.nodes[ j ].dataStart,
						fileData.dataOffsetBeginning + fileData.nodes[ j ].dataEnd
					);
					outputData[ j ] = [
						fileData.nodes[ j ].name,
						fileData.nodes[ j ].content
					];
				}
			}
		}
		console.log( 'SARC - Output Data', outputData );
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
			button.addEventListener( 'click', () => {
				window.addWindow( d[ 1 ], d[ 0 ] );
			} );
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
