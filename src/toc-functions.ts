import SIGNATURES from './signatures';
import { Fragment, ModeFlag, Timestamp, ToC } from './toc';
import { assert } from './utils';

export function getTitleByCellIndex(toc: ToC, index: number, _depth: number = 0): string {
    if(_depth > 10) return "...";
    assert(index >= 0 && index < 256);
    let cell = toc.titleCellList[index];
    return cell.title + (cell.link != 0 ? getTitleByCellIndex(toc, cell.link, _depth + 1) : '');
}

export function getTitleByTrackNumber(toc: ToC, index: number): string {
    return getTitleByCellIndex(toc, toc.titleMap[index]);
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
