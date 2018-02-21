/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

THREE.ColladaLoader = function( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.ColladaLoader.prototype = {

	constructor: THREE.ColladaLoader,

	crossOrigin: 'Anonymous',

	load: function( url, onLoad, onProgress, onError ) {

		let scope = this;

		let path = scope.path === undefined ? THREE.LoaderUtils.extractUrlBase( url ) : scope.path;

		let loader = new THREE.FileLoader( scope.manager );
		loader.load( url, function( text ) {

			onLoad( scope.parse( text, path ) );

		}, onProgress, onError );

	},

	setPath: function( value ) {

		this.path = value;

	},

	options: {

		set convertUpAxis( value ) {

			console.warn( 'THREE.ColladaLoader: options.convertUpAxis() has been removed. Up axis is converted automatically.' );

		},

	},

	setCrossOrigin: function( value ) {

		this.crossOrigin = value;

	},

	parse: function( text, path ) {

		function getElementsByTagName( xml, name ) {

			// Non recursive xml.getElementsByTagName() ...

			let array = [];
			let childNodes = xml.childNodes;

			for ( let i = 0, l = childNodes.length; i < l; i ++ ) {

				let child = childNodes[i];

				if ( child.nodeName === name ) {

					array.push( child );

				}

			}

			return array;

		}

		function parseStrings( text ) {

			if ( text.length === 0 ) return [];

			let parts = text.trim().split( /\s+/ );
			let array = new Array( parts.length );

			for ( let i = 0, l = parts.length; i < l; i ++ ) {

				array[i] = parts[i];

			}

			return array;

		}

		function parseFloats( text ) {

			if ( text.length === 0 ) return [];

			let parts = text.trim().split( /\s+/ );
			let array = new Array( parts.length );

			for ( let i = 0, l = parts.length; i < l; i ++ ) {

				array[i] = parseFloat( parts[i] );

			}

			return array;

		}

		function parseInts( text ) {

			if ( text.length === 0 ) return [];

			let parts = text.trim().split( /\s+/ );
			let array = new Array( parts.length );

			for ( let i = 0, l = parts.length; i < l; i ++ ) {

				array[i] = parseInt( parts[i] );

			}

			return array;

		}

		function parseId( text ) {

			return text.substring( 1 );

		}

		function generateId() {

			return 'three_default_' + ( count ++ );

		}

		function isEmpty( object ) {

			return Object.keys( object ).length === 0;

		}

		// asset

		function parseAsset( xml ) {

			return {
				unit: parseAssetUnit( getElementsByTagName( xml, 'unit' )[0] ),
				upAxis: parseAssetUpAxis( getElementsByTagName( xml, 'up_axis' )[0] ),
			};

		}

		function parseAssetUnit( xml ) {

			return xml !== undefined ? parseFloat( xml.getAttribute( 'meter' ) ) : 1;

		}

		function parseAssetUpAxis( xml ) {

			return xml !== undefined ? xml.textContent : 'Y_UP';

		}

		// library

		function parseLibrary( xml, libraryName, nodeName, parser ) {

			let library = getElementsByTagName( xml, libraryName )[0];

			if ( library !== undefined ) {

				let elements = getElementsByTagName( library, nodeName );

				for ( let i = 0; i < elements.length; i ++ ) {

					parser( elements[i] );

				}

			}

		}

		function buildLibrary( data, builder ) {

			for ( let name in data ) {

				let object = data[name];
				object.build = builder( data[name] );

			}

		}

		// get

		function getBuild( data, builder ) {

			if ( data.build !== undefined ) return data.build;

			data.build = builder( data );

			return data.build;

		}

		// animation

		function parseAnimation( xml ) {

			let data = {
				sources: {},
				samplers: {},
				channels: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				var id;

				switch ( child.nodeName ) {

					case 'source':
						id = child.getAttribute( 'id' );
						data.sources[id] = parseSource( child );
						break;

					case 'sampler':
						id = child.getAttribute( 'id' );
						data.samplers[id] = parseAnimationSampler( child );
						break;

					case 'channel':
						id = child.getAttribute( 'target' );
						data.channels[id] = parseAnimationChannel( child );
						break;

					default:
						console.log( child );

				}

			}

			library.animations[xml.getAttribute( 'id' )] = data;

		}

		function parseAnimationSampler( xml ) {

			let data = {
				inputs: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'input':
						var id = parseId( child.getAttribute( 'source' ) );
						var semantic = child.getAttribute( 'semantic' );
						data.inputs[semantic] = id;
						break;

				}

			}

			return data;

		}

		function parseAnimationChannel( xml ) {

			let data = {};

			let target = xml.getAttribute( 'target' );

			// parsing SID Addressing Syntax

			let parts = target.split( '/' );

			let id = parts.shift();
			let sid = parts.shift();

			// check selection syntax

			let arraySyntax = ( sid.indexOf( '(' ) !== - 1 );
			let memberSyntax = ( sid.indexOf( '.' ) !== - 1 );

			if ( memberSyntax ) {

				//  member selection access

				parts = sid.split( '.' );
				sid = parts.shift();
				data.member = parts.shift();

			} else if ( arraySyntax ) {

				// array-access syntax. can be used to express fields in one-dimensional vectors or two-dimensional matrices.

				let indices = sid.split( '(' );
				sid = indices.shift();

				for ( let i = 0; i < indices.length; i ++ ) {

					indices[i] = parseInt( indices[i].replace( /\)/, '' ) );

				}

				data.indices = indices;

			}

			data.id = id;
			data.sid = sid;

			data.arraySyntax = arraySyntax;
			data.memberSyntax = memberSyntax;

			data.sampler = parseId( xml.getAttribute( 'source' ) );

			return data;

		}

		function buildAnimation( data ) {

			let tracks = [];

			let channels = data.channels;
			let samplers = data.samplers;
			let sources = data.sources;

			for ( let target in channels ) {

				if ( channels.hasOwnProperty( target ) ) {

					let channel = channels[target];
					let sampler = samplers[channel.sampler];

					let inputId = sampler.inputs.INPUT;
					let outputId = sampler.inputs.OUTPUT;

					let inputSource = sources[inputId];
					let outputSource = sources[outputId];

					let animation = buildAnimationChannel( channel, inputSource, outputSource );

					createKeyframeTracks( animation, tracks );

				}

			}

			return tracks;

		}

		function getAnimation( id ) {

			return getBuild( library.animations[id], buildAnimation );

		}

		function buildAnimationChannel( channel, inputSource, outputSource ) {

			let node = library.nodes[channel.id];
			let object3D = getNode( node.id );

			let transform = node.transforms[channel.sid];
			let defaultMatrix = node.matrix.clone().transpose();

			let time, stride;
			let i, il, j, jl;

			let data = {};

			// the collada spec allows the animation of data in various ways.
			// depending on the transform type (matrix, translate, rotate, scale), we execute different logic

			switch ( transform ) {

				case 'matrix':

					for ( i = 0, il = inputSource.array.length; i < il; i ++ ) {

						time = inputSource.array[i];
						stride = i * outputSource.stride;

						if ( data[time] === undefined ) data[time] = {};

						if ( channel.arraySyntax === true ) {

							let value = outputSource.array[stride];
							let index = channel.indices[0] + 4 * channel.indices[1];

							data[time][index] = value;

						} else {

							for ( j = 0, jl = outputSource.stride; j < jl; j ++ ) {

								data[time][j] = outputSource.array[stride + j];

							}

						}

					}

					break;

				case 'translate':
					console.warn( 'THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform );
					break;

				case 'rotate':
					console.warn( 'THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform );
					break;

				case 'scale':
					console.warn( 'THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform );
					break;

			}

			let keyframes = prepareAnimationData( data, defaultMatrix );

			let animation = {
				name: object3D.uuid,
				keyframes: keyframes,
			};

			return animation;

		}

		function prepareAnimationData( data, defaultMatrix ) {

			let keyframes = [];

			// transfer data into a sortable array

			for ( let time in data ) {

				keyframes.push( {time: parseFloat( time ), value: data[time]} );

			}

			// ensure keyframes are sorted by time

			keyframes.sort( ascending );

			// now we clean up all animation data, so we can use them for keyframe tracks

			for ( let i = 0; i < 16; i ++ ) {

				transformAnimationData( keyframes, i, defaultMatrix.elements[i] );

			}

			return keyframes;

			// array sort function

			function ascending( a, b ) {

				return a.time - b.time;

			}

		}

		let position = new THREE.Vector3();
		let scale = new THREE.Vector3();
		let quaternion = new THREE.Quaternion();

		function createKeyframeTracks( animation, tracks ) {

			let keyframes = animation.keyframes;
			let name = animation.name;

			let times = [];
			let positionData = [];
			let quaternionData = [];
			let scaleData = [];

			for ( let i = 0, l = keyframes.length; i < l; i ++ ) {

				let keyframe = keyframes[i];

				let time = keyframe.time;
				let value = keyframe.value;

				matrix.fromArray( value ).transpose();
				matrix.decompose( position, quaternion, scale );

				times.push( time );
				positionData.push( position.x, position.y, position.z );
				quaternionData.push( quaternion.x, quaternion.y, quaternion.z, quaternion.w );
				scaleData.push( scale.x, scale.y, scale.z );

			}

			if ( positionData.length > 0 ) tracks.push( new THREE.VectorKeyframeTrack( name + '.position', times, positionData ) );
			if ( quaternionData.length > 0 ) tracks.push( new THREE.QuaternionKeyframeTrack( name + '.quaternion', times, quaternionData ) );
			if ( scaleData.length > 0 ) tracks.push( new THREE.VectorKeyframeTrack( name + '.scale', times, scaleData ) );

			return tracks;

		}

		function transformAnimationData( keyframes, property, defaultValue ) {

			let keyframe;

			let empty = true;
			let i, l;

			// check, if values of a property are missing in our keyframes

			for ( i = 0, l = keyframes.length; i < l; i ++ ) {

				keyframe = keyframes[i];

				if ( keyframe.value[property] === undefined ) {

					keyframe.value[property] = null; // mark as missing

				} else {

					empty = false;

				}

			}

			if ( empty === true ) {

				// no values at all, so we set a default value

				for ( i = 0, l = keyframes.length; i < l; i ++ ) {

					keyframe = keyframes[i];

					keyframe.value[property] = defaultValue;

				}

			} else {

				// filling gaps

				createMissingKeyframes( keyframes, property );

			}

		}

		function createMissingKeyframes( keyframes, property ) {

			let prev, next;

			for ( let i = 0, l = keyframes.length; i < l; i ++ ) {

				let keyframe = keyframes[i];

				if ( keyframe.value[property] === null ) {

					prev = getPrev( keyframes, i, property );
					next = getNext( keyframes, i, property );

					if ( prev === null ) {

						keyframe.value[property] = next.value[property];
						continue;

					}

					if ( next === null ) {

						keyframe.value[property] = prev.value[property];
						continue;

					}

					interpolate( keyframe, prev, next, property );

				}

			}

		}

		function getPrev( keyframes, i, property ) {

			while ( i >= 0 ) {

				let keyframe = keyframes[i];

				if ( keyframe.value[property] !== null ) return keyframe;

				i --;

			}

			return null;

		}

		function getNext( keyframes, i, property ) {

			while ( i < keyframes.length ) {

				let keyframe = keyframes[i];

				if ( keyframe.value[property] !== null ) return keyframe;

				i ++;

			}

			return null;

		}

		function interpolate( key, prev, next, property ) {

			if ( ( next.time - prev.time ) === 0 ) {

				key.value[property] = prev.value[property];
				return;

			}

			key.value[property] = ( ( key.time - prev.time ) * ( next.value[property] - prev.value[property] ) / ( next.time - prev.time ) ) + prev.value[property];

		}

		// animation clips

		function parseAnimationClip( xml ) {

			let data = {
				name: xml.getAttribute( 'id' ) || 'default',
				start: parseFloat( xml.getAttribute( 'start' ) || 0 ),
				end: parseFloat( xml.getAttribute( 'end' ) || 0 ),
				animations: [],
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'instance_animation':
						data.animations.push( parseId( child.getAttribute( 'url' ) ) );
						break;

				}

			}

			library.clips[xml.getAttribute( 'id' )] = data;

		}

		function buildAnimationClip( data ) {

			let tracks = [];

			let name = data.name;
			let duration = ( data.end - data.start ) || - 1;
			let animations = data.animations;

			for ( let i = 0, il = animations.length; i < il; i ++ ) {

				let animationTracks = getAnimation( animations[i] );

				for ( let j = 0, jl = animationTracks.length; j < jl; j ++ ) {

					tracks.push( animationTracks[j] );

				}

			}

			return new THREE.AnimationClip( name, duration, tracks );

		}

		function getAnimationClip( id ) {

			return getBuild( library.clips[id], buildAnimationClip );

		}

		// controller

		function parseController( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'skin':
						// there is exactly one skin per controller
						data.id = parseId( child.getAttribute( 'source' ) );
						data.skin = parseSkin( child );
						break;

					case 'morph':
						data.id = parseId( child.getAttribute( 'source' ) );
						console.warn( 'THREE.ColladaLoader: Morph target animation not supported yet.' );
						break;

				}

			}

			library.controllers[xml.getAttribute( 'id' )] = data;

		}

		function parseSkin( xml ) {

			let data = {
				sources: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'bind_shape_matrix':
						data.bindShapeMatrix = parseFloats( child.textContent );
						break;

					case 'source':
						var id = child.getAttribute( 'id' );
						data.sources[id] = parseSource( child );
						break;

					case 'joints':
						data.joints = parseJoints( child );
						break;

					case 'vertex_weights':
						data.vertexWeights = parseVertexWeights( child );
						break;

				}

			}

			return data;

		}

		function parseJoints( xml ) {

			let data = {
				inputs: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'input':
						var semantic = child.getAttribute( 'semantic' );
						var id = parseId( child.getAttribute( 'source' ) );
						data.inputs[semantic] = id;
						break;

				}

			}

			return data;

		}

		function parseVertexWeights( xml ) {

			let data = {
				inputs: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'input':
						var semantic = child.getAttribute( 'semantic' );
						var id = parseId( child.getAttribute( 'source' ) );
						var offset = parseInt( child.getAttribute( 'offset' ) );
						data.inputs[semantic] = {id: id, offset: offset};
						break;

					case 'vcount':
						data.vcount = parseInts( child.textContent );
						break;

					case 'v':
						data.v = parseInts( child.textContent );
						break;

				}

			}

			return data;

		}

		function buildController( data ) {

			let build = {
				id: data.id,
			};

			let geometry = library.geometries[build.id];

			if ( data.skin !== undefined ) {

				build.skin = buildSkin( data.skin );

				// we enhance the 'sources' property of the corresponding geometry with our skin data

				geometry.sources.skinIndices = build.skin.indices;
				geometry.sources.skinWeights = build.skin.weights;

			}

			return build;

		}

		function buildSkin( data ) {

			let BONE_LIMIT = 4;

			let build = {
				joints: [], // this must be an array to preserve the joint order
				indices: {
					array: [],
					stride: BONE_LIMIT,
				},
				weights: {
					array: [],
					stride: BONE_LIMIT,
				},
			};

			let sources = data.sources;
			let vertexWeights = data.vertexWeights;

			let vcount = vertexWeights.vcount;
			let v = vertexWeights.v;
			let jointOffset = vertexWeights.inputs.JOINT.offset;
			let weightOffset = vertexWeights.inputs.WEIGHT.offset;

			let jointSource = data.sources[data.joints.inputs.JOINT];
			let inverseSource = data.sources[data.joints.inputs.INV_BIND_MATRIX];

			let weights = sources[vertexWeights.inputs.WEIGHT.id].array;
			let stride = 0;

			let i, j, l;

			// procces skin data for each vertex

			for ( i = 0, l = vcount.length; i < l; i ++ ) {

				let jointCount = vcount[i]; // this is the amount of joints that affect a single vertex
				let vertexSkinData = [];

				for ( j = 0; j < jointCount; j ++ ) {

					let skinIndex = v[stride + jointOffset];
					let weightId = v[stride + weightOffset];
					let skinWeight = weights[weightId];

					vertexSkinData.push( {index: skinIndex, weight: skinWeight} );

					stride += 2;

				}

				// we sort the joints in descending order based on the weights.
				// this ensures, we only procced the most important joints of the vertex

				vertexSkinData.sort( descending );

				// now we provide for each vertex a set of four index and weight values.
				// the order of the skin data matches the order of vertices

				for ( j = 0; j < BONE_LIMIT; j ++ ) {

					let d = vertexSkinData[j];

					if ( d !== undefined ) {

						build.indices.array.push( d.index );
						build.weights.array.push( d.weight );

					} else {

						build.indices.array.push( 0 );
						build.weights.array.push( 0 );

					}

				}

			}

			// setup bind matrix

			build.bindMatrix = new THREE.Matrix4().fromArray( data.bindShapeMatrix ).transpose();

			// process bones and inverse bind matrix data

			for ( i = 0, l = jointSource.array.length; i < l; i ++ ) {

				let name = jointSource.array[i];
				let boneInverse = new THREE.Matrix4().fromArray( inverseSource.array, i * inverseSource.stride ).transpose();

				build.joints.push( {name: name, boneInverse: boneInverse} );

			}

			return build;

			// array sort function

			function descending( a, b ) {

				return b.weight - a.weight;

			}

		}

		function getController( id ) {

			return getBuild( library.controllers[id], buildController );

		}

		// image

		function parseImage( xml ) {

			let data = {
				init_from: getElementsByTagName( xml, 'init_from' )[0].textContent,
			};

			library.images[xml.getAttribute( 'id' )] = data;

		}

		function buildImage( data ) {

			if ( data.build !== undefined ) return data.build;

			return data.init_from;

		}

		function getImage( id ) {

			return getBuild( library.images[id], buildImage );

		}

		// effect

		function parseEffect( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'profile_COMMON':
						data.profile = parseEffectProfileCOMMON( child );
						break;

				}

			}

			library.effects[xml.getAttribute( 'id' )] = data;

		}

		function parseEffectProfileCOMMON( xml ) {

			let data = {
				surfaces: {},
				samplers: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'newparam':
						parseEffectNewparam( child, data );
						break;

					case 'technique':
						data.technique = parseEffectTechnique( child );
						break;

					case 'extra':
						data.extra = parseEffectExtra( child );
						break;

				}

			}

			return data;

		}

		function parseEffectNewparam( xml, data ) {

			let sid = xml.getAttribute( 'sid' );

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'surface':
						data.surfaces[sid] = parseEffectSurface( child );
						break;

					case 'sampler2D':
						data.samplers[sid] = parseEffectSampler( child );
						break;

				}

			}

		}

		function parseEffectSurface( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'init_from':
						data.init_from = child.textContent;
						break;

				}

			}

			return data;

		}

		function parseEffectSampler( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'source':
						data.source = child.textContent;
						break;

				}

			}

			return data;

		}

		function parseEffectTechnique( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'constant':
					case 'lambert':
					case 'blinn':
					case 'phong':
						data.type = child.nodeName;
						data.parameters = parseEffectParameters( child );
						break;

				}

			}

			return data;

		}

		function parseEffectParameters( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'emission':
					case 'diffuse':
					case 'specular':
					case 'shininess':
					case 'transparency':
						data[child.nodeName] = parseEffectParameter( child );
						break;
					case 'transparent':
						data[child.nodeName] = {
							opaque: child.getAttribute( 'opaque' ),
							data: parseEffectParameter( child ),
						};
						break;

				}

			}

			return data;

		}

		function parseEffectParameter( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'color':
						data[child.nodeName] = parseFloats( child.textContent );
						break;

					case 'float':
						data[child.nodeName] = parseFloat( child.textContent );
						break;

					case 'texture':
						data[child.nodeName] = {id: child.getAttribute( 'texture' ), extra: parseEffectParameterTexture( child )};
						break;

				}

			}

			return data;

		}

		function parseEffectParameterTexture( xml ) {

			let data = {
				technique: {},
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'extra':
						parseEffectParameterTextureExtra( child, data );
						break;

				}

			}

			return data;

		}

		function parseEffectParameterTextureExtra( xml, data ) {

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'technique':
						parseEffectParameterTextureExtraTechnique( child, data );
						break;

				}

			}

		}

		function parseEffectParameterTextureExtraTechnique( xml, data ) {

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'repeatU':
					case 'repeatV':
					case 'offsetU':
					case 'offsetV':
						data.technique[child.nodeName] = parseFloat( child.textContent );
						break;

					case 'wrapU':
					case 'wrapV':

						// some files have values for wrapU/wrapV which become NaN via parseInt

						if ( child.textContent.toUpperCase() === 'TRUE' ) {

							data.technique[child.nodeName] = 1;

						} else if ( child.textContent.toUpperCase() === 'FALSE' ) {

							data.technique[child.nodeName] = 0;

						} else {

							data.technique[child.nodeName] = parseInt( child.textContent );

						}

						break;

				}

			}

		}

		function parseEffectExtra( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'technique':
						data.technique = parseEffectExtraTechnique( child );
						break;

				}

			}

			return data;

		}

		function parseEffectExtraTechnique( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'double_sided':
						data[child.nodeName] = parseInt( child.textContent );
						break;

				}

			}

			return data;

		}

		function buildEffect( data ) {

			return data;

		}

		function getEffect( id ) {

			return getBuild( library.effects[id], buildEffect );

		}

		// material

		function parseMaterial( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ),
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'instance_effect':
						data.url = parseId( child.getAttribute( 'url' ) );
						break;

				}

			}

			library.materials[xml.getAttribute( 'id' )] = data;

		}

		function buildMaterial( data ) {

			let effect = getEffect( data.url );
			let technique = effect.profile.technique;
			let extra = effect.profile.extra;

			let material;

			switch ( technique.type ) {

				case 'phong':
				case 'blinn':
					material = new THREE.MeshPhongMaterial();
					break;

				case 'lambert':
					material = new THREE.MeshLambertMaterial();
					break;

				default:
					material = new THREE.MeshBasicMaterial();
					break;

			}

			material.name = data.name;

			function getTexture( textureObject ) {

				let sampler = effect.profile.samplers[textureObject.id];
				let image;

				// get image

				if ( sampler !== undefined ) {

					let surface = effect.profile.surfaces[sampler.source];
					image = getImage( surface.init_from );

				} else {

					console.warn( 'THREE.ColladaLoader: Undefined sampler. Access image directly (see #12530).' );
					image = getImage( textureObject.id );

				}

				// create texture if image is avaiable

				if ( image !== undefined ) {

					let texture = textureLoader.load( image );

					let extra = textureObject.extra;

					if ( extra !== undefined && extra.technique !== undefined && isEmpty( extra.technique ) === false ) {

						let technique = extra.technique;

						texture.wrapS = technique.wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
						texture.wrapT = technique.wrapV ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;

						texture.offset.set( technique.offsetU || 0, technique.offsetV || 0 );
						texture.repeat.set( technique.repeatU || 1, technique.repeatV || 1 );

					} else {

						texture.wrapS = THREE.RepeatWrapping;
						texture.wrapT = THREE.RepeatWrapping;

					}

					return texture;

				} else {

					console.error( 'THREE.ColladaLoader: Unable to load texture with ID:', textureObject.id );

					return null;

				}

			}

			let parameters = technique.parameters;

			for ( let key in parameters ) {

				let parameter = parameters[key];

				switch ( key ) {

					case 'diffuse':
						if ( parameter.color ) material.color.fromArray( parameter.color );
						if ( parameter.texture ) material.map = getTexture( parameter.texture );
						break;
					case 'specular':
						if ( parameter.color && material.specular ) material.specular.fromArray( parameter.color );
						if ( parameter.texture ) material.specularMap = getTexture( parameter.texture );
						break;
					case 'shininess':
						if ( parameter.float && material.shininess )
							{material.shininess = parameter.float;}
						break;
					case 'emission':
						if ( parameter.color && material.emissive )
							{material.emissive.fromArray( parameter.color );}
						break;

				}

			}

			//

			let transparent = parameters.transparent;
			let transparency = parameters.transparency;

			// <transparency> does not exist but <transparent>

			if ( transparency === undefined && transparent ) {

				transparency = {
					float: 1,
				};

			}

			// <transparent> does not exist but <transparency>

			if ( transparent === undefined && transparency ) {

				transparent = {
					opaque: 'A_ONE',
					data: {
						color: [1, 1, 1, 1],
					}};

			}

			if ( transparent && transparency ) {

				// handle case if a texture exists but no color

				if ( transparent.data.texture ) {

					material.alphaMap = getTexture( transparent.data.texture );
					material.transparent = true;

				} else {

					let color = transparent.data.color;

					switch ( transparent.opaque ) {

						case 'A_ONE':
							material.opacity = color[3] * transparency.float;
							break;
						case 'RGB_ZERO':
							material.opacity = 1 - ( color[0] * transparency.float );
							break;
						case 'A_ZERO':
							material.opacity = 1 - ( color[3] * transparency.float );
							break;
						case 'RGB_ONE':
							material.opacity = color[0] * transparency.float;
							break;
						default:
							console.warn( 'THREE.ColladaLoader: Invalid opaque type "%s" of transparent tag.', transparent.opaque );

					}

					if ( material.opacity < 1 ) material.transparent = true;

				}

			}

			//

			if ( extra !== undefined && extra.technique !== undefined && extra.technique.double_sided === 1 ) {

				material.side = THREE.DoubleSide;

			}

			return material;

		}

		function getMaterial( id ) {

			return getBuild( library.materials[id], buildMaterial );

		}

		// camera

		function parseCamera( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ),
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'optics':
						data.optics = parseCameraOptics( child );
						break;

				}

			}

			library.cameras[xml.getAttribute( 'id' )] = data;

		}

		function parseCameraOptics( xml ) {

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				switch ( child.nodeName ) {

					case 'technique_common':
						return parseCameraTechnique( child );

				}

			}

			return {};

		}

		function parseCameraTechnique( xml ) {

			let data = {};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				switch ( child.nodeName ) {

					case 'perspective':
					case 'orthographic':

						data.technique = child.nodeName;
						data.parameters = parseCameraParameters( child );

						break;

				}

			}

			return data;

		}

		function parseCameraParameters( xml ) {

			let data = {};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				switch ( child.nodeName ) {

					case 'xfov':
					case 'yfov':
					case 'xmag':
					case 'ymag':
					case 'znear':
					case 'zfar':
					case 'aspect_ratio':
						data[child.nodeName] = parseFloat( child.textContent );
						break;

				}

			}

			return data;

		}

		function buildCamera( data ) {

			let camera;

			switch ( data.optics.technique ) {

				case 'perspective':
					camera = new THREE.PerspectiveCamera(
						data.optics.parameters.yfov,
						data.optics.parameters.aspect_ratio,
						data.optics.parameters.znear,
						data.optics.parameters.zfar
					);
					break;

				case 'orthographic':
					var ymag = data.optics.parameters.ymag;
					var xmag = data.optics.parameters.xmag;
					var aspectRatio = data.optics.parameters.aspect_ratio;

					xmag = ( xmag === undefined ) ? ( ymag * aspectRatio ) : xmag;
					ymag = ( ymag === undefined ) ? ( xmag / aspectRatio ) : ymag;

					xmag *= 0.5;
					ymag *= 0.5;

					camera = new THREE.OrthographicCamera(
						- xmag, xmag, ymag, - ymag, // left, right, top, bottom
						data.optics.parameters.znear,
						data.optics.parameters.zfar
					);
					break;

				default:
					camera = new THREE.PerspectiveCamera();
					break;

			}

			camera.name = data.name;

			return camera;

		}

		function getCamera( id ) {

			let data = library.cameras[id];

			if ( data !== undefined ) {

				return getBuild( data, buildCamera );

			}

			console.warn( 'THREE.ColladaLoader: Couldn\'t find camera with ID:', id );

			return null;

		}

		// light

		function parseLight( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'technique_common':
						data = parseLightTechnique( child );
						break;

				}

			}

			library.lights[xml.getAttribute( 'id' )] = data;

		}

		function parseLightTechnique( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'directional':
					case 'point':
					case 'spot':
					case 'ambient':

						data.technique = child.nodeName;
						data.parameters = parseLightParameters( child );

				}

			}

			return data;

		}

		function parseLightParameters( xml ) {

			let data = {};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'color':
						var array = parseFloats( child.textContent );
						data.color = new THREE.Color().fromArray( array );
						break;

					case 'falloff_angle':
						data.falloffAngle = parseFloat( child.textContent );
						break;

					case 'quadratic_attenuation':
						var f = parseFloat( child.textContent );
						data.distance = f ? Math.sqrt( 1 / f ) : 0;
						break;

				}

			}

			return data;

		}

		function buildLight( data ) {

			let light;

			switch ( data.technique ) {

				case 'directional':
					light = new THREE.DirectionalLight();
					break;

				case 'point':
					light = new THREE.PointLight();
					break;

				case 'spot':
					light = new THREE.SpotLight();
					break;

				case 'ambient':
					light = new THREE.AmbientLight();
					break;

			}

			if ( data.parameters.color ) light.color.copy( data.parameters.color );
			if ( data.parameters.distance ) light.distance = data.parameters.distance;

			return light;

		}

		function getLight( id ) {

			let data = library.lights[id];

			if ( data !== undefined ) {

				return getBuild( data, buildLight );

			}

			console.warn( 'THREE.ColladaLoader: Couldn\'t find light with ID:', id );

			return null;

		}

		// geometry

		function parseGeometry( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ),
				sources: {},
				vertices: {},
				primitives: [],
			};

			let mesh = getElementsByTagName( xml, 'mesh' )[0];

			// the following tags inside geometry are not supported yet (see https://github.com/mrdoob/three.js/pull/12606): convex_mesh, spline, brep
			if ( mesh === undefined ) return;

			for ( let i = 0; i < mesh.childNodes.length; i ++ ) {

				let child = mesh.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				let id = child.getAttribute( 'id' );

				switch ( child.nodeName ) {

					case 'source':
						data.sources[id] = parseSource( child );
						break;

					case 'vertices':
						// data.sources[ id ] = data.sources[ parseId( getElementsByTagName( child, 'input' )[ 0 ].getAttribute( 'source' ) ) ];
						data.vertices = parseGeometryVertices( child );
						break;

					case 'polygons':
						console.warn( 'THREE.ColladaLoader: Unsupported primitive type: ', child.nodeName );
						break;

					case 'lines':
					case 'linestrips':
					case 'polylist':
					case 'triangles':
						data.primitives.push( parseGeometryPrimitive( child ) );
						break;

					default:
						console.log( child );

				}

			}

			library.geometries[xml.getAttribute( 'id' )] = data;

		}

		function parseSource( xml ) {

			let data = {
				array: [],
				stride: 3,
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'float_array':
						data.array = parseFloats( child.textContent );
						break;

					case 'Name_array':
						data.array = parseStrings( child.textContent );
						break;

					case 'technique_common':
						var accessor = getElementsByTagName( child, 'accessor' )[0];

						if ( accessor !== undefined ) {

							data.stride = parseInt( accessor.getAttribute( 'stride' ) );

						}
						break;

				}

			}

			return data;

		}

		function parseGeometryVertices( xml ) {

			let data = {};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				data[child.getAttribute( 'semantic' )] = parseId( child.getAttribute( 'source' ) );

			}

			return data;

		}

		function parseGeometryPrimitive( xml ) {

			let primitive = {
				type: xml.nodeName,
				material: xml.getAttribute( 'material' ),
				count: parseInt( xml.getAttribute( 'count' ) ),
				inputs: {},
				stride: 0,
			};

			for ( let i = 0, l = xml.childNodes.length; i < l; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'input':
						var id = parseId( child.getAttribute( 'source' ) );
						var semantic = child.getAttribute( 'semantic' );
						var offset = parseInt( child.getAttribute( 'offset' ) );
						primitive.inputs[semantic] = {id: id, offset: offset};
						primitive.stride = Math.max( primitive.stride, offset + 1 );
						break;

					case 'vcount':
						primitive.vcount = parseInts( child.textContent );
						break;

					case 'p':
						primitive.p = parseInts( child.textContent );
						break;

				}

			}

			return primitive;

		}

		function groupPrimitives( primitives ) {

			let build = {};

			for ( let i = 0; i < primitives.length; i ++ ) {

				let primitive = primitives[i];

				if ( build[primitive.type] === undefined ) build[primitive.type] = [];

				build[primitive.type].push( primitive );

			}

			return build;

		}

		function buildGeometry( data ) {

			let build = {};

			let sources = data.sources;
			let vertices = data.vertices;
			let primitives = data.primitives;

			if ( primitives.length === 0 ) return {};

			// our goal is to create one buffer geoemtry for a single type of primitives
			// first, we group all primitives by their type

			let groupedPrimitives = groupPrimitives( primitives );

			for ( let type in groupedPrimitives ) {

				// second, we create for each type of primitives (polylist,triangles or lines) a buffer geometry

				build[type] = buildGeometryType( groupedPrimitives[type], sources, vertices );

			}

			return build;

		}

		function buildGeometryType( primitives, sources, vertices ) {

			let build = {};

			let position = {array: [], stride: 0};
			let normal = {array: [], stride: 0};
			let uv = {array: [], stride: 0};
			let color = {array: [], stride: 0};

			let skinIndex = {array: [], stride: 4};
			let skinWeight = {array: [], stride: 4};

			let geometry = new THREE.BufferGeometry();

			let materialKeys = [];

			let start = 0, count = 0;

			for ( let p = 0; p < primitives.length; p ++ ) {

				let primitive = primitives[p];
				let inputs = primitive.inputs;
				let triangleCount = 1;

				if ( primitive.vcount && primitive.vcount[0] === 4 ) {

					triangleCount = 2; // one quad -> two triangles

				}

				// groups

				if ( primitive.type === 'lines' || primitive.type === 'linestrips' ) {

					count = primitive.count * 2;

				} else {

					count = primitive.count * 3 * triangleCount;

				}

				geometry.addGroup( start, count, p );
				start += count;

				// material

				if ( primitive.material ) {

					materialKeys.push( primitive.material );

				}

				// geometry data

				for ( let name in inputs ) {

					let input = inputs[name];

					switch ( name )	{

						case 'VERTEX':
							for ( let key in vertices ) {

								let id = vertices[key];

								switch ( key ) {

									case 'POSITION':
										buildGeometryData( primitive, sources[id], input.offset, position.array );
										position.stride = sources[id].stride;

										if ( sources.skinWeights && sources.skinIndices ) {

											buildGeometryData( primitive, sources.skinIndices, input.offset, skinIndex.array );
											buildGeometryData( primitive, sources.skinWeights, input.offset, skinWeight.array );

										}
										break;

									case 'NORMAL':
										buildGeometryData( primitive, sources[id], input.offset, normal.array );
										normal.stride = sources[id].stride;
										break;

									case 'COLOR':
										buildGeometryData( primitive, sources[id], input.offset, color.array );
										color.stride = sources[id].stride;
										break;

									case 'TEXCOORD':
										buildGeometryData( primitive, sources[id], input.offset, uv.array );
										uv.stride = sources[id].stride;
										break;

									default:
										console.warn( 'THREE.ColladaLoader: Semantic "%s" not handled in geometry build process.', key );

								}

							}
							break;

						case 'NORMAL':
							buildGeometryData( primitive, sources[input.id], input.offset, normal.array );
							normal.stride = sources[input.id].stride;
							break;

						case 'COLOR':
							buildGeometryData( primitive, sources[input.id], input.offset, color.array );
							color.stride = sources[input.id].stride;
							break;

						case 'TEXCOORD':
							buildGeometryData( primitive, sources[input.id], input.offset, uv.array );
							uv.stride = sources[input.id].stride;
							break;

					}

				}

			}

			// build geometry

			if ( position.array.length > 0 ) geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( position.array, position.stride ) );
			if ( normal.array.length > 0 ) geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normal.array, normal.stride ) );
			if ( color.array.length > 0 ) geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( color.array, color.stride ) );
			if ( uv.array.length > 0 ) geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uv.array, uv.stride ) );

			if ( skinIndex.array.length > 0 ) geometry.addAttribute( 'skinIndex', new THREE.Float32BufferAttribute( skinIndex.array, skinIndex.stride ) );
			if ( skinWeight.array.length > 0 ) geometry.addAttribute( 'skinWeight', new THREE.Float32BufferAttribute( skinWeight.array, skinWeight.stride ) );

			build.data = geometry;
			build.type = primitives[0].type;
			build.materialKeys = materialKeys;

			return build;

		}

		function buildGeometryData( primitive, source, offset, array ) {

			let indices = primitive.p;
			let stride = primitive.stride;
			let vcount = primitive.vcount;

			function pushVector( i ) {

				let index = indices[i + offset] * sourceStride;
				let length = index + sourceStride;

				for ( ; index < length; index ++ ) {

					array.push( sourceArray[index] );

				}

			}

			let maxcount = 0;

			var sourceArray = source.array;
			var sourceStride = source.stride;

			if ( primitive.vcount !== undefined ) {

				let index = 0;

				for ( var i = 0, l = vcount.length; i < l; i ++ ) {

					let count = vcount[i];

					if ( count === 4 ) {

						var a = index + stride * 0;
						var b = index + stride * 1;
						var c = index + stride * 2;
						let d = index + stride * 3;

						pushVector( a ); pushVector( b ); pushVector( d );
						pushVector( b ); pushVector( c ); pushVector( d );

					} else if ( count === 3 ) {

						var a = index + stride * 0;
						var b = index + stride * 1;
						var c = index + stride * 2;

						pushVector( a ); pushVector( b ); pushVector( c );

					} else {

						maxcount = Math.max( maxcount, count );

					}

					index += stride * count;

				}

				if ( maxcount > 0 ) {

					console.log( 'THREE.ColladaLoader: Geometry has faces with more than 4 vertices.' );

				}

			} else {

				for ( var i = 0, l = indices.length; i < l; i += stride ) {

					pushVector( i );

				}

			}

		}

		function getGeometry( id ) {

			return getBuild( library.geometries[id], buildGeometry );

		}

		// kinematics

		function parseKinematicsModel( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ) || '',
				joints: {},
				links: [],
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'technique_common':
						parseKinematicsTechniqueCommon( child, data );
						break;

				}

			}

			library.kinematicsModels[xml.getAttribute( 'id' )] = data;

		}

		function buildKinematicsModel( data ) {

			if ( data.build !== undefined ) return data.build;

			return data;

		}

		function getKinematicsModel( id ) {

			return getBuild( library.kinematicsModels[id], buildKinematicsModel );

		}

		function parseKinematicsTechniqueCommon( xml, data ) {

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'joint':
						data.joints[child.getAttribute( 'sid' )] = parseKinematicsJoint( child );
						break;

					case 'link':
						data.links.push( parseKinematicsLink( child ) );
						break;

				}

			}

		}

		function parseKinematicsJoint( xml ) {

			let data;

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'prismatic':
					case 'revolute':
						data = parseKinematicsJointParameter( child );
						break;

				}

			}

			return data;

		}

		function parseKinematicsJointParameter( xml, data ) {

			var data = {
				sid: xml.getAttribute( 'sid' ),
				name: xml.getAttribute( 'name' ) || '',
				axis: new THREE.Vector3(),
				limits: {
					min: 0,
					max: 0,
				},
				type: xml.nodeName,
				static: false,
				zeroPosition: 0,
				middlePosition: 0,
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'axis':
						var array = parseFloats( child.textContent );
						data.axis.fromArray( array );
						break;
					case 'limits':
						var max = child.getElementsByTagName( 'max' )[0];
						var min = child.getElementsByTagName( 'min' )[0];

						data.limits.max = parseFloat( max.textContent );
						data.limits.min = parseFloat( min.textContent );
						break;

				}

			}

			// if min is equal to or greater than max, consider the joint static

			if ( data.limits.min >= data.limits.max ) {

				data.static = true;

			}

			// calculate middle position

			data.middlePosition = ( data.limits.min + data.limits.max ) / 2.0;

			return data;

		}

		function parseKinematicsLink( xml ) {

			let data = {
				sid: xml.getAttribute( 'sid' ),
				name: xml.getAttribute( 'name' ) || '',
				attachments: [],
				transforms: [],
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'attachment_full':
						data.attachments.push( parseKinematicsAttachment( child ) );
						break;

					case 'matrix':
					case 'translate':
					case 'rotate':
						data.transforms.push( parseKinematicsTransform( child ) );
						break;

				}

			}

			return data;

		}

		function parseKinematicsAttachment( xml ) {

			let data = {
				joint: xml.getAttribute( 'joint' ).split( '/' ).pop(),
				transforms: [],
				links: [],
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'link':
						data.links.push( parseKinematicsLink( child ) );
						break;

					case 'matrix':
					case 'translate':
					case 'rotate':
						data.transforms.push( parseKinematicsTransform( child ) );
						break;

				}

			}

			return data;

		}

		function parseKinematicsTransform( xml ) {

			let data = {
				type: xml.nodeName,
			};

			let array = parseFloats( xml.textContent );

			switch ( data.type ) {

				case 'matrix':
					data.obj = new THREE.Matrix4();
					data.obj.fromArray( array ).transpose();
					break;

				case 'translate':
					data.obj = new THREE.Vector3();
					data.obj.fromArray( array );
					break;

				case 'rotate':
					data.obj = new THREE.Vector3();
					data.obj.fromArray( array );
					data.angle = THREE.Math.degToRad( array[3] );
					break;

			}

			return data;

		}

		function parseKinematicsScene( xml ) {

			let data = {
				bindJointAxis: [],
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'bind_joint_axis':
						data.bindJointAxis.push( parseKinematicsBindJointAxis( child ) );
						break;

				}

			}

			library.kinematicsScenes[parseId( xml.getAttribute( 'url' ) )] = data;

		}

		function parseKinematicsBindJointAxis( xml ) {

			let data = {
				target: xml.getAttribute( 'target' ).split( '/' ).pop(),
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'axis':
						var param = child.getElementsByTagName( 'param' )[0];
						data.axis = param.textContent;
						var tmpJointIndex = data.axis.split( 'inst_' ).pop().split( 'axis' )[0];
						data.jointIndex = tmpJointIndex.substr( 0, tmpJointIndex.length - 1 );
						break;

				}

			}

			return data;

		}

		function buildKinematicsScene( data ) {

			if ( data.build !== undefined ) return data.build;

			return data;

		}

		function getKinematicsScene( id ) {

			return getBuild( library.kinematicsScenes[id], buildKinematicsScene );

		}

		function setupKinematics() {

			let kinematicsModelId = Object.keys( library.kinematicsModels )[0];
			let kinematicsSceneId = Object.keys( library.kinematicsScenes )[0];
			let visualSceneId = Object.keys( library.visualScenes )[0];

			if ( kinematicsModelId === undefined || kinematicsSceneId === undefined ) return;

			let kinematicsModel = getKinematicsModel( kinematicsModelId );
			let kinematicsScene = getKinematicsScene( kinematicsSceneId );
			let visualScene = getVisualScene( visualSceneId );

			let bindJointAxis = kinematicsScene.bindJointAxis;
			let jointMap = {};

			for ( let i = 0, l = bindJointAxis.length; i < l; i ++ ) {

				let axis = bindJointAxis[i];

				// the result of the following query is an element of type 'translate', 'rotate','scale' or 'matrix'

				let targetElement = collada.querySelector( '[sid="' + axis.target + '"]' );

				if ( targetElement ) {

					// get the parent of the transfrom element

					let parentVisualElement = targetElement.parentElement;

					// connect the joint of the kinematics model with the element in the visual scene

					connect( axis.jointIndex, parentVisualElement );

				}

			}

			function connect( jointIndex, visualElement ) {

				let visualElementName = visualElement.getAttribute( 'name' );
				let joint = kinematicsModel.joints[jointIndex];

				visualScene.traverse( function( object ) {

					if ( object.name === visualElementName ) {

						jointMap[jointIndex] = {
							object: object,
							transforms: buildTransformList( visualElement ),
							joint: joint,
							position: joint.zeroPosition,
						};

					}

				} );

			}

			let m0 = new THREE.Matrix4();

			kinematics = {

				joints: kinematicsModel && kinematicsModel.joints,

				getJointValue: function( jointIndex ) {

					let jointData = jointMap[jointIndex];

					if ( jointData ) {

						return jointData.position;

					} else {

						console.warn( 'THREE.ColladaLoader: Joint ' + jointIndex + ' doesn\'t exist.' );

					}

				},

				setJointValue: function( jointIndex, value ) {

					let jointData = jointMap[jointIndex];

					if ( jointData ) {

						let joint = jointData.joint;

						if ( value > joint.limits.max || value < joint.limits.min ) {

							console.warn( 'THREE.ColladaLoader: Joint ' + jointIndex + ' value ' + value + ' outside of limits (min: ' + joint.limits.min + ', max: ' + joint.limits.max + ').' );

						} else if ( joint.static ) {

							console.warn( 'THREE.ColladaLoader: Joint ' + jointIndex + ' is static.' );

						} else {

							let object = jointData.object;
							let axis = joint.axis;
							let transforms = jointData.transforms;

							matrix.identity();

							// each update, we have to apply all transforms in the correct order

							for ( let i = 0; i < transforms.length; i ++ ) {

								let transform = transforms[i];

								// if there is a connection of the transform node with a joint, apply the joint value

								if ( transform.sid && transform.sid.indexOf( jointIndex ) !== - 1 ) {

									switch ( joint.type ) {

										case 'revolute':
											matrix.multiply( m0.makeRotationAxis( axis, THREE.Math.degToRad( value ) ) );
											break;

										case 'prismatic':
											matrix.multiply( m0.makeTranslation( axis.x * value, axis.y * value, axis.z * value ) );
											break;

										default:
											console.warn( 'THREE.ColladaLoader: Unknown joint type: ' + joint.type );
											break;

									}

								} else {

									switch ( transform.type ) {

										case 'matrix':
											matrix.multiply( transform.obj );
											break;

										case 'translate':
											matrix.multiply( m0.makeTranslation( transform.obj.x, transform.obj.y, transform.obj.z ) );
											break;

										case 'scale':
											matrix.scale( transform.obj );
											break;

										case 'rotate':
											matrix.multiply( m0.makeRotationAxis( transform.obj, transform.angle ) );
											break;

									}

								}

							}

							object.matrix.copy( matrix );
							object.matrix.decompose( object.position, object.quaternion, object.scale );

							jointMap[jointIndex].position = value;

						}

					} else {

						console.log( 'THREE.ColladaLoader: ' + jointIndex + ' does not exist.' );

					}

				},

			};

		}

		function buildTransformList( node ) {

			let transforms = [];

			let xml = collada.querySelector( '[id="' + node.id + '"]' );

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'matrix':
						var array = parseFloats( child.textContent );
						var matrix = new THREE.Matrix4().fromArray( array ).transpose();
						transforms.push( {
							sid: child.getAttribute( 'sid' ),
							type: child.nodeName,
							obj: matrix,
						} );
						break;

					case 'translate':
					case 'scale':
						var array = parseFloats( child.textContent );
						var vector = new THREE.Vector3().fromArray( array );
						transforms.push( {
							sid: child.getAttribute( 'sid' ),
							type: child.nodeName,
							obj: vector,
						} );
						break;

					case 'rotate':
						var array = parseFloats( child.textContent );
						var vector = new THREE.Vector3().fromArray( array );
						var angle = THREE.Math.degToRad( array[3] );
						transforms.push( {
							sid: child.getAttribute( 'sid' ),
							type: child.nodeName,
							obj: vector,
							angle: angle,
						} );
						break;

				}

			}

			return transforms;

		}

		// nodes

		function prepareNodes( xml ) {

			let elements = xml.getElementsByTagName( 'node' );

			// ensure all node elements have id attributes

			for ( let i = 0; i < elements.length; i ++ ) {

				let element = elements[i];

				if ( element.hasAttribute( 'id' ) === false ) {

					element.setAttribute( 'id', generateId() );

				}

			}

		}

		var matrix = new THREE.Matrix4();
		let vector = new THREE.Vector3();

		function parseNode( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ) || '',
				type: xml.getAttribute( 'type' ),
				id: xml.getAttribute( 'id' ),
				sid: xml.getAttribute( 'sid' ),
				matrix: new THREE.Matrix4(),
				nodes: [],
				instanceCameras: [],
				instanceControllers: [],
				instanceLights: [],
				instanceGeometries: [],
				instanceNodes: [],
				transforms: {},
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				if ( child.nodeType !== 1 ) continue;

				switch ( child.nodeName ) {

					case 'node':
						data.nodes.push( child.getAttribute( 'id' ) );
						parseNode( child );
						break;

					case 'instance_camera':
						data.instanceCameras.push( parseId( child.getAttribute( 'url' ) ) );
						break;

					case 'instance_controller':
						data.instanceControllers.push( parseNodeInstance( child ) );
						break;

					case 'instance_light':
						data.instanceLights.push( parseId( child.getAttribute( 'url' ) ) );
						break;

					case 'instance_geometry':
						data.instanceGeometries.push( parseNodeInstance( child ) );
						break;

					case 'instance_node':
						data.instanceNodes.push( parseId( child.getAttribute( 'url' ) ) );
						break;

					case 'matrix':
						var array = parseFloats( child.textContent );
						data.matrix.multiply( matrix.fromArray( array ).transpose() );
						data.transforms[child.getAttribute( 'sid' )] = child.nodeName;
						break;

					case 'translate':
						var array = parseFloats( child.textContent );
						vector.fromArray( array );
						data.matrix.multiply( matrix.makeTranslation( vector.x, vector.y, vector.z ) );
						data.transforms[child.getAttribute( 'sid' )] = child.nodeName;
						break;

					case 'rotate':
						var array = parseFloats( child.textContent );
						var angle = THREE.Math.degToRad( array[3] );
						data.matrix.multiply( matrix.makeRotationAxis( vector.fromArray( array ), angle ) );
						data.transforms[child.getAttribute( 'sid' )] = child.nodeName;
						break;

					case 'scale':
						var array = parseFloats( child.textContent );
						data.matrix.scale( vector.fromArray( array ) );
						data.transforms[child.getAttribute( 'sid' )] = child.nodeName;
						break;

					case 'extra':
						break;

					default:
						console.log( child );

				}

			}

			library.nodes[data.id] = data;

			return data;

		}

		function parseNodeInstance( xml ) {

			let data = {
				id: parseId( xml.getAttribute( 'url' ) ),
				materials: {},
				skeletons: [],
			};

			for ( let i = 0; i < xml.childNodes.length; i ++ ) {

				let child = xml.childNodes[i];

				switch ( child.nodeName ) {

					case 'bind_material':
						var instances = child.getElementsByTagName( 'instance_material' );

						for ( let j = 0; j < instances.length; j ++ ) {

							let instance = instances[j];
							let symbol = instance.getAttribute( 'symbol' );
							let target = instance.getAttribute( 'target' );

							data.materials[symbol] = parseId( target );

						}

						break;

					case 'skeleton':
						data.skeletons.push( parseId( child.textContent ) );
						break;

					default:
						break;

				}

			}

			return data;

		}

		function buildSkeleton( skeletons, joints ) {

			let boneData = [];
			let sortedBoneData = [];

			let i, j, data;

			// a skeleton can have multiple root bones. collada expresses this
			// situtation with multiple "skeleton" tags per controller instance

			for ( i = 0; i < skeletons.length; i ++ ) {

				let skeleton = skeletons[i];
				let root = getNode( skeleton );

				// setup bone data for a single bone hierarchy

				buildBoneHierarchy( root, joints, boneData );

			}

			// sort bone data (the order is defined in the corresponding controller)

			for ( i = 0; i < joints.length; i ++ ) {

				for ( j = 0; j < boneData.length; j ++ ) {

					data = boneData[j];

					if ( data.bone.name === joints[i].name ) {

						sortedBoneData[i] = data;
						data.processed = true;
						break;

					}

				}

			}

			// add unprocessed bone data at the end of the list

			for ( i = 0; i < boneData.length; i ++ ) {

				data = boneData[i];

				if ( data.processed === false ) {

					sortedBoneData.push( data );
					data.processed = true;

				}

			}

			// setup arrays for skeleton creation

			let bones = [];
			let boneInverses = [];

			for ( i = 0; i < sortedBoneData.length; i ++ ) {

				data = sortedBoneData[i];

				bones.push( data.bone );
				boneInverses.push( data.boneInverse );

			}

			return new THREE.Skeleton( bones, boneInverses );

		}

		function buildBoneHierarchy( root, joints, boneData ) {

			// setup bone data from visual scene

			root.traverse( function( object ) {

				if ( object.isBone === true ) {

					let boneInverse;

					// retrieve the boneInverse from the controller data

					for ( let i = 0; i < joints.length; i ++ ) {

						let joint = joints[i];

						if ( joint.name === object.name ) {

							boneInverse = joint.boneInverse;
							break;

						}

					}

					if ( boneInverse === undefined ) {

						// Unfortunately, there can be joints in the visual scene that are not part of the
						// corresponding controller. In this case, we have to create a dummy boneInverse matrix
						// for the respective bone. This bone won't affect any vertices, because there are no skin indices
						// and weights defined for it. But we still have to add the bone to the sorted bone list in order to
						// ensure a correct animation of the model.

						 boneInverse = new THREE.Matrix4();

					}

					boneData.push( {bone: object, boneInverse: boneInverse, processed: false} );

				}

			} );

		}

		function buildNode( data ) {

			let objects = [];

			let matrix = data.matrix;
			let nodes = data.nodes;
			let type = data.type;
			let instanceCameras = data.instanceCameras;
			let instanceControllers = data.instanceControllers;
			let instanceLights = data.instanceLights;
			let instanceGeometries = data.instanceGeometries;
			let instanceNodes = data.instanceNodes;

			// nodes

			for ( var i = 0, l = nodes.length; i < l; i ++ ) {

				objects.push( getNode( nodes[i] ) );

			}

			// instance cameras

			for ( var i = 0, l = instanceCameras.length; i < l; i ++ ) {

				let instanceCamera = getCamera( instanceCameras[i] );

				if ( instanceCamera !== null ) {

					objects.push( instanceCamera.clone() );

				}

			}

			// instance controllers

			for ( var i = 0, l = instanceControllers.length; i < l; i ++ ) {

				var instance = instanceControllers[i];
				let controller = getController( instance.id );
				var geometries = getGeometry( controller.id );
				var newObjects = buildObjects( geometries, instance.materials );

				let skeletons = instance.skeletons;
				let joints = controller.skin.joints;

				let skeleton = buildSkeleton( skeletons, joints );

				for ( var j = 0, jl = newObjects.length; j < jl; j ++ ) {

					var object = newObjects[j];

					if ( object.isSkinnedMesh ) {

						object.bind( skeleton, controller.skin.bindMatrix );
						object.normalizeSkinWeights();

					}

					objects.push( object );

				}

			}

			// instance lights

			for ( var i = 0, l = instanceLights.length; i < l; i ++ ) {

				let instanceLight = getLight( instanceLights[i] );

				if ( instanceLight !== null ) {

					objects.push( instanceLight.clone() );

				}

			}

			// instance geometries

			for ( var i = 0, l = instanceGeometries.length; i < l; i ++ ) {

				var instance = instanceGeometries[i];

				// a single geometry instance in collada can lead to multiple object3Ds.
				// this is the case when primitives are combined like triangles and lines

				var geometries = getGeometry( instance.id );
				var newObjects = buildObjects( geometries, instance.materials );

				for ( var j = 0, jl = newObjects.length; j < jl; j ++ ) {

					objects.push( newObjects[j] );

				}

			}

			// instance nodes

			for ( var i = 0, l = instanceNodes.length; i < l; i ++ ) {

				objects.push( getNode( instanceNodes[i] ).clone() );

			}

			var object;

			if ( nodes.length === 0 && objects.length === 1 ) {

				object = objects[0];

			} else {

				object = ( type === 'JOINT' ) ? new THREE.Bone() : new THREE.Group();

				for ( var i = 0; i < objects.length; i ++ ) {

					object.add( objects[i] );

				}

			}

			object.name = ( type === 'JOINT' ) ? data.sid : data.name;
			object.matrix.copy( matrix );
			object.matrix.decompose( object.position, object.quaternion, object.scale );

			return object;

		}

		function resolveMaterialBinding( keys, instanceMaterials ) {

			let materials = [];

			for ( let i = 0, l = keys.length; i < l; i ++ ) {

				let id = instanceMaterials[keys[i]];
				materials.push( getMaterial( id ) );

			}

			return materials;

		}

		function buildObjects( geometries, instanceMaterials ) {

			let objects = [];

			for ( let type in geometries ) {

				let geometry = geometries[type];

				let materials = resolveMaterialBinding( geometry.materialKeys, instanceMaterials );

				// handle case if no materials are defined

				if ( materials.length === 0 ) {

					if ( type === 'lines' || type === 'linestrips' ) {

						materials.push( new THREE.LineBasicMaterial() );

					} else {

						materials.push( new THREE.MeshPhongMaterial() );

					}

				}

				// regard skinning

				let skinning = ( geometry.data.attributes.skinIndex !== undefined );

				if ( skinning ) {

					for ( let i = 0, l = materials.length; i < l; i ++ ) {

						materials[i].skinning = true;

					}

				}

				// choose between a single or multi materials (material array)

				let material = ( materials.length === 1 ) ? materials[0] : materials;

				// now create a specific 3D object

				var object;

				switch ( type ) {

					case 'lines':
						object = new THREE.LineSegments( geometry.data, material );
						break;

					case 'linestrips':
						object = new THREE.Line( geometry.data, material );
						break;

					case 'triangles':
					case 'polylist':
						if ( skinning ) {

							object = new THREE.SkinnedMesh( geometry.data, material );

						} else {

							object = new THREE.Mesh( geometry.data, material );

						}
						break;

				}

				objects.push( object );

			}

			return objects;

		}

		function getNode( id ) {

			return getBuild( library.nodes[id], buildNode );

		}

		// visual scenes

		function parseVisualScene( xml ) {

			let data = {
				name: xml.getAttribute( 'name' ),
				children: [],
			};

			prepareNodes( xml );

			let elements = getElementsByTagName( xml, 'node' );

			for ( let i = 0; i < elements.length; i ++ ) {

				data.children.push( parseNode( elements[i] ) );

			}

			library.visualScenes[xml.getAttribute( 'id' )] = data;

		}

		function buildVisualScene( data ) {

			let group = new THREE.Group();
			group.name = data.name;

			let children = data.children;

			for ( let i = 0; i < children.length; i ++ ) {

				let child = children[i];

				if ( child.id === null ) {

					group.add( buildNode( child ) );

				} else {

					// if there is an ID, let's try to get the finished build (e.g. joints are already build)

					group.add( getNode( child.id ) );

				}

			}

			return group;

		}

		function getVisualScene( id ) {

			return getBuild( library.visualScenes[id], buildVisualScene );

		}

		// scenes

		function parseScene( xml ) {

			let instance = getElementsByTagName( xml, 'instance_visual_scene' )[0];
			return getVisualScene( parseId( instance.getAttribute( 'url' ) ) );

		}

		function setupAnimations() {

			let clips = library.clips;

			if ( isEmpty( clips ) === true ) {

				if ( isEmpty( library.animations ) === false ) {

					// if there are animations but no clips, we create a default clip for playback

					let tracks = [];

					for ( var id in library.animations ) {

						let animationTracks = getAnimation( id );

						for ( let i = 0, l = animationTracks.length; i < l; i ++ ) {

							tracks.push( animationTracks[i] );

						}

					}

					animations.push( new THREE.AnimationClip( 'default', - 1, tracks ) );

				}

			} else {

				for ( var id in clips ) {

					animations.push( getAnimationClip( id ) );

				}

			}

		}

		console.time( 'THREE.ColladaLoader' );

		if ( text.length === 0 ) {

			return {scene: new THREE.Scene()};

		}

		console.time( 'THREE.ColladaLoader: DOMParser' );

		let xml = new DOMParser().parseFromString( text, 'application/xml' );

		console.timeEnd( 'THREE.ColladaLoader: DOMParser' );

		var collada = getElementsByTagName( xml, 'COLLADA' )[0];

		// metadata

		let version = collada.getAttribute( 'version' );
		console.log( 'THREE.ColladaLoader: File version', version );

		let asset = parseAsset( getElementsByTagName( collada, 'asset' )[0] );
		var textureLoader = new THREE.TextureLoader( this.manager );
		textureLoader.setPath( path ).setCrossOrigin( this.crossOrigin );

		//

		var animations = [];
		var kinematics = {};
		var count = 0;

		//

		var library = {
			animations: {},
			clips: {},
			controllers: {},
			images: {},
			effects: {},
			materials: {},
			cameras: {},
			lights: {},
			geometries: {},
			nodes: {},
			visualScenes: {},
			kinematicsModels: {},
			kinematicsScenes: {},
		};

		console.time( 'THREE.ColladaLoader: Parse' );

		parseLibrary( collada, 'library_animations', 'animation', parseAnimation );
		parseLibrary( collada, 'library_animation_clips', 'animation_clip', parseAnimationClip );
		parseLibrary( collada, 'library_controllers', 'controller', parseController );
		parseLibrary( collada, 'library_images', 'image', parseImage );
		parseLibrary( collada, 'library_effects', 'effect', parseEffect );
		parseLibrary( collada, 'library_materials', 'material', parseMaterial );
		parseLibrary( collada, 'library_cameras', 'camera', parseCamera );
		parseLibrary( collada, 'library_lights', 'light', parseLight );
		parseLibrary( collada, 'library_geometries', 'geometry', parseGeometry );
		parseLibrary( collada, 'library_nodes', 'node', parseNode );
		parseLibrary( collada, 'library_visual_scenes', 'visual_scene', parseVisualScene );
		parseLibrary( collada, 'library_kinematics_models', 'kinematics_model', parseKinematicsModel );
		parseLibrary( collada, 'scene', 'instance_kinematics_scene', parseKinematicsScene );

		console.timeEnd( 'THREE.ColladaLoader: Parse' );

		console.time( 'THREE.ColladaLoader: Build' );

		buildLibrary( library.animations, buildAnimation );
		buildLibrary( library.clips, buildAnimationClip );
		buildLibrary( library.controllers, buildController );
		buildLibrary( library.images, buildImage );
		buildLibrary( library.effects, buildEffect );
		buildLibrary( library.materials, buildMaterial );
		buildLibrary( library.cameras, buildCamera );
		buildLibrary( library.lights, buildLight );
		buildLibrary( library.geometries, buildGeometry );
		buildLibrary( library.visualScenes, buildVisualScene );

		console.timeEnd( 'THREE.ColladaLoader: Build' );

		setupAnimations();
		setupKinematics();

		let scene = parseScene( getElementsByTagName( collada, 'scene' )[0] );

		if ( asset.upAxis === 'Z_UP' ) {

			scene.rotation.x = - Math.PI / 2;

		}

		scene.scale.multiplyScalar( asset.unit );

		console.timeEnd( 'THREE.ColladaLoader' );

		return {
			animations: animations,
			kinematics: kinematics,
			library: library,
			scene: scene,
		};

	},

};

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function() {

		try {

			let canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

		} catch ( e ) {

			return false;

		}

	} )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function() {

		let element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.',
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.',
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function( parameters ) {

		let parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	},

};

