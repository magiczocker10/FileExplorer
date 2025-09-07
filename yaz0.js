window.yaz0 = {
	decode: function ( src, uncompressedSize ) { // Source: www.amnoid.de/gc/yaz0.txt
		let srcCursor = 0,
			dstCursor = 0,
			validBitCounter = 0,
			currCodeByte;
		const dst = new Uint8Array( uncompressedSize );
		while ( dstCursor < uncompressedSize ) {
			if ( validBitCounter === 0 ) {
				currCodeByte = src[ srcCursor ];
				srcCursor++;
				validBitCounter = 8;
			}

			if ( ( currCodeByte & 0x80 ) !== 0 ) {
				dst[ dstCursor ] = src[ srcCursor ];
				dstCursor++;
				srcCursor++;
			} else { // RLE Part
				const byte1 = src[ srcCursor ],
					byte2 = src[ srcCursor + 1 ];
				srcCursor += 2;
				const dist = ( ( byte1 & 0xF ) << 8 ) | byte2;
				let copySource = dstCursor - ( dist + 1 );

				let numBytes = byte1 >> 4;
				if ( numBytes === 0 ) {
					numBytes = src[ srcCursor ] + 0x12;
					srcCursor++;
				} else {
					numBytes += 2;
				}

				// copy run
				for ( let i = 0; i < numBytes; i++ ) {
					dst[ dstCursor ] = dst[ copySource ];
					copySource++;
					dstCursor++;
				}
			}

			// use next bit from "code" byte
			currCodeByte <<= 1;
			validBitCounter -= 1;
		}
		return dst;
	}
};
