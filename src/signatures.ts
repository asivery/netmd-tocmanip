export const ownSignature = 0x8ca2;

const SIGNATURES: { [key: number]: string } = {
    0x121: 'Sony MZ-N520/MZ-NE410',
    0x124: 'Sony MZ-R3',    // From minidisc.org
    0x126: 'Sony MZ-R30',
    0x127: 'MZ-R50',
    0x144: 'Sony MDS-303',
    0x145: 'Sony MDS-503',
    0x146: 'Sony MDS-JE500/MDS-JE510',
    0x147: 'Sony MDS-B5',
    0x14A: 'Sony MDS-JE520',
    0x14C: 'Sony MDS-W1',
    0x14D: 'Sony MDS-JB920/MDS-JB730/MDS-JE530/MDS-JE330/MDS-JE440',
    0x154: 'Sony MDS-JB940',
    0x17E: 'Sony MDS-E12',
    0xA11: 'Sharp MD-MS701',
    0xD0A: 'Aiwa AM-F70',
    [ownSignature]: 'TOCManip',
};

export default SIGNATURES;
