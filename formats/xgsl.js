( () => {
	const te16 = new TextDecoder( 'utf-16' ),
		labels = {
			0x0: 'English',
			0x01: 'Français',
			0x02: 'Deutsch',
			0x03: 'Italiano',
			0x04: 'Español',
			0x06: 'System message',
			0x0D: 'Português'
		};
	addFormat( {
		name: 'XGSL',
		extensions: [ '.xlc' ],
		magic: [ 'XGSL' ],
		func: function ( dataView ) {
			const output = document.createElement( 'table' ),
				outputHead = output.createTHead(),
				outputBody = output.createTBody(),
				headerRow = outputHead.insertRow( -1 );
			output.className = 'wikitable stickytable';

			const lengths = [],
				count = dataView.getUint32( 0x0C, true );

			for ( let i = 0; i < count; i++ ) {
				lengths.push( dataView.getUint32( 0x18 + i * 8, true ) );
				headerRow.appendChild( document.createElement( 'th' ) ).textContent = labels[ dataView.getUint8( 0x18 + i * 8 + 4 ) ];
			}

			let blockStart = 24 + lengths.length * 8;
			lengths.forEach( ( l, colIndex ) => {
				let blockEnd = blockStart + l;
				let rowIndex = 0;
				let start = blockStart;
				let end = blockStart;
				while ( end < blockEnd ) {
					if (dataView.getUint16(end, false) === 0 ) {
						if ( !outputBody.children[ rowIndex ] ) {
							const row = outputBody.insertRow();
							for ( let x = 0; x < count; x++ ) {
								row.insertCell();
							}
						}
						outputBody.children[ rowIndex ].children[ colIndex ].textContent = te16.decode( dataView.buffer.slice( start, end ) );
						start = end + 2;
						rowIndex++;
					}
					end = end + 2
				}
				blockStart = blockEnd;
			} );

			return output;
		}
	} );
} )();