// browserify support
if ( typeof module === 'object' ) {

	module.exports = Detector;

}

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finger swipe

THREE.OrbitControls = function( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};

	// Mouse buttons
	this.mouseButtons = {ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT};

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function() {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function() {

		return spherical.theta;

	};

	this.saveState = function() {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function() {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function() {

		let offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		let quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		let quatInverse = quat.clone().inverse();

		let lastPosition = new THREE.Vector3();
		let lastQuaternion = new THREE.Quaternion();

		return function update() {

			let position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function() {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		// scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = {type: 'change'};
	let startEvent = {type: 'start'};
	let endEvent = {type: 'end'};

	var STATE = {NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5};

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	let rotateStart = new THREE.Vector2();
	let rotateEnd = new THREE.Vector2();
	let rotateDelta = new THREE.Vector2();

	let panStart = new THREE.Vector2();
	let panEnd = new THREE.Vector2();
	let panDelta = new THREE.Vector2();

	let dollyStart = new THREE.Vector2();
	let dollyEnd = new THREE.Vector2();
	let dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	let panLeft = function() {

		let v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	let panUp = function() {

		let v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	let pan = function() {

		let offset = new THREE.Vector3();

		return function pan( deltaX, deltaY ) {

			let element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object.isPerspectiveCamera ) {

				// perspective
				let position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				let targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object.isOrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		// console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		// console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		// console.log( 'handleMouseDownPan' );

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		// console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		let element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		// console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		// console.log( 'handleMouseMovePan' );

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		// console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		// console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		// console.log( 'handleKeyDown' );

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function handleTouchStartRotate( event ) {

		// console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[0].pageX, event.touches[0].pageY );

	}

	function handleTouchStartDolly( event ) {

		// console.log( 'handleTouchStartDolly' );

		let dx = event.touches[0].pageX - event.touches[1].pageX;
		let dy = event.touches[0].pageY - event.touches[1].pageY;

		let distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartPan( event ) {

		// console.log( 'handleTouchStartPan' );

		panStart.set( event.touches[0].pageX, event.touches[0].pageY );

	}

	function handleTouchMoveRotate( event ) {

		// console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[0].pageX, event.touches[0].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		let element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		// console.log( 'handleTouchMoveDolly' );

		let dx = event.touches[0].pageX - event.touches[1].pageX;
		let dy = event.touches[0].pageY - event.touches[1].pageY;

		let distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchMovePan( event ) {

		// console.log( 'handleTouchMovePan' );

		panEnd.set( event.touches[0].pageX, event.touches[0].pageY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {

		// console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.button ) {

			case scope.mouseButtons.ORBIT:

				if ( scope.enableRotate === false ) return;

				handleMouseDownRotate( event );

				state = STATE.ROTATE;

				break;

			case scope.mouseButtons.ZOOM:

				if ( scope.enableZoom === false ) return;

				handleMouseDownDolly( event );

				state = STATE.DOLLY;

				break;

			case scope.mouseButtons.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseDownPan( event );

				state = STATE.PAN;

				break;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

			case STATE.ROTATE:

				if ( scope.enableRotate === false ) return;

				handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseMovePan( event );

				break;

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		scope.dispatchEvent( startEvent );

		handleMouseWheel( event );

		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;

				handleTouchStartPan( event );

				state = STATE.TOUCH_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

				handleTouchMoveDolly( event );

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...

				handleTouchMovePan( event );

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {

	center: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
			return this.target;

		},

	},

	// backward compatibility

	noZoom: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;

		},

	},

	noRotate: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;

		},

	},

	noPan: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;

		},

	},

	noKeys: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;

		},

	},

	staticMoving: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;

		},

	},

	dynamicDampingFactor: {

		get: function() {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;

		},

		set: function( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;

		},

	},

} );

// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){function h(a){c.appendChild(a.dom);return a}function k(a){for(var d=0;d<c.children.length;d++)c.children[d].style.display=d===a?"block":"none";l=a}var l=0,c=document.createElement("div");c.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";c.addEventListener("click",function(a){a.preventDefault();k(++l%c.children.length)},!1);var g=(performance||Date).now(),e=g,a=0,r=h(new Stats.Panel("FPS","#0ff","#002")),f=h(new Stats.Panel("MS","#0f0","#020"));
if(self.performance&&self.performance.memory)var t=h(new Stats.Panel("MB","#f08","#201"));k(0);return{REVISION:16,dom:c,addPanel:h,showPanel:k,begin:function(){g=(performance||Date).now()},end:function(){a++;var c=(performance||Date).now();f.update(c-g,200);if(c>e+1E3&&(r.update(1E3*a/(c-e),100),e=c,a=0,t)){var d=performance.memory;t.update(d.usedJSHeapSize/1048576,d.jsHeapSizeLimit/1048576)}return c},update:function(){g=this.end()},domElement:c,setMode:k}};
Stats.Panel=function(h,k,l){var c=Infinity,g=0,e=Math.round,a=e(window.devicePixelRatio||1),r=80*a,f=48*a,t=3*a,u=2*a,d=3*a,m=15*a,n=74*a,p=30*a,q=document.createElement("canvas");q.width=r;q.height=f;q.style.cssText="width:80px;height:48px";var b=q.getContext("2d");b.font="bold "+9*a+"px Helvetica,Arial,sans-serif";b.textBaseline="top";b.fillStyle=l;b.fillRect(0,0,r,f);b.fillStyle=k;b.fillText(h,t,u);b.fillRect(d,m,n,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d,m,n,p);return{dom:q,update:function(f,
v){c=Math.min(c,f);g=Math.max(g,f);b.fillStyle=l;b.globalAlpha=1;b.fillRect(0,0,r,m);b.fillStyle=k;b.fillText(e(f)+" "+h+" ("+e(c)+"-"+e(g)+")",t,u);b.drawImage(q,d+a,m,n-a,p,d,m,n-a,p);b.fillRect(d+n-a,m,a,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d+n-a,m,a,e((1-f/v)*p))}}};"object"===typeof module&&(module.exports=Stats);
// window.console.clear();

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			let container, stats, clock;
			let camera, scene, renderer, logo;
			init();
			animate();
			function init() {
				container = document.getElementById( 'front' );
				container.style.height = window.innerHeight + 'px';
				camera = new THREE.PerspectiveCamera( 67.5, window.innerWidth / window.innerHeight, 0.1, 1000 );
				camera.position.set( -200, 100, 280 );
     
        //
				scene = new THREE.Scene();
				clock = new THREE.Clock();
				// loading manager
				let loadingManager = new THREE.LoadingManager( function() {
					scene.add( logo );
				} );
        
				// loader
				let loader = new THREE.ColladaLoader( loadingManager );
				loader.load( 'https://raw.githubusercontent.com/davegahn/test/master/scripts/F34.dae', function( collada ) {
					logo = collada.scene;
				} );
        
				// lights
				let ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );// 0xcccccc
				scene.add( ambientLight );
				let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
				directionalLight.position.set( -3, 0, 5 ).normalize();
				scene.add( directionalLight );
        
        // let spotLight = new THREE.PointLight( 0xffffff, 0.6, 100 );
        // light.position.set( 0, 0, 0 );
        // scene.add( spotLight );
        
				// renderer
				renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.domElement.style.position = "absolute";
				container.appendChild( renderer.domElement );
        
        // helpers
        let directionalLighthelper = new THREE.DirectionalLightHelper( directionalLight, 200 );
        // scene.add( directionalLighthelper );
        
        // var CameraHelper = new THREE.CameraHelper( camera );
        // scene.add( CameraHelper );

        // var axesHelper = new THREE.AxesHelper( 400 );
        // scene.add( axesHelper );

//         var size = 300;
//         var divisions = 300;

//         var gridHelper = new THREE.GridHelper( size, divisions );
//         scene.add( gridHelper );
        
       
        // orbit
        let orbit = new THREE.OrbitControls( camera, renderer.domElement );
        orbit.enableZoom = false;
				
        // stats
				stats = new Stats();
				container.appendChild( stats.dom );
        
		// resize
			window.addEventListener( 'resize', onWindowResize, false );
		}

		function onWindowResize() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight );
		}
      // animate
      function animate() {
        requestAnimationFrame( animate );
        render();
        stats.update();
      }
      function render() {
        let delta = clock.getDelta();
        if ( logo !== undefined ) {
          logo.rotation.z += delta * 0.4;
          logo.rotation.y += delta * 0.1;
        }
        renderer.render( scene, camera );
      }

