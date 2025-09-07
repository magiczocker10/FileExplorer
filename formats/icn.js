// https://www.3dbrew.org/wiki/SMDH
( () => {
	const imageMap = [
			[ 0, 1, 4, 5, 16, 17, 20, 21 ],
			[ 2, 3, 6, 7, 18, 19, 22, 23 ],
			[ 8, 9, 12, 13, 24, 25, 28, 29 ],
			[ 10, 11, 14, 15, 26, 27, 30, 31 ],
			[ 32, 33, 36, 37, 48, 49, 52, 53 ],
			[ 34, 35, 38, 39, 50, 51, 54, 55 ],
			[ 40, 41, 44, 45, 56, 57, 60, 61 ],
			[ 42, 43, 46, 47, 58, 59, 62, 63 ]
		],
		titleLangs = [
			'Japanese',
			'English',
			'French',
			'German',
			'Italian',
			'Spanish',
			'Simplified Chinese',
			'Korean',
			'Dutch',
			'Portuguese',
			'Russian',
			'Traditional Chinese'
		],
		ratingsLabels = [
			'CERO (Japan)',
			'ESRB (USA)',
			'',
			'USK (German)',
			'PEGI GEN (Europe)',
			'',
			'PEGI PRT (Portugal)',
			'PEGI BBFC (England)',
			'COB (Australia)',
			'GRB (South Korea)',
			'CGSRR (Taiwan)',
			'',
			'',
			'',
			'',
			''
		],
		regionLabels = [
			'Japan',
			'North America',
			'Europe',
			'Australia',
			'China',
			'Korea',
			'Taiwan'
		],
		flagLabels = [
			'Visible on Home Menu',
			'Auto-boot gamecard',
			'Allow use of 3D',
			'Require accepting EULA',
			'Autosave on exit',
			'Use extended banner',
			'Region game rating required',
			'Use save data',
			'Application usage is recorded',
			'SD Savedata backup disabled',
			'New 3DS exclusive',
			'Restricted by parental controls'
		];

	function isBitSet( num, offset ) {
		return ( ( num & 1 << offset ) ) !== 0;
	}

	function processImage( canv, size, data, scale ) {
		let chunkCounter = 0;
		canv.width = size * scale;
		canv.height = size * scale;
		const ctx = canv.getContext( '2d' );
		for ( let chunkY = 0; chunkY < size; chunkY += 8 ) {
			for ( let chunkX = 0; chunkX < size; chunkX += 8 ) {
				for ( let y = 0; y < 8; y++ ) {
					for ( let x = 0; x < 8; x++ ) {
						const offset = ( chunkCounter * 64 + imageMap[ y ][ x ] ) * 2,
							rgb565 = new DataView( data.slice(
								offset,
								offset + 2
							).buffer ).getUint16( 0, 1 ),
							red5 = rgb565 >> 11,
							green6 = ( rgb565 >> 5 ) & 0b111111,
							blue5 = rgb565 & 0b11111,
							red8 = Math.round( red5 / 31 * 255 ),
							green8 = Math.round( green6 / 63 * 255 ),
							blue8 = Math.round( blue5 / 31 * 255 );

						ctx.fillStyle = 'rgb( ' + red8 + ', ' + green8 + ', ' + blue8 + ' )';
						ctx.fillRect( ( chunkX + x ) * scale, ( chunkY + y ) * scale, scale, scale );

					}
				}
				chunkCounter++;
			}
		}
		return canv;
	}

	function download( name, image ) {
		const a = document.createElement( 'a' );
		a.download = String( name ) + '.png';
		a.href = image.toDataURL();
		a.click();
	}

	function getSettings( settingsData ) {
		const settings = {
				regionLockout: new DataView( settingsData.slice( 0x10, 0x14 ).buffer ).getUint32( 0, 1 ),
				matchMakerID: {
					id: new DataView( settingsData.slice( 0x14, 0x18 ).buffer ).getUint32( 0, 1 ),
					bitId: new DataView( settingsData.slice( 0x18, 0x20 ).buffer ).getBigUint64( 0, 1 )
				},
				flags: new DataView( settingsData.slice( 0x20, 0x24 ).buffer ).getUint32( 0, 1 ),
				eulaVersion: 'Minor: ' + new DataView( settingsData.slice( 0x24, 0x25 ).buffer ).getInt8( 0 ) + ' Major: ' + new DataView( settingsData.slice( 0x25, 0x26 ).buffer ).getInt8( 0 ),
				cecID: new DataView( settingsData.slice( 0x2C, 0x30 ).buffer ).getUint32( 0, 1 )
			},
			output = document.createElement( 'div' );

		// Header
		const header = output.appendChild( document.createElement( 'h2' ) );
		header.textContent = 'Settings';

		// Region lockout
		const regionLockoutHeader = output.appendChild( document.createElement( 'h3' ) ),
			regionLockoutUl = output.appendChild( document.createElement( 'ul' ) );
		regionLockoutHeader.textContent = 'Region lockout';
		for ( let i = 0; i < 7; i++ ) {
			if ( isBitSet( settings.regionLockout, i ) ) {
				const li = regionLockoutUl.appendChild( document.createElement( 'li' ) );
				li.textContent = regionLabels[ i ];
			}
		}

		// Ratings
		const ratingHeader = output.appendChild( document.createElement( 'h3' ) ),
			ratingTable = output.appendChild( document.createElement( 'table' ) ),
			ratingBody = ratingTable.createTBody(),
			ratingHead = ratingTable.createTHead();
		ratingHeader.textContent = 'Ratings';
		ratingTable.className = 'wikitable';
		ratingHead.innerHTML = '<tr><th>Rating</th><th>Value</th></tr>';
		for ( let j = 0; j < 16; j++ ) {
			const value = settingsData[ j ];
			if ( value ) {
				const row = ratingBody.insertRow( -1 ),
					txt = [];
				row.insertCell( -1 ).textContent = ratingsLabels[ j ];
				if ( isBitSet( value, 5 ) ) {
					txt.push( 'Age: 0' );
				}
				if ( isBitSet( value, 6 ) ) {
					txt.push( 'Status: Pending' );
				}
				if ( isBitSet( value, 7 ) ) {
					txt.push( 'Ignored' );
				}
				row.insertCell( -1 ).textContent = txt.join( ', ' );
			}
		}

		// Flags
		const flagsHeader = output.appendChild( document.createElement( 'h3' ) ),
			flagsUl = output.appendChild( document.createElement( 'ul' ) );
		flagsHeader.textContent = 'Flags';
		for ( let k = 0; k < 12; k++ ) {
			if ( isBitSet( settings.flags, k ) ) {
				const li = flagsUl.appendChild( document.createElement( 'li' ) );
				li.textContent = flagLabels[ k ];
			}
		}

		// Other
		const otherHeader = output.appendChild( document.createElement( 'h3' ) ),
			otherTable = output.appendChild( document.createElement( 'table' ) ),
			otherHead = otherTable.createTHead(),
			otherBody = otherTable.createTBody();
		otherHeader.textContent = 'Other';
		otherTable.className = 'wikitable';
		otherHead.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';
		otherBody.innerHTML =
			`<tr><td>Match maker ID</td><td>${ settings.matchMakerID.id }</td></tr>
			<tr><td>Match maker Bit-ID</td><td>${ settings.matchMakerID.bitId }</td></tr>
			<tr><td>Eula Version</td><td>${ settings.eulaVersion }</td></tr>
			<tr><td>CEC-ID</td><td>${ settings.cecID }</td></tr>`;

		return output;
	}

	function getIcons( small, large ) {
		const output = document.createElement( 'div' );

		// Header
		const header = output.appendChild( document.createElement( 'h2' ) );
		header.textContent = 'Icons';

		// Scaling
		const numLabel = output.appendChild( document.createElement( 'div' ) ),
			numInput = document.createElement( 'input' );
		numInput.type = 'number';
		numInput.min = '1';
		numInput.value = '1';
		numInput.name = 'Scaling';
		numInput.setAttribute( 'aria-label', 'Scaling' );
		numInput.addEventListener( 'change', updateIcons );
		numLabel.append(
			document.createTextNode( 'Scaling: ' ),
			numInput
		);

		// Content
		const table = output.appendChild( document.createElement( 'table' ) ),
			body = table.createTBody(),
			head = table.createTHead(),
			rowSmall = body.insertRow( -1 ),
			rowLarge = body.insertRow( -1 ),
			buttonSmall = document.createElement( 'button' ),
			buttonLarge = document.createElement( 'button' ),
			canvSmall = document.createElement( 'canvas' ),
			canvLarge = document.createElement( 'canvas' );

		function updateIcons() {
			const v = Number( numInput.value );
			processImage( canvSmall, 24, small, v );
			processImage( canvLarge, 48, large, v );
		}

		table.className = 'wikitable';
		head.innerHTML = '<tr><th colspan="2">Images</th></tr>';
		rowSmall.insertCell( -1 ).append( canvSmall );
		rowLarge.insertCell( -1 ).append( canvLarge );
		rowSmall.insertCell( -1 ).append( buttonSmall );
		rowLarge.insertCell( -1 ).append( buttonLarge );
		buttonSmall.type = 'button';
		buttonLarge.type = 'button';
		buttonSmall.textContent = 'Download';
		buttonLarge.textContent = 'Download';
		buttonSmall.addEventListener( 'click', () => {
			download( 'small', canvSmall );
		} );
		buttonLarge.addEventListener( 'click', () => {
			download( 'large', canvLarge );
		} );
		updateIcons();
		return output;
	}

	function getTitles( array ) {
		const te16 = new TextDecoder( 'utf-16' ),
			output = document.createElement( 'div' ),
			header = output.appendChild( document.createElement( 'h2' ) ),
			table = output.appendChild( document.createElement( 'table' ) ),
			tHead = table.createTHead(),
			tBody = table.createTBody();
		header.textContent = 'Titles';
		table.className = 'wikitable';
		tHead.innerHTML = '<tr><th>Language</th><th>Short description</th><th>Long description</th><th>Publisher</th></tr>';

		for ( let i = 0; i < 16; i++ ) {
			const titleData = array.slice(
					0x08 + 0x200 * i,
					0x08 + 0x200 * i + 0x200
				),
				short = te16.decode( titleData.slice( 0x00, 0x80 ) ).replaceAll( '\x00', '' ),
				long = te16.decode( titleData.slice( 0x80, 0x180 ) ).replaceAll( '\x00', '' ),
				publisher = te16.decode( titleData.slice( 0x180, 0x200 ) ).replaceAll( '\x00', '' );

			if ( short.length || long.length || publisher.length ) {
				const row = tBody.insertRow( -1 );
				row.insertCell( -1 ).textContent = titleLangs[ i ];
				row.insertCell( -1 ).textContent = short;
				row.insertCell( -1 ).textContent = long;
				row.insertCell( -1 ).textContent = publisher;
			}
		}
		return output;
	}

	function getVersion( version ) {
		const output = document.createElement( 'div' ),
			header = output.appendChild( document.createElement( 'h2' ) ),
			content = output.appendChild( document.createElement( 'span' ) );
		header.textContent = 'Version';
		content.textContent = version;
		return output;
	}

	addFormat( {
		name: 'SMDH',
		extensions: [ '.icn' ],
		magic: [
			[ 0, 0x53 ], // S
			[ 1, 0x4D ], // M
			[ 2, 0x44 ], // D
			[ 3, 0x48 ] // H
		],
		func: function ( array ) {
			const output = document.createElement( 'div' );

			// Output
			output.append(
				getIcons(
					array.slice( 0x2040, 0x24C0 ),
					array.slice( 0x24C0, 0x36C0 )
				),
				getVersion( new DataView( array.slice( 0x04, 0x06 ).buffer ).getUint16( 0, 1 ) ),
				getTitles( array ),
				getSettings( array.slice( 0x2008, 0x2008 + 0x30 ) )
			);
			return output;
		}
	} );
} )();
