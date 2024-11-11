import { SIGNATURES } from './signatures';
import { Fragment, ModeFlag, Timestamp, ToC } from './toc';
import { assert } from './utils';
import jconv from 'jconv';

const textDecoder = new TextDecoder();

function concatUint8Arrays(arrs: Uint8Array[]) {
    const newArray = new Uint8Array(arrs.reduce((a, b) => a + b.length, 0)).fill(0);
    let cursor = 0;
    for(let arr of arrs){
        newArray.set(arr, cursor);
        cursor += arr.length;
    }
    return newArray;
}

export function getTitleByCellIndex(toc: ToC, index: number, fullWidth: boolean = false, forceZeroFirst = false): string {
    let depth = 0;
    let cell = index;
    let cells: Uint8Array[] = [];
    assert(index >= 0 && index < 256);


    while(cell != 0 || forceZeroFirst) {
        if(depth > 10) {
            cells.push(new TextEncoder().encode('...'));
            break;
        }
        const cellContents = (fullWidth ? toc.fullWidthTitleCellList : toc.titleCellList)[cell];
        cells.push(new Uint8Array(cellContents.title));
        cell = cellContents.link;
        depth += 1;
        forceZeroFirst = false;
    }
    let flat = concatUint8Arrays(cells);
    const zeroIndex = flat.indexOf(0);
    if(zeroIndex !== -1) {
        flat = flat.slice(0, zeroIndex);
    }
    if(fullWidth) {
        return jconv.decode(Buffer.from(flat), "SJIS");
    } else {
        return textDecoder.decode(flat);
    }
}

export function getTitleByTrackNumber(toc: ToC, index: number, fullWidth = false, forceZeroFirst = false): string {
    return getTitleByCellIndex(toc, fullWidth ? toc.fullWidthTitleMap[index] : toc.titleMap[index], fullWidth, forceZeroFirst);
}

export function isValidFragment(fragment: Fragment): boolean {
    return (
        fragment.start.cluster !== 0 ||
        fragment.start.sector !== 0 ||
        fragment.start.group !== 0 ||
        fragment.end.cluster !== 0 ||
        fragment.end.sector !== 0 ||
        fragment.end.group !== 0
    );
}

export type CombinedTrackInfo = {
    timestamp: Timestamp | null;
    ranges: Fragment[];
    title: string | null;
    writtenBy: string | 'UNKNOWN' | null;
};

export function getTrackInfo(toc: ToC, index: number): CombinedTrackInfo {
    let title = toc.sectorsGiven.includes(1) ? getTitleByTrackNumber(toc, index) : null;
    let timestamp = toc.sectorsGiven.includes(2) ? toc.timestampList[toc.timestampMap[index]] : null;
    let ranges = [];

    let fragment: Fragment = toc.trackFragmentList[toc.trackMap[index]];
    do {
        ranges.push(fragment);
    } while (fragment.link !== 0 && (fragment = toc.trackFragmentList[fragment.link]));

    return {
        title,
        timestamp,
        ranges,
        writtenBy: timestamp === null ? null : (SIGNATURES[timestamp.signature] || 'UNKNOWN'),
    };
}

export function updateFlagAllFragmentsOfTrack(toc: ToC, index: number, flag: ModeFlag, set: boolean) {
    let fragment: Fragment = toc.trackFragmentList[toc.trackMap[index]];
    do {
        if (set) fragment.mode |= flag;
        else fragment.mode &= ~flag;
    } while (fragment.link !== 0 && (fragment = toc.trackFragmentList[fragment.link]));
}

export function swapTrack(toc: ToC, trackA: number, trackB: number) {
    assert(trackA >= 0 && trackA < 256);
    assert(trackB >= 0 && trackB < 256);
    let temp;
    temp = toc.trackMap[trackA];
    toc.trackMap[trackA] = toc.trackMap[trackB];
    toc.trackMap[trackB] = temp;

    temp = toc.titleMap[trackA];
    toc.titleMap[trackA] = toc.titleMap[trackB];
    toc.titleMap[trackB] = temp;

    temp = toc.timestampMap[trackA];
    toc.timestampMap[trackA] = toc.timestampMap[trackB];
    toc.timestampMap[trackB] = temp;
}
