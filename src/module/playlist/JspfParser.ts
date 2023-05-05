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
export default class JspfParser implements IPlaylistParser {

    readonly extensions: string;
    readonly name: string;

    constructor() {
        this.extensions = "jspf";
        this.name = "JSPF";
    }

    parse(data:string): Station[] {
        const jspf = JSON.parse(data) as JspfFile;
        return jspf.playlist.track.map(t => ({
            guid: undefined,
            url: t.location[0],
            name: t.title,
            cover: t.image
        }));
    }
}
