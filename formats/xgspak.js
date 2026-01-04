// https://github.com/WerWolv/ImHex-Patterns/blob/master/patterns/xgspak.hexpat
addFormat( {
	name: 'PAK (Exient XGS Engine)',
	extensions: [ '.pak' ],
	magic: [ 'KPX', 'XPK' ],
	magicStart: 0x01,
	func: function ( dataView ) {
		const head = {
			magic: getString( dataView, 1, 3 ),
			ver: dataView.getUint8( 0x0 ),
			folders: dataView.getUint32( 0x04, true ),
			files: dataView.getUint32( 0x08, true ),
			fileContentTableSize: dataView.getUint32( 0x0C, true )
		};

		function offToStringTable() {
			const headSize = 16 + (head.ver === 2 ? 1 : 0 );
			if (head.ver === 0 ) {
				return ( ( 0x14 * head.folders ) + ( 0x18 * head.files ) ) + headSize;
			} else if (head.ver === 1 || head.ver === 2 ) {
				return ( ( 0x20 * head.folders ) + ( 0x20 * head.files ) ) + headSize;
			}
		}

		function readName( offset ) {
			let l = 0;
			while ( dataView.getUint8( offset + l ) !== 0 ) {
				l++;
			}
			return getString( dataView,  offset, l );
		}

		function readFolderStructure() {
			let pos = 16 + (head.ver === 2 ? 1 : 0 );
			const data = [];
			for ( let i = 0; i < head.folders; i++ ) {
				if ( head.ver === 0 ) {
					data.push( {
						name: readName( offToStringTable() + dataView.getUint32( pos, true ) ),
						filesInFolder: dataView.getUint32( pos + 4, true ),
						subFolders: dataView.getUint32( pos + 8, true ),
						filesPos: dataView.getUint32( pos + 12, true ),
						foldersPos: dataView.getUint32( pos + 16, true )
				 	} );
					pos += 4 * 5;
				} else if ( head.magic === "XPK" ) {
					data.push( {
						name: readName( offToStringTable() + dataView.getUint32( pos + 4, true ) ),
						filesPos: dataView.getUint32( pos + 12, true ),
						foldersPos: dataView.getUint32( pos + 20, true ),
						filesInFolder: dataView.getUint32( pos + 24, true ),
						subFolders: dataView.getUint32( pos + 28, true )
				 	} );
					pos += 4 * 8;
				} else {
					data.push( {
						name: readName( offToStringTable() + Number( dataView.getUint64( pos, true ) ) ),
						filesPos: dataView.getUint64( pos + 8, true ),
						foldersPos: dataView.getUint64( pos + 16, true ),
						filesInFolder: dataView.getUint32( pos + 24, true ),
						subFolders: dataView.getUint32( pos + 28, true )
				 	} );
					pos += 4 * 8;
				}
			}
			return [ data, pos ];
		}

		function readContent( startOffset ) {
			let pos = startOffset;
			const data = [],
				uncompressedFiles = [];
			for ( let i = 0; i < head.files; i++ ) {
				if ( head.ver === 0 ) {
					data.push( {
						name: readName( offToStringTable() + dataView.getUint32( pos, true ) ),
						decompFileSize: dataView.getUint32( pos + 4, true ),
						fileOff: dataView.getUint32( pos + 8, true ),
						compressed: dataView.getUint32( pos + 12, true ),
						timestamp: dataView.getUint32( pos + 16, true ),
						compFileSize: dataView.getUint32( pos + 20, true )
				 	} );
					pos += 4 * 6;
				} else if ( head.magic === "XPK" ) {
					data.push( {
						name: readName( offToStringTable() + dataView.getUint32( pos + 4, true ) ),
						decompFileSize: dataView.getUint32( pos + 8, true ),
						fileOff: dataView.getUint32( pos + 12, true ),
						compressed: dataView.getUint32( pos + 16, true ),
						timestamp: new Date( dataView.getUint32( pos + 20, true ) * 1000 ),
						compFileSize: dataView.getUint32( pos + 24, true )
				 	} );
					pos += 4 * 8;
				} else {
					data.push( {
						name: readName( offToStringTable() + Number( dataView.getUint64( pos, true ) ) ),
						decompFileSize: dataView.getUint32( pos + 8, true ),
						fileOff: dataView.getUint32( pos + 12, true ),
						compressed: dataView.getUint32( pos + 16, true ),
						timestamp: new Date( dataView.getUint32( pos + 20, true ) * 1000 ),
						compFileSize: dataView.getUint64( pos + 24, true )
				 	} );
					pos += 4 * 8;
				}
				if ( !data[data.length - 1].compressed ) {
					uncompressedFiles.push( i );
				}
			}
			return [ data, pos ];
		}

		function download2( e ) {
			const a = document.createElement( 'a' ),
				file = content[ e.target.dataset.fileId ];
			let fileContent = dataView.buffer.slice(
				file.fileOff,
				file.fileOff + ( file.compressed ? file.compFileSize : file.decompFileSize ),
			);
			if ( file.compressed ) {
				fileContent = String.fromCharCode.apply( null, new Uint16Array( pako.inflate( new Uint8Array( fileContent ) ) ) );
			}

			const blobData = new Blob( [ fileContent ], { type: 'text/plain' } );
			a.href = URL.createObjectURL( blobData );
			a.download = file.name;
			a.click();
		}

		const [ data, pos ] = readFolderStructure();
		const [ content, pos2 ] = readContent( pos );

		const output = document.createElement( 'div' ),
			table = output.appendChild( document.createElement( 'table' ) ),
			tableHead = table.createTHead(),
			tableBody = table.createTBody(),
			headerRow = tableHead.insertRow( -1 ),
			bodyRow = tableBody.insertRow( -1 );
		table.className = 'wikitable';
		headerRow.appendChild( document.createElement( 'th' ) ).textContent = 'Version';
		headerRow.appendChild( document.createElement( 'th' ) ).textContent = 'Folders';
		headerRow.appendChild( document.createElement( 'th' ) ).textContent = 'Files';
		bodyRow.insertCell().textContent = head.ver;
		bodyRow.insertCell().textContent = head.folders;
		bodyRow.insertCell().textContent = head.files;

		let fileCount = 0;
		let folderCount = 0;
		function getFolder( parent ) {
			const folderData = data[ folderCount ];
			const detail = parent.appendChild( document.createElement( 'details' ) ),
				summary = detail.appendChild( document.createElement( 'summary' ) );
			summary.textContent = folderData.name;
			for ( let g = 0; g < folderData.subFolders; g++ ) {
				folderCount++;
				getFolder( detail );
			}
			for ( let f = 0; f < folderData.filesInFolder; f++ ) {
				const ul = detail.appendChild( document.createElement( 'ul' ) ),
					li = ul.appendChild( document.createElement( 'li' ) ),
					file = content[ fileCount ];
				li.textContent = file.name + ' (' + ( file.decompFileSize ) + ' Bytes / ' + (file.compressed ? 'Compr.' : 'Uncompr.') + ')';
				const download = li.appendChild( document.createElement( 'button' ) );
				download.textContent = 'Download';
				download.dataset.fileId = fileCount;
				download.addEventListener( 'click', download2 );
				fileCount++;
			}
		}

		while ( folderCount < data.length ) {
			getFolder( output );
			folderCount++;
		}

		return output;
	}
} );