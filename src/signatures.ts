export const ownSignature = 0x8ca2;

export const SIGNATURES: { [key: number]: string } = {
    // Sony
    0x120: 'Sony MZ-N505/MZ-N707/MZ-N1/MZ-R910',
    0x121: 'Sony MZ-N510/MZ-N520/MZ-NE410/MZ-N910/MZ-N920/MZ-N710/MZ-N10 / Aiwa AM-NX9',
    0x124: 'Sony MZ-R3 / Sony MZ-RH10',    // R3 From minidisc.org
    0x122: 'Sony MZ-NH1/MZ-NH700/MZ-NH900',
    0x125: 'Sony MZ-RH1',
    0x126: 'Sony MZ-R30',
    0x127: 'Sony MZ-R50',
    0x129: 'Sony MZ-R55',
    0x12B: 'Sony MZ-R90',
    0x12C: 'Sony MZ-R900/MZ-R700/MZ-R501',
    0x12F: 'Sony MZ-R410/MZ-R909/MZ-B100',
    0x136: 'Sony PMC-MD55',
    0x13D: 'Sony LAM-Z03',
    0x144: 'Sony MDS-303',
    0x145: 'Sony MDS-503',
    0x146: 'Sony MDS-JE500/MDS-JE510',
    0x147: 'Sony MDS-B5',
    0x14A: 'Sony MDS-JE520',
    0x14C: 'Sony MDS-W1',
    0x14D: 'Sony MDS-JB920/MDS-JB730/MDS-JE530/MDS-JE330/MDS-JE440',
    0x154: 'Sony MDS-JB940/MDS-S50/DMC-MD595/MDS-PC3',
    0x157: 'Sony MDS-NT1',
    0x158: 'Sony MMD-JE480',
    0x159: 'Sony MDS-S500',
    0x17E: 'Sony MDS-E10/MDS-E12',

    // Panasonic
    0x305: 'Panasonic SJ-MR100',
    0x307: 'Panasonic SJ-MR220',
    0x308: 'Panasonic SJ-MR250',
    0x30A: 'Panasonic SJ-MR270',
    
    // Sharp
    0xA11: 'Sharp MD-MS701',
    0xA23: 'Sharp MD-F250',
    
    // Teac/Tascam
    0x1209: 'Tascam MD-CD1mkII', // (Sony MD drive)
    0xA26: 'Tascam MD-CD1mkIII', // (Sharp MD drive)
    0xD0A: 'Aiwa AM-F70',
    
    [ownSignature]: 'TOCManip',
};
