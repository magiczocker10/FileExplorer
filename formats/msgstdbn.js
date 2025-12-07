addFormat( {
	name: 'MSBT',
	extensions: [ '.msbt' ],
	magic: [ 'MsgStdBn' ],
	func: function ( dataView ) {
		const te16 = new TextDecoder( 'utf-16' ),
			output = document.createElement( 'table' ),
			head = output.appendChild( document.createElement( 'thead' ) ),
			body = output.appendChild( document.createElement( 'tbody' ) ),
			data = [];
		output.className = 'wikitable stickytable';
		head.innerHTML = '<tr><th>Label</th><th>String</th></tr>';

		const isLittleEndian = dataView.getUint16( 8, false ) === 0xFFFE,
			header = {
				fileMagic: getString(dataView, 0, 8),
				isLittleEndian: isLittleEndian,
				numberSections: dataView.getUint16( 0x0E, isLittleEndian ),
				fileSize: dataView.getUint16( 18, isLittleEndian ),
				messageEncoding: dataView.getUint8( 0x0C ),
				versionNumber: dataView.getUint8( 0x0D )
			},
			sections = [];
		console.log( header );
		body.innerHTML = '';
		for ( let offset = 0x20; offset < header.fileSize - 3; offset++ ) {
			const magic = getString( dataView, offset, 4);
			if ( magic !== 'ATR1' && magic !== 'NLI1' && magic !== 'TXT2' && magic !== 'LBL1' ) {
				continue;
			}
			console.log( 'Processing chunk:', magic );
			const size = dataView.getUint32( offset + 4, isLittleEndian ),
				chunkData = offset + 0x10,
				counter = dataView.getUint32( chunkData, isLittleEndian ),
				entries = [];
			if ( magic === 'ATR1' ) { // Attributes

			} else if ( magic === 'NLI1' ) {

				for ( let i = 0; i < counter; i++ ) {
					entries.push( [
						dataView.getUint32( chunkData + 0x04 + i * 8, isLittleEndian ),
						dataView.getUint32( chunkData + 0x04 + i * 8 + 4, isLittleEndian )
					] );
				}

			} else if ( magic === 'TXT2' ) { // Text Strings

				// Calculate string offsets
				for ( let j = 0; j < counter; j++ ) {
					entries.push( dataView.getUint32( chunkData + 0x04 + j * 4, isLittleEndian ) );
				}

				// Calculate strings
				entries.forEach( ( offset2, index ) => {
					data[ index ] = data[ index ] || {};

					if ( !data[ index ].label ) {
						data[ index ].label = index;
					}

					data[ index ].content = te16.decode( dataView.buffer.slice(
						chunkData + offset2,
						chunkData + offset2 + ( ( entries[ index + 1 ] || size ) - offset2 - 2 )
					) );
				} );

			} else { // LBL1 (Labels)

				// Calculate string offsets
				for ( let k = 0; k < counter; k++ ) {
					entries.push( [
						dataView.getUint32( chunkData + 0x04 + k * 8, isLittleEndian ),
						dataView.getUint32( chunkData + 0x04 + k * 8 + 4, isLittleEndian )
					] );
				}

				// Calculate strings
				// let lastOffset = 0;
				entries.forEach( ( offset2, index ) => {
					// lastOffset = offset2[ 1 ];
					if ( !offset2[ 0 ] ) {
						return;
					}

					let lblData = chunkData + offset2[ 1 ];
					for ( let l = 0; l < offset2[ 0 ]; l++ ) {
						const lblLength = dataView.getUint8( lblData ),
							lblText = getString( dataView, lblData + 1, lblLength ),
							lblIndex = dataView.getUint32( lblData + 1 + lblLength, isLittleEndian );
						data[ lblIndex ] = data[ lblIndex ] || {};
						data[ lblIndex ].label = lblText;
						lblData += 1 + lblLength + 4;
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
