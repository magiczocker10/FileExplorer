// https://nintendo-formats.com/libs/common/byaml.html

/*
<details open="">
 <summary>Test</summary>
 <ul><li>Test</li></ul>
 <details open="">
  <summary>Test</summary>
  <ul><li>Test</li></ul>
  <details open="">
   <summary>Test</summary>
   <ul><li>Test</li></ul>
  </details>
 </details>
</details>
*/
( () => {
	const nodeTypes = {
		0x20: 'hashmap',
		0x21: 'hashmap',
		0x22: 'hashmap',
		0x23: 'hashmap',
		0x24: 'hashmap',
		0x25: 'hashmap',
		0x26: 'hashmap',
		0x27: 'hashmap',
		0x28: 'hashmap',
		0x29: 'hashmap',
		0x2A: 'hashmap',
		0x2B: 'hashmap',
		0x2C: 'hashmap',
		0x2D: 'hashmap',
		0x2E: 'hashmap',
		0x2F: 'hashmap',
		0x30: 'ordered hash map',
		0x31: 'ordered hash map',
		0x32: 'ordered hash map',
		0x33: 'ordered hash map',
		0x34: 'ordered hash map',
		0x35: 'ordered hash map',
		0x36: 'ordered hash map',
		0x37: 'ordered hash map',
		0x38: 'ordered hash map',
		0x39: 'ordered hash map',
		0x3A: 'ordered hash map',
		0x3B: 'ordered hash map',
		0x3C: 'ordered hash map',
		0x3D: 'ordered hash map',
		0x3E: 'ordered hash map',
		0x3F: 'ordered hash map',
		0xA0: 'string',
		0xA1: 'binary data',
		0xA2: 'binary data with param',
		0xC0: 'array',
		0xC1: 'dictionary',
		0xC4: 'ordered dictionary',
		0xD0: 'bool',
		0xD1: 'integer',
		0xD2: 'float',
		0xD3: 'unsigned integer',
		0xD4: 'integer (64 bits)',
		0xD5: 'unsigned integer (64 bits)',
		0xD6: 'double',
		0xFF: 'null'
	},
	nodeValues = {
		0xA0: 'index into the string table',
		0xA1: 'absolute offset binary blob',
		0xA2: 'absolute offset binary blob',
		0xC0: 'absolute offset node',
		0xC1: 'absolute offset node',
		0xC2: 'absolute offset node',
		0xC3: 'absolute offset node',
		0xC4: 'absolute offset node',
		0xD0: 'value',
		0xD1: 'value',
		0xD2: 'value',
		0xD3: 'value',
		0xD4: 'absolut offset to the value',
		0xD5: 'absolut offset to the value',
		0xD6: 'absolut offset to the value',
		0xFF: 'always 0'
	};
	let sTableData;
	let dTableData;
	let getDataFunc;
	function processNodeTypeC2C3( dataView, offset, size, isLittleEndian ) {
		const numberStrings = dataView.getUint24( offset + 1, isLittleEndian );
		const offsets = [];
		for ( let index = offset + 4; index < offset + 4 + 4 * numberStrings; index += 4 ) {
			offsets.push( [ dataView.getUint32( index, isLittleEndian ) ] )
			if ( offsets.length < 2 ) { continue; }
			offsets[ offsets.length - 2 ][ 1 ] = offsets[ offsets.length - 1 ][ 0 ] - 1;
		}
		offsets[ offsets.length - 1 ][ 1 ] = size;
		const names = [];
		for ( let i = 0; i < offsets.length; i++ ) {
			names.push(
				getString(
					dataView,
					offset + offsets[ i ][ 0 ],
					offsets[ i ][ 1 ] - offsets[ i ][ 0 ]
				).replaceAll('\u0000', '')
			);
		}
		return names;
	}
	function processNodeTypeC0( dataView, offset, size, isLittleEndian ) {
		const numberOfElements = dataView.getUint24( offset + 1, isLittleEndian );
		const types = [];
		console.log( 'NodeType C0' );
		console.log( numberOfElements );
		const toFillUp = ( numberOfElements % 4 === 0 ? 0 : 4 - numberOfElements % 4 );
		for ( var i = 0; i < numberOfElements; i++ ) {
			const j = offset + 4;
			const offset2 = dataView.getUint32( j + numberOfElements + toFillUp + i * 4, isLittleEndian );
			types.push( {
				type: nodeTypes[ dataView.getUint8( j + i ) ],
				value: getDataFunc( dataView, offset2 )( dataView, offset2, undefined, isLittleEndian )
			} );
		}
		return types;
	}
	function processNodeTypeC1( dataView, offset, _, isLittleEndian ) {
		const numberOfElements = dataView.getUint24( offset + 1, isLittleEndian );
		const values = [];
		for ( var i = 0; i < numberOfElements; i++ ) {
			const offset2 = offset + 4 + i * 8 + 3;
			values[ dataView.getUint24( offset + 4 + i * 8, isLittleEndian ) ] = getDataFunc( dataView, offset2 )( dataView, offset2, undefined, isLittleEndian );
		}
		return values;
	}
	function processNodeTypeA0( dataView, offset, _, isLittleEndian ) {
		return {
			type: 'text',
			value: sTableData[ dataView.getUint24( offset + 1, isLittleEndian) ]
		}
	}

	getDataFunc = function( dataView, offset ) {
		const t = dataView.getUint8( offset );
		if ( t === 0xC2 || t === 0xC3 ) {
			return processNodeTypeC2C3;
		} else if ( t === 0xC0 ) {
			return processNodeTypeC0;
		} else if ( t === 0xC1 ) {
			return processNodeTypeC1;
		} else if ( t === 0xA0 ) {
			return processNodeTypeA0;
		}
		throw new Error ('Unable to process type ' + ( t ).toString( 16 ));
	}

	function formatOutput( header, json ) {
		const table = document.createElement( 'table' ),
			tHead = table.createTHead(),
			tBody = table.createTBody();

		table.className = 'wikitable stickytable';
		table.createCaption().textContent = 'Dictionary'

		const hRow = tHead.insertRow( -1 );
		hRow.appendChild( document.createElement( 'th' ) ).textContent = header[ 0 ];
		hRow.appendChild( document.createElement( 'th' ) ).textContent = header[ 1 ];

		json.forEach( ( i ) => {
			if ( i.type !== 'dictionary' ) {
				console.log( i );
			}
			const bRow = tBody.insertRow( -1 );
			bRow.insertCell( -1 ).textContent = `${ i.value[ 0 ].type }: ${ i.value[ 0 ].value }`;
			bRow.insertCell( -1 ).textContent = `${ i.value[ 1 ].type }: ${ i.value[ 1 ].value }`;
		} );

		return table;
	}

	addFormat( {
		name: 'BYAML',
		extensions: [ '.byml' ],
		magic: ['BY', 'YB'],
		func: function ( dataView ) {
			const te8 = new TextDecoder( 'utf-8' ),
				isLittleEndian = te8.decode( dataView.buffer.slice( 0x0, 0x2 ) ) === 'YB',
				header = {
					version: dataView.getUint16( 0x2, isLittleEndian ),
					dTableOffset: dataView.getUint32( 0x4, isLittleEndian ), // dictionary key table
					sTableOffset: dataView.getUint32( 0x8, isLittleEndian ), // string table
					rTableOffset: dataView.getUint32( 0xC, isLittleEndian ), // root node
					bTableOffset: 0
				};
				header.magic = te8.decode( dataView.buffer.slice( 0x0, 0x2 ) );
			if ( header.rTableOffset === 0 ) { // For Mario Kart 8
				header.bTableOffset = dataView.getUint8( 0xC );
				header.rTableOffset = dataView.getUint8( 0x10 );
			}
			// console.log( header );
			dTableData = getDataFunc( dataView, header.dTableOffset )( dataView, header.dTableOffset, header.sTableOffset - header.dTableOffset, isLittleEndian );
			sTableData = getDataFunc( dataView, header.sTableOffset )( dataView, header.sTableOffset, header.rTableOffset - header.sTableOffset, isLittleEndian );
			const json = getDataFunc( dataView, header.rTableOffset )( dataView, header.rTableOffset, dataView.buffer.length - header.rTableOffset, isLittleEndian );
			return formatOutput( dTableData, json );
		}
	});
} )();