// --------------------------------------------------star sky-----------------------------------
// ------------------------------------------------------------------------------------------------

let canvas;
var context;
var screenH;
var screenW;
var stars = [];
var staticStars = [];
var staticSMStars = [];
var fps = 60;
var numStars = 40;
var numStaticStars = 100;
var numSMStaticStars = 60;

$('document').ready(function() {
  
  // Calculate the screen size
	screenH = $(window).height();
	screenW = $(window).width();
  
	
	// Get the canvas
	canvas = $('#space');
	
	// Fill out the canvas
	canvas.attr('height', screenH);
	canvas.attr('width', screenW);
	context = canvas[0].getContext('2d');

	context.globalCompositeOperation='destination-over';
  
  // Create static stars
	
  for (var i = 0; i < numStaticStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
    var size = 2;
    
    var staticStar = new Star(x, y, size);
    staticStars.push(staticStar);
  }
  
  // Create static small stars
  
    for (var i = 0; i < numSMStaticStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
    var size = 1;
      
    var staticSMStar = new Star(x, y, size);
    staticSMStars.push(staticSMStar);
  }
  
	// Create dynamic stars
	for (var i = 0; i < numStars; i++) {
		var x = Math.round(Math.random() * screenW);
		var y = Math.round(Math.random() * screenH);
		let opacity = Math.random();
    var size = 3;
		var star = new Star(x, y, size, opacity);
		
		// Add the the stars array
		stars.push(star);
	}
  
  // console.log(star);
  // console.log(staticStar);
  // console.log(staticSMStar);
	
	animateInterval = setInterval(animateStars, 1000 / fps);
});

