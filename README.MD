# NetMD Tocmanip

## What is it?
NetMD Tocmanip is a library created to parse and edit the ToC (Table of Contents) sections of Sony's Minidiscs.
It is not meant to be used as a standalone program.
Note that this library can only work on raw bytes - it itself cannot fetch the ToC from a NetMD device. (See [netmd-js](https://github.com/cybercase/netmd-js) for that.)

## Which TOC sectors are currently supported?
- Sector 0 - Position and address sector. Stores the positions of tracks on the disc
- Sector 1 - Half-width title sector. Stores ASCII and katakana titles.
- Sector 2 - Timestamp sector. Stores tracks' date and time of recording and recorder timestamp.
- Sector 3 - Full-width title sector. Stores kanji, hiragana, full-width katakana and full-width ascii titles. (Not supported yet.)

## How to use it?
The two most basic functions for interacting with netmd-tocmanip are `parseTOC()` and `reconstructTOC()`.

### parseTOC()
Below is an example of how to use `parseTOC()` to load the table of contents from a minidisc using a supported NetMD device.
```ts
// Assuming `netmdInteface` is an instance of netmd-js's NetMDInterface
const factoryInterface = await netmdInterface.factory();
const sector0 = await readUTOCSector(factoryInterface, 0);
const sector1 = await readUTOCSector(factoryInterface, 1);

// As sectors are independent of each other, it's possible to skip a sector when using parseTOC()
const sector2 = null; //await readUTOCSector(factoryInterface, 2);

const toc = parseTOC(sector0, sector1, sector2);
```

### reconstructTOC()
Below is an example of how to use `reconstructTOC()` to recreate the binary representation of the ToC, and write it back to disc. 
```ts
// Assuming `netmdInterface` is an instance of netmd-js's NetMDInterface and `toc` is an instance of this library's ToC
const factoryInterface = await netmdInterface.factory();
const sectors = reconstructTOC(toc);
for(let sector = 0; sector<sectors.length; sector++){
    if(sector !== null){
        await writeUTOCSector(factoryInterface, sector, sectors[sector]);
    }
}
// WARNING:
// The `writeUTOCSector` calls don't force a ToC Edit. If the ToC becomes 'dirty' by, f. ex. changing a track's name
// the player will first flush its copy of sector 0 from SRAM back to the TOC caching peripheral, overwriting the data written via NetMD.
// To prevent that from happening, it's necessary to trigger a non-flushing ToC Edit with the help of netmd-exploits.
// (https://github.com/asivery/netmd-exploits)
```
## Contributions
Every contribution is welcome, but please stick to the TOC's specification.
This library isn't the place to implement custom features used only by new NetMD software.

## Credits
Writing this library would be much harder without the excellent article about the TOC on minidisc.org: https://www.minidisc.org/md_toc.html
