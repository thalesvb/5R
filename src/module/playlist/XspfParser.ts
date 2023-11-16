// https://xspf.org/jspf
// https://xspf.org/spec

import IPlaylistParser from "./IPlaylistParser"

type JspfTrack = {
    location: string[],
    identifier?: string[],
    title?: string,
    creator?: string,
    annotation?: string,
    info?: string,
    image?: string,
    album?: string,
    trackNum?: number,
    duration?: number
}
type JspfPlaylist = {
    title?: string,
    creator?: string,
    annotation?: string,
    info?: string,
    location?: string,
    identifier?: string,
    image?: string
    date?: Date,
    license?: string,

    track: JspfTrack[]
}
type JspfFile = {
    playlist: JspfPlaylist
}

function jspfToStations(jspf: JspfFile): Station[] {
    return jspf.playlist.track.map(t => ({
        guid: undefined,
        url: t.location[0],
        name: t.title,
        cover: t.image
    }));
}
export class JspfParser implements IPlaylistParser {

    readonly extensions: string;
    readonly name: string;

    constructor() {
        this.extensions = "jspf";
        this.name = "JSPF";
    }

    parse(data:string): Station[] {
        const jspf = JSON.parse(data) as JspfFile;
        return jspfToStations(jspf);
    }
}

export class XspfParser implements IPlaylistParser {

    readonly extensions: string;
    readonly name: string;

    constructor() {
        this.extensions = "xspf";
        this.name = "XSPF";
    }

    parse(data: string): Station[] {
        const parser = new DOMParser();
        const plDoc = parser.parseFromString(data, "text/xml");
        const trackList = plDoc.getElementsByTagName("trackList")[0];
        if (!trackList) {
            return;
        }
        const tracks: JspfTrack[] = [];
        for(let i = 0; i<trackList.children.length; ++i) {
            const trackElem = trackList.children.item(i);
            const title = trackElem.getElementsByTagName("title")[0];
            const location = trackElem.getElementsByTagName("location")[0];
            const image = trackElem.getElementsByTagName("image")[0];
            tracks.push({
                title: title?.textContent,
                location : [location?.textContent],
                image: image?.textContent});
        }
        const jspfDoc = {
            "playlist": {
                "track": tracks
            }
        }
        return jspfToStations(jspfDoc);
    }
}