/**
 * Animate the canvas
 */
function animateStars() {
	context.clearRect(0, 0, screenW, screenH); //
    context.clearRect(0, 0, canvas.width, canvas.height);
	$.each(stars, function() {
		this.draw(context);
	});
  	$.each(staticStars, function() {
		this.drawStatic(context);
	});
  	$.each(staticSMStars, function() {
		this.drawStatic(context);
	});
}

/* stop Animation */
function stopAnimation() {
     clearInterval(animateInterval);
}

// stopAnimation();

function Star(x, y, size, opacity) {
	this.x = parseInt(x);
	this.y = parseInt(y);
	this.opacity = opacity;
  	this.size = size;
	this.factor = 1;
	this.increment = Math.random() * .03;
}

Star.prototype.draw = function() {
	context.rotate((Math.PI * 1 / 10));
	
	// Save the context
	context.save();
	
	// move into the middle of the canvas, just to make room
	context.translate(this.x, this.y);
	
	// Change the opacity
	if (this.opacity > 1) {
		this.factor = -1;
	}
	else if (this.opacity <= 0) {
		this.factor = 1;
		
		this.x = Math.round(Math.random() * screenW);
		this.y = Math.round(Math.random() * screenH);
	}
	
	this.opacity += this.increment * this.factor;


	context.beginPath();
  	context.arc(10, 10, this.size, 0, Math.PI*2, true);
  	context.closePath();
  	context.fillStyle = 'rgba(255, 255, 200, ' + this.opacity + ')';
  	context.shadowColor = '#fff';
  	context.shadowBlur = 20;
  	context.shadowOffsetX = 2;
  	context.shadowOffsetY = 2;
  	context.fill();
	context.restore();
};

