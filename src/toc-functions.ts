import SIGNATURES from './signatures';
import { Fragment, ModeFlag, Timestamp, ToC } from './toc';
import { assert } from './utils';

export function getTitleByCellIndex(toc: ToC, index: number): string {
    assert(index >= 0 && index < 257);
    let cell = toc.titleCellList[index];
    return cell.title + (cell.link != 0 ? getTitleByCellIndex(toc, cell.link) : '');
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
    timestamp: Timestamp;
    ranges: Fragment[];
    title: string;
    writtenBy: string | 'UNKNOWN';
};

export function getTrackInfo(toc: ToC, index: number): CombinedTrackInfo {
    let title = getTitleByTrackNumber(toc, index);
    let timestamp = toc.timestampList[toc.timestampMap[index]];
    let ranges = [];

    let fragment: any = toc.trackFragmentList[toc.trackMap[index]];
    do {
        ranges.push(fragment);
    } while ((fragment = fragment.link && toc.trackFragmentList[fragment.link]));

    return {
        title,
        timestamp,
        ranges,
        writtenBy: SIGNATURES[timestamp.signature] || 'UNKNOWN',
    };
}

export function updateFlagAllFragmentsOfTrack(toc: ToC, index: number, flag: ModeFlag, set: boolean) {
    let fragment: any = toc.trackFragmentList[toc.trackMap[index]];
    do {
        if (set) fragment.setMode(flag);
        else fragment.unsetMode(flag);
    } while ((fragment = fragment.link && toc.trackFragmentList[fragment.link]));
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
