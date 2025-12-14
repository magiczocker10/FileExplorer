// http://www.pipian.com/ierukana/hacking/ds_narc.html

addFormat( {
	name: 'SARC',
	extensions: [ '.sarc', '.szs' ],
	magic: [ 'SARC' ],
	func: function ( dataView ) {
		const te8 = new TextDecoder( 'utf-8' ),
			isLittleEndian = dataView.getUint16( 6, false ) === 0xFFFE,
			fileData = {
				fileSize: dataView.getUint32( 8, true ),
				dataOffsetBeginning: dataView.getUint32( 0x0C, true ),
				nodes: [],
				version: dataView.getUint16( 0x10, true )
			},
			outputData = [];
		for ( let offset = 0x14; offset < dataView.byteLength - 3; offset++ ) {

			const magic = getString( dataView, offset, 4 );
			if (
				magic !== 'SFAT' &&
				magic !== 'SFNT'
			) {
				continue;
			}

			console.log( 'SARC - Processing chunk', magic );

			if ( magic === 'SFAT' ) { // File allocation table
				fileData.sfat = {
					nodeCount: dataView.getUint16( offset + 0x06, isLittleEndian ),
					hashKey: dataView.getUint32( offset + 0x08, isLittleEndian )
				};
				for ( let i = 0; i < fileData.sfat.nodeCount; i++ ) {
					const cursor = 0x0C + 0x10 * i,
						nodeData = {
							hash: dataView.buffer.slice( offset + cursor, offset + cursor + 4 ),
							attributes: dataView.buffer.slice( offset + cursor + 4, offset + cursor + 8 ),
							dataStart: dataView.getUint32( offset + cursor + 8, isLittleEndian ),
							dataEnd: dataView.getUint32( offset + cursor + 12, isLittleEndian )
						};
					fileData.nodes.push( nodeData );
				}

			} else if ( magic === 'SFNT' ) { // File name table
				let index = -1,
					lastZero = false,
					cursorSFNT = 0x07;
				while ( index <= fileData.sfat.nodeCount ) {
					const byte = dataView.getUint8( offset + cursorSFNT );
					cursorSFNT++;
					if ( byte === 0 ) {
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
						fileData.nodes[ index ].name += String.fromCharCode( byte );
					}
				}
				for ( let j = 0; j < fileData.sfat.nodeCount; j++ ) {
					fileData.nodes[ j ].content = dataView.buffer.slice(
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
			head = output.createTHead(),
			body = output.createTBody(),
			hCell = head.appendChild( document.createElement( 'th' ) );
		output.className = 'wikitable stickytable';
		hCell.textContent = 'Files';
		hCell.colspan = 3;

		outputData.forEach( ( d ) => {
			const row = body.insertRow( -1 ),
				button = document.createElement( 'input' ),
				download = document.createElement( 'input' );
			button.type = 'button';
			button.value = 'Open';
			download.type = 'button';
			download.value = '\u21E9';
			button.addEventListener( 'click', () => {
				window.addWindow( new DataView( d[ 1 ] ), d[ 0 ] );
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