Star.prototype.drawStatic = function() {
	context.rotate((Math.PI * 1 / 10));
	context.save();
	context.translate(this.x, this.y);
	context.beginPath();
    context.arc(10, 10, this.size, 0, Math.PI*2, true);
    context.closePath();
    context.fillStyle = 'rgba(255, 255, 200, 1)';
    context.fill();
	context.restore();
};
// parallax

function Parallax(marg) {
  

  const THROTTLE_TIMEOUT = 50,
	    frontSection = document.querySelector('#front'),
  	  aboutSection = document.querySelector('#about'),
  	  aboutPicture = document.querySelector('.about__map'),
      navbar = document.querySelector('.navbar');
      this.marg = marg; 
  
  return {
    move: function (block, windowScroll, strafeAmount) {
      let strafe = Math.ceil(windowScroll / -strafeAmount) + '%';
      let margin = (parseInt(strafe) / 2) + '%';
      let transformString = 'translate3d(0, '+ strafe +' , 0)';

      this.strafe = strafe;
      this.margin = margin;
      
      const style = block.style;      
      style.transform = transformString;
      style.webkitTransform = transformString;  

      aboutPicture.style.marginTop = margin;
      this.marg = margin;      
    },

    showMenu: function(block) {
      (parseInt(this.strafe) < -30) ?  block.classList.remove('navbar--hidden') : block.classList.add('navbar--hidden');
    },
    
    init: function (wScroll) {
    	// console.log(Date.now() - lastCall);
    	// if (Date.now() - lastCall >= THROTTLE_TIMEOUT && topCoord < 0) {
	      	this.move(frontSection, wScroll, -20);
	      	this.move(aboutSection, wScroll, 15);
          this.showMenu(navbar);
		// }
		// lastCall = Date.now();
    }  
  }

}


