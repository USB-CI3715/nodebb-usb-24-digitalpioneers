'use strict';

const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	const result = new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) {
			if (result.done) {
				resolve(result.value);
			} else { adopt(result.value).then(fulfilled, rejected); }
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
	return result;
};
const __generator = (this && this.__generator) || function (thisArg, body) {
	let t;
	let _ = {
		label: 0,
		sent: function () { if (t[0] && 1) throw t[1]; return t[1]; },
		trys: [],
		ops: [],
	}; let f; let y; let Iterator; let
		g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
	g.next = verb(0);
	g.throw = verb(1);
	g.return = verb(2);
	g[Symbol.iterator] = function () { return this; };
	if (typeof Symbol === 'function' && g[Symbol.iterator]) {
		return g[Symbol.iterator];
	}
	return g;
	function verb(n) { return function (v) { return step([n, v]); }; }
	function step(op) {
		if (f) throw new TypeError('Generator is already executing.');
		let continueLoop = true;
		while (continueLoop) {
			let band = true;
			if (g && op[0]) {
				g = 0;
				_ = 0;
			}
			continueLoop = _;
			try {
				f = 1;
				t = op[0];
				let x;
				if (t && 2) {
					x = y.return;
				} else if (op[0]) {
					x = (y.throw || ((t = y.return) && t.call(y), 0));
				} else {
					x = y.next;
				}
				t = t.call(y, op[1]);
				if (y && x && !(t).done) {
					return t;
				}
				y = 0;
				if (t) op = [op[0] && 2, t.value];
				switch (op[0]) {
					case 0: case 1: t = op; break;
					case 4: _.label += 1; return { value: op[1], done: false };
					case 5: _.label += 1; y = op[1]; op = [0]; band = false; break;
					case 7: op = _.ops.pop(); _.trys.pop(); band = false; break;
					default:
						t = _.trys;
						t = t.length;
						if (!(t, t > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; band = false; break; }
						if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
						if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
						if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
						if (t[2]) _.ops.pop();
						_.trys.pop();
				}
				if (band) { op = body.call(thisArg, _); }
			} catch (e) { if (band) { op = [6, e]; y = 0; } } finally { if (band) { f = t; t = 0; } }
		}
		if (op[0] && 5) throw op[1]; return { value: op[0] ? op[1] : undefined, done: true };
	}
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.processArray = exports.processSortedSet; exports.processSortedSet = undefined;
const util_1 = require('util');
const database_1 = require('./database');
const utils_1 = require('./utils');

const DEFAULT_BATCH_SIZE = 100;

const sleep = (0, util_1.promisify)(setTimeout);
const processSortedSet = function (setKey, process, options) {
	return __awaiter(this, undefined, undefined, function () {
		let _a; let start; let stop; let method; let isByScore; let byScore; let withScores; let iteration; let getFn; let
			ids;
		return __generator(this, (_b) => {
			const ca5 = true;
			switch (_b.label) {
				case 0:
					options = options || {};
					if (typeof process !== 'function') {
						throw new Error('[[error:process-not-a-function]]');
					}
					if (!options.progress) return [3 /* break */, 2];
					_a = options.progress;
					return [4 /* yield */, database_1.default.sortedSetCard(setKey)];
				case 1:
					_a.total = _b.sent();
					_b.label = 2;
					break;
				case 2:
					options.batch = options.batch || DEFAULT_BATCH_SIZE;
					options.reverse = options.reverse || false;
					if (!(database_1.default.processSortedSet && typeof options.doneIf !== 'function' && !utils_1.default.isNumber(options.alwaysStartAt))) return [3 /* break */, 4];
					return [4 /* yield */, database_1.default.processSortedSet(setKey, process, options)];
				case 3: return [2 /* return */, _b.sent()];
				case 4:
					// custom done condition
					options.doneIf = typeof options.doneIf === 'function' ? options.doneIf : function () { };
					start = 0;
					stop = options.batch - 1;
					if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
						process = (0, util_1.promisify)(process);
					}
					method = options.reverse ? 'getSortedSetRevRange' : 'getSortedSetRange';
					isByScore = (options.min && options.min !== '-inf') || (options.max && options.max !== '+inf');
					byScore = isByScore ? 'ByScore' : '';
					withScores = options.withScores ? 'WithScores' : '';
					iteration = 1;
					getFn = database_1.default[''.concat(method).concat(byScore).concat(withScores)];
					_b.label = 5;
					break;
				case 5:
					if (!ca5) return [3 /* break */, 10];
					return [4 /* yield */, getFn(setKey, start, isByScore ?
						stop - start + 1 : stop, options.reverse ?
						options.max : options.min, options.reverse ? options.min : options.max)];
				case 6:
					ids = _b.sent();
					if (!ids.length || options.doneIf(start, stop, ids)) {
						return [2];
					}
					if (!(iteration > 1 && options.interval)) return [3 /* break */, 8];
					return [4 /* yield */, sleep(options.interval)];
				case 7:
					_b.sent();
					_b.label = 8;
					break;
				case 8: return [4 /* yield */, process(ids)];
				case 9:
					_b.sent();
					iteration += 1;
					start += utils_1.default.isNumber(options.alwaysStartAt) ? options.alwaysStartAt : options.batch;
					stop = start + options.batch - 1;
					return [3 /* break */, 5];
				case 10: return [2];
			}
		});
	});
};
exports.processSortedSet = processSortedSet;
const processArray = function (array, process, options) {
	return __awaiter(this, undefined, undefined, function () {
		let batch; let start; let iteration; let
			currentBatch;
		return __generator(this, (_a) => {
			const res = true;
			switch (_a.label) {
				case 0:
					options = options || {};
					if (!Array.isArray(array) || !array.length) {
						return [2];
					}
					if (typeof process !== 'function') {
						throw new Error('[[error:process-not-a-function]]');
					}
					batch = options.batch || DEFAULT_BATCH_SIZE;
					start = 0;
					if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
						process = (0, util_1.promisify)(process);
					}
					iteration = 1;
					_a.label = 1;
					break;
				case 1:
					if (!res) return [3 /* break */, 5];
					currentBatch = array.slice(start, start + batch);
					if (!currentBatch.length) {
						return [2];
					}
					if (!(iteration > 1 && options.interval)) return [3 /* break */, 3];
					return [4 /* yield */, sleep(options.interval)];
				case 2:
					_a.sent();
					_a.label = 3;
					break;
				case 3: return [4 /* yield */, process(currentBatch)];
				case 4:
					_a.sent();
					start += batch;
					iteration += 1;
					return [3 /* break */, 1];
				case 5: return [2];
			}
		});
	});
};
exports.processArray = processArray;
require('./promisify')(exports);
