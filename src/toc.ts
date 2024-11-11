import { ownSignature } from './signatures';
import { assert } from './utils';

export enum ModeFlag {
    F_EMPHASIS = 0x1, // (https://patentimages.storage.googleapis.com/d9/17/e8/61e3363b4ce965/JP4333131B2.pdf)
    F_STEREO = 0x2,
    F_SP_MODE = 0x4,
    F_CODECMODE_RESERVED = 0x8,
    F_AUDIO = 0x10, // Negated - AUDIO = 0, RESERVED = 1
    F_SCMS_DIG_COPY = 0x20,
    F_SCMS_UNRESTRICTED = 0x40,
    F_WRITABLE = 0x80,
}

export function createDiscAddress(bytes: Uint8Array | number[]): DiscAddress {
    const [b0, b1, b2] = bytes;
    return {
        cluster: (b0 << 6) | (b1 >> 2),
        sector: ((b1 & 0b11) << 4) | (b2 >> 4),
        group: b2 & 0b1111,
    };
}

export function discAddressToLogical(address: DiscAddress){
    return address.sector + (address.cluster * 32) ;
}

export function logicalToDiscAddress(logical: number){
    const cluster = Math.floor(logical / 32);
    const sector = logical % 32;
    const group = 0;
    return { cluster, sector, group };
}

export function discAddressToBytes(addr: DiscAddress): Uint8Array {
    return new Uint8Array([
        addr.cluster >> 6,
        ((addr.cluster & 0x3f) << 2) | ((addr.sector & 0x30) >> 4),
        ((addr.sector & 0x0f) << 4) | addr.group,
    ]);
}

export function getUserReadableTrackMode(fragment: Fragment) {
    let out: string[] = [];
    for (let i = 0; i < 31; i++) {
        let q = 1 << i;
        if ((fragment.mode & q) !== 0) {
            out.push(q in ModeFlag ? ModeFlag[q] : `?_${q}`);
        }
    }
    return out.join(', ');
}

export interface DiscAddress {
    cluster: number;
    sector: number;
    group: number;
}

export interface Fragment {
    start: DiscAddress;
    mode: number;
    end: DiscAddress;
    link: number;
}

export interface TitleCell {
    title: number[];
    link: number;
}

export interface Timestamp {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    signature: number;
}

export function parseTOC(...sectors: (Uint8Array | null)[]) {
    let rawBinary: Uint8Array;

    let _toc = {} as any;
    // Core functions
    let offset = 0;
    const byte = () => rawBinary[offset++];
    const short = () => (byte() << 8) | byte();
    const multiple = (n: number) => Array.from(rawBinary.slice(offset, (offset += n)));
    // ToC structures
    const discAddress = () => createDiscAddress(multiple(3));
    const fragment: () => Fragment = () => ({
        start: discAddress(),
        mode: byte(),
        end: discAddress(),
        link: byte(),
    });
    const titleCell: () => TitleCell = () => ({
        title: Array.from(multiple(7)),
        link: byte(),
    });
    const timestamp: () => Timestamp = () => ({
        year: byte(),
        month: byte(),
        day: byte(),
        hour: byte(),
        minute: byte(),
        second: byte(),
        signature: short(),
    });
    const toc = _toc as ToC;
    toc.sectorsGiven = [];

    for (let i = 0; i < 4; i++) {
        if (!sectors[i]) continue;
        toc.sectorsGiven.push(i);
        rawBinary = sectors[i]!;
        offset = 0;
        // Sector 0
        switch (i) {
            case 0:
                toc.sec0padding = multiple(0x1c);
                toc.deviceSignature = short();
                toc.discNonEmpty = byte();
                toc.nTracks = byte();

                toc.sec0apadding = multiple(0x0f);
                toc.nextFreeTrackSlot = byte();
                toc.trackMap = Array(256).fill(0).map(byte);
                toc.trackFragmentList = Array(256).fill(0).map(fragment);
                break;
            case 1:
                toc.sec1padding = multiple(0x2f);

                toc.nextFreeTitleSlot = byte();
                toc.titleMap = Array(256).fill(0).map(byte);
                toc.titleCellList = Array(256).fill(0).map(titleCell);
                break;
            case 2:
                toc.sec2padding = multiple(0x2f);

                toc.nextFreeTimestampSlot = byte();
                toc.timestampMap = Array(256).fill(0).map(byte);
                toc.timestampList = Array(256).fill(0).map(timestamp);
                break;
            case 3:
                toc.sec3padding = multiple(0x2f);

                toc.nextFreeFullWidthTitleSlot = byte();
                toc.fullWidthTitleMap = Array(256).fill(0).map(byte);
                toc.fullWidthTitleCellList = Array(256).fill(0).map(titleCell);
        }
    }

    return toc as ToC;
}