// toggle front trigger

const frontTrigger = document.querySelector('#hamburger-10');
const navbar = document.querySelector('.navbar');

frontTrigger.addEventListener('click', function(e){
  e.target.classList.toggle('is-active');
  navbar.classList.toggle('navbar--hidden');
});




// navigation

//function goToSection() {  mar
  // $('.nav__link').on('click', function(e) {
  //   e.preventDefault();
  //   showSection($(this).attr('href'), true); // , mar
  // });
  
  // showSection(window.location.hash, true); //, mar    
//};

$(document).ready(function() {

//   const parallax = new Parallax();       
//   let wScroll = window.pageYOffset;
//   parallax.init(wScroll);
//   console.log(parallax.marg);

$('.nav__link').on('click', function(e) {
  e.preventDefault();
  showSection($(this).attr('href'), true); // , mar
});
  
showSection(window.location.hash, true); //, mar

toTop();

});//ready
  
  // $(window).scroll(function() {
  //   checkSection();
  // });


function toTop(){
  let logoLink = $('.navbar-toplik');
  logoLink.on('click', function(e) {
    e.preventDefault();
    showSection($(this).attr('href'), true);
  });
};

// init section offsets

let sectionsObjs = {};

(function createOffsetsMap () {  
  function storeOffsets(sekcia, offset) {
    sectionsObjs[sekcia] = offset;
  }
  $('section').each(function(i, elem){
     return storeOffsets(elem.id, elem.offsetTop);
  })
})();




