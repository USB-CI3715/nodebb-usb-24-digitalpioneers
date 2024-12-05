'use strict';

import * as util from 'util';

import db from './database' ;
import utils from './utils' ;

const DEFAULT_BATCH_SIZE: number = 100;
import { promisify } from 'util';
const sleep = promisify(setTimeout);

export const processSortedSet = async function (setKey: string, process: Function, options: any): Promise<void> {
    options = options || {};

    if (typeof process !== 'function') {
        throw new Error('[[error:process-not-a-function]]');
    }

    // Progress bar handling (upgrade scripts)
	if (options.progress) {
        options.progress.total = await db.sortedSetCard(setKey);
    }

    options.batch = options.batch || DEFAULT_BATCH_SIZE;
    options.reverse = options.reverse || false;

    // use the fast path if possible
    if (db.processSortedSet && typeof options.doneIf !== 'function' && !utils.isNumber(options.alwaysStartAt)) {
        return await db.processSortedSet(setKey, process, options);
    }

    // custom done condition
	options.doneIf = typeof options.doneIf === 'function' ? options.doneIf : function (): void {};

    let start: number = 0;
    let stop: number = options.batch - 1;

    if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
        process = promisify(process);
    }
    
    const method: string = options.reverse ? 'getSortedSetRevRange' : 'getSortedSetRange';
    const isByScore: boolean = (options.min && options.min !== '-inf') || (options.max && options.max !== '+inf');
    const byScore: string = isByScore ? 'ByScore' : '';
    const withScores: string = options.withScores ? 'WithScores' : '';
    let iteration: number = 1;
    const getFn: Function = db[`${method}${byScore}${withScores}`];
    while (true) {
        /* eslint-disable no-await-in-loop */
        const ids: number[] = await getFn(
            setKey,
            start,
            isByScore ? stop - start + 1 : stop,
            options.reverse ? options.max : options.min,
            options.reverse ? options.min : options.max,
        );
        
        if (!ids.length || options.doneIf(start, stop, ids)) {
            return;
        }
        if (iteration > 1 && options.interval) {
            await sleep(options.interval);
        }
        await process(ids);
        iteration += 1;
        start += utils.isNumber(options.alwaysStartAt) ? options.alwaysStartAt : options.batch;
		stop = start + options.batch - 1;  
    }  
};

export const processArray = async function (array: any[], process: Function, options: any): Promise<void> {
    options = options || {};

    if (!Array.isArray(array) || !array.length) {
        return;
    }
    if (typeof process !== 'function') {
        throw new Error('[[error:process-not-a-function]]');
    }
    
    const batch: number = options.batch || DEFAULT_BATCH_SIZE;
    let start: number = 0;
    if (process && process.constructor && process.constructor.name !== 'AsyncFunction') {
        process = promisify(process);
    }
    let iteration: number = 1;
    while (true) {
        const currentBatch: any[] = array.slice(start, start + batch);

        if (!currentBatch.length) {
            return;
        }
        if (iteration > 1 && options.interval) {
            await sleep(options.interval);
        }
        await process(currentBatch);
        
        start += batch;
        iteration += 1;
    }  
};

require('./promisify')(exports);