export function reconstructTOC(toc: ToC, updateSignature: boolean = true): (Uint8Array | null)[] {
    let sector: Uint8Array = new Uint8Array([]);
    let output: (Uint8Array | null)[] = [];

    if (updateSignature) {
        toc = {...toc, deviceSignature: ownSignature};
    }

    let sectorIndex = 0;

    const nextSector = () => {
        output.push(hasSectorPresent() ? sector : null);
        sector = new Uint8Array([]);
        sectorIndex++;
    };

    const hasSectorPresent = () => {
        return toc.sectorsGiven.includes(sectorIndex);
    };

    // Core data types
    const byte = (n: number) => (sector = new Uint8Array([...sector, n]));
    const short = (n: number) => (sector = new Uint8Array([...sector, n >> 8, n & 0xff]));
    const multiple = (n: Uint8Array | number[]) => (sector = new Uint8Array([...sector, ...n]));

    //ToC Structures
    const discAddress = (n: DiscAddress) => multiple(discAddressToBytes(n));
    const fragment = (n: Fragment) => {
        discAddress(n.start);
        byte(n.mode);
        discAddress(n.end);
        byte(n.link);
    };
    const titleCell = (n: TitleCell) => {
        assert(n.title.length === 7, 'Title cells must be exactly 7 characters long.');
        multiple(n.title);
        byte(n.link);
    };
    const timestamp = (n: Timestamp) => {
        byte(n.year);
        byte(n.month);
        byte(n.day);
        byte(n.hour);
        byte(n.minute);
        byte(n.second);
        short(n.signature);
    };

    if (hasSectorPresent()) {
        multiple(toc.sec0padding);
        short(toc.deviceSignature);
        byte(toc.discNonEmpty);
        byte(toc.nTracks);

        multiple(toc.sec0apadding);
        byte(toc.nextFreeTrackSlot);
        multiple(new Uint8Array(toc.trackMap));
        toc.trackFragmentList.forEach(fragment);
    }
    nextSector();

    if (hasSectorPresent()) {
        multiple(toc.sec1padding);
        byte(toc.nextFreeTitleSlot);
        multiple(new Uint8Array(toc.titleMap));
        toc.titleCellList.forEach(titleCell);
    }
    nextSector();

    if (hasSectorPresent()) {
        multiple(toc.sec2padding);
        byte(toc.nextFreeTimestampSlot);
        multiple(new Uint8Array(toc.timestampMap));
        toc.timestampList.forEach(timestamp);
    }
    nextSector();

    if (hasSectorPresent()) {
        multiple(toc.sec3padding);
        byte(toc.nextFreeFullWidthTitleSlot);
        multiple(new Uint8Array(toc.fullWidthTitleMap));
        toc.fullWidthTitleCellList.forEach(titleCell);
    }
    nextSector();

    return output;
}

export interface ToC {
    deviceSignature: number;
    nTracks: number;
    discNonEmpty: number;
    nextFreeTrackSlot: number;
    nextFreeTitleSlot: number;
    nextFreeTimestampSlot: number;
    nextFreeFullWidthTitleSlot: number;

    trackMap: number[];
    trackFragmentList: Fragment[];

    titleMap: number[];
    titleCellList: TitleCell[];

    timestampMap: number[];
    timestampList: Timestamp[];

    fullWidthTitleMap: number[];
    fullWidthTitleCellList: TitleCell[];

    sec0padding: number[]; // Unknown / Unchecked
    sec0apadding: number[]; // Unknown / Unchecked
    sec1padding: number[]; // Unknown / Unchecked
    sec2padding: number[]; // Unknown / Unchecked
    sec3padding: number[]; // Unknown / Unchecked

    sectorsGiven: number[];
}