// on scroll

function showSection(section, isAnimate, off) {
  let direction = section.replace(/#/, '');
    let reqSection, reqSectionPos;
    for(let sectionsObj in sectionsObjs){
      if(sectionsObj === direction) {
        reqSectionPos = sectionsObjs[sectionsObj]
      }
    }

  let position  = reqSectionPos;
  // console.log($(window).height()/parseInt(off)/100);
  // console.log(off);
    if(isAnimate) {
    $('body, html').animate({scrollTop: position}, 500); // + $(window).height()/(parseInt(off)/100)
  } else {
    $('body, html').animate({scrollTop: position}); // + $(window).height()/(parseInt(off)/100)
  }
}

  
// function checkSection() {
//     $('section').each(function() {
  
//       let $this = $(this),
//         topEdge = $this.offset().top - 68,
//         bottomEdge = topEdge + $this.height(),
//         wScroll = $(window).scrollTop();
  
//       if(topEdge < wScroll && bottomEdge > wScroll) {
//         let currentId = $this.data('section'),
//         reqlink = $('.nav__link').filter('[href="#' + currentId + '"]');
//         reqlink.closest('.nav__item').addClass('nav__item--active').siblings().removeClass('nav__item--active');
//         window.location.hash = currentId;
//       }
//     })
//   }


// scroll events


  window.onscroll = function() {
    const parallax = new Parallax();       
    let wScroll = window.pageYOffset;
    parallax.init(wScroll);
    // goToSection();
    // console.log(parallax.marg);
    // checkSection();
  };



// hover project images

let projectImages = document.querySelectorAll('.projects-gallery__item');

[].forEach.call(projectImages, function(image){
  let projectCaption = image.querySelector('.projects-gallery__caption');
    image.addEventListener('mouseenter', function(){
      projectCaption.classList.add('projects-gallery__caption--active');
    }); 
    image.addEventListener('mouseleave', function(){
      projectCaption.classList.remove('projects-gallery__caption--active');
    }); 
});

// hover partners images

const partnerContainer = document.querySelector('.partners');
const partnerImages = $('.partners__img');

partnerImages.on('mousemove', function(evt){
  $(this).addClass('partners__img--active');
  let otherImages = $(this).closest('PICTURE').siblings().find('.partners__img');
  otherImages.each(function(){
    $(this).removeClass('partners__img--active');
  })
});


//map init

ymaps.ready(initMap);
var myMap, 
    myPlacemark;

function initMap(){ 
    myMap = new ymaps.Map("map", {
        center: [60.032975, 30.323807],
        zoom: 15
    }); 
    myMap.behaviors.disable('scrollZoom');
    
    myPlacemark = new ymaps.Placemark([60.032524, 30.323270], {
        hintContent: 'Форум!',
        balloonContent: 'Энгельса 109'
    });
    
    myMap.geoObjects.add(myPlacemark);
}



//# sourceMappingURL=custom.js.map
