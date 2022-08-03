// const text = await Deno.readTextFile("./PlayerData.dat");
// const json = JSON.parse(text);

// const customSongs = new Set<string>();
// json
//     .localPlayers[0]
//     .levelsStatsData
//     .filter((x:any) => x.levelId.startsWith("custom_level_"))
//     .forEach((x:any) => customSongs.add(x.levelId))

// Deno.writeTextFileSync('customSongs.json', JSON.stringify([...customSongs]));
type SongVersion = {
    "hash": string,
    "key": string
    "state": string
    "createdAt": string
    "sageScore": 5,
    "diffs": [
        {
        }
    ],
    "downloadURL": string
    "coverURL": string
    "previewURL": string
};
type Song = { error: string } | {
    "id": string,
    "name": string,
    "versions": SongVersion[],
    "createdAt": string,
    "updatedAt": string,
    "lastPublishedAt": string
}

const customSongs: string[] = JSON.parse(await Deno.readTextFile("./customSongs.json"));

const updated: Array<{before: string, after: string}> = [];
const notFound: string[] = [];

for (const songId of customSongs) {
    const hash = songId.substr("custom_level_".length).toLowerCase();
    console.log(`Song to get: ${hash}`);
    // console.log(hash);

    // curl -X GET "https://api.beatsaver.com/maps/hash/8D2823BE1F39AF50D6BDC9642AC4673C6E4130FD" -H "accept: application/json"
    const response = await fetch(`https://api.beatsaver.com/maps/hash/${hash}`);
    const song: Song = await response.json();
    console.log(`Song found: ${hash}`);
    // console.log(song);

    if ('error' in song) {
        console.error(song.error);
        if (song.error === 'Not Found') {
            notFound.push(hash);
            continue;
        }
        break;
    }

    const [version] = song.versions
        .sort((a,b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);

            return dateB.getTime() - dateA.getTime();
        })
        ;
    
    if (version.hash !== hash) {
        updated.push({before: hash, after: version.hash});
    }

    const response2 = await fetch(version.downloadURL);
    const zipBuffer = await response2.arrayBuffer();
    await Deno.writeFile(`songs/${hash}.zip`, new Uint8Array(zipBuffer));

    console.log(`Song downloaded: songs/${hash}.zip`);
    // break;
}

// console.log(updated);
Deno.writeTextFileSync('updated.json', JSON.stringify(updated));
Deno.writeTextFileSync('notFound.json', JSON.stringify(notFound));
