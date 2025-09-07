addFormat( {
	name: 'MSBT',
	extensions: [ '.msbt' ],
	magic: [
		[ 0, 0x4D ], // M
		[ 1, 0x73 ], // s
		[ 2, 0x67 ], // g
		[ 3, 0x53 ], // S
		[ 4, 0x74 ], // t
		[ 5, 0x64 ], // d
		[ 6, 0x42 ], // B
		[ 7, 0x6E ] // n
	],
	func: function ( array ) {
		const output = document.createElement( 'table' ),
			head = output.appendChild( document.createElement( 'thead' ) ),
			body = output.appendChild( document.createElement( 'tbody' ) ),
			data = [];
		output.className = 'wikitable stickytable';
		head.innerHTML = '<tr><th>Label</th><th>String</th></tr>';

		const isLittleEndian = new DataView( array.slice( 8, 10 ).buffer ).getUint16( 0, 0 ) === 0xFFFE,
			te8 = new TextDecoder( 'utf-8' ),
			te16 = new TextDecoder( 'utf-16' ),
			header = {
				fileMagic: array.slice( 0, 8 ),
				isLittleEndian: isLittleEndian,
				numberSections: new DataView( array.slice( 0x0E, 0x10 ).buffer ).getUint16( 0, isLittleEndian ),
				fileSize: new DataView( array.slice( 18, 20 ).buffer ).getUint16( 0, isLittleEndian ),
				messageEncoding: new DataView( array.slice( 0x0C, 0x0D ).buffer ).getUint8( 0 ),
				versionNumber: new DataView( array.slice( 0x0D, 0x0E ).buffer ).getUint8( 0 )
			},
			sections = [];
		console.log( header );
		body.innerHTML = '';
		for ( let offset = 0x20; offset < header.fileSize; offset++ ) {
			const magic = te8.decode( array.slice( offset, offset + 4 ) );
			if ( magic !== 'ATR1' && magic !== 'NLI1' && magic !== 'TXT2' && magic !== 'LBL1' ) {
				continue;
			}
			console.log( 'Processing chunk:', magic );
			const size = new DataView( array.slice( offset + 4, offset + 8 ).buffer ).getUint32( 0, isLittleEndian ),
				chunkData = array.slice( offset + 0x10, offset + 0x10 + size ),
				counter = new DataView( chunkData.slice( 0, 4 ).buffer ).getUint32( 0, isLittleEndian ),
				entries = [];
			if ( magic === 'ATR1' ) { // Attributes

			} else if ( magic === 'NLI1' ) {

				for ( let i = 0; i < counter; i++ ) {
					entries.push( [
						new DataView( chunkData.slice(
							0x04 + i * 8,
							0x04 + i * 8 + 4
						).buffer ).getUint32( 0, isLittleEndian ),
						new DataView( chunkData.slice(
							0x04 + i * 8 + 4,
							0x04 + i * 8 + 8
						).buffer ).getUint32( 0, isLittleEndian )
					] );
				}

			} else if ( magic === 'TXT2' ) { // Text Strings

				// Calculate string offsets
				for ( let j = 0; j < counter; j++ ) {
					entries.push( new DataView( chunkData.slice(
						0x04 + j * 4,
						0x04 + j * 4 + 4
					).buffer ).getUint32( 0, isLittleEndian ) );
				}

				// Calculate strings
				entries.forEach( ( offset2, index ) => {
					data[ index ] = data[ index ] || {};

					if ( !data[ index ].label ) {
						data[ index ].label = index;
					}

					data[ index ].content = te16.decode( chunkData.slice(
						offset2,
						offset2 + ( ( entries[ index + 1 ] || size ) - offset2 - 2 )
					) );
				} );

			} else { // LBL1 (Labels)

				// Calculate string offsets
				for ( let k = 0; k < counter; k++ ) {
					entries.push( [
						new DataView( chunkData.slice(
							0x04 + k * 8,
							0x04 + k * 8 + 4
						).buffer ).getUint32( 0, isLittleEndian ),
						new DataView( chunkData.slice(
							0x04 + k * 8 + 4,
							0x04 + k * 8 + 8
						).buffer ).getUint32( 0, isLittleEndian )
					] );
				}

				// Calculate strings
				// let lastOffset = 0;
				entries.forEach( ( offset2, index ) => {
					// lastOffset = offset2[ 1 ];
					if ( !offset2[ 0 ] ) {
						return;
					}
					let lblData = chunkData.slice(
						offset2[ 1 ],
						offset2[ 1 ] + ( ( entries[ index + 1 ] && entries[ index + 1 ][ 1 ] || size ) - offset2[ 1 ] )
					);
					for ( let l = 0; l < offset2[ 0 ]; l++ ) {
						const lblLength = new DataView( lblData.slice( 0, 1 ).buffer ).getUint8( 0 ),
							lblText = te8.decode( lblData.slice( 1, 1 + lblLength ) ),
							lblIndex = new DataView( lblData.slice( 1 + lblLength, 1 + lblLength + 4 ).buffer ).getUint32( 0, isLittleEndian );
						data[ lblIndex ] = data[ lblIndex ] || {};
						data[ lblIndex ].label = lblText;
						lblData = lblData.slice( 1 + lblLength + 4 );
					}
				} );
			}
			sections.push( {
				magic: magic,
				size: size,
				chunkData: chunkData,
				counter: counter,
				entries: entries
			} );
			offset += size;
		}
		data.forEach( ( d ) => {
			const row = body.insertRow( -1 );
			row.insertCell( -1 ).textContent = d.label;
			row.insertCell( -1 ).textContent = d.content;
		} );
		console.log( 'MsgStdBn', sections );
		return output;
	}
} );
