import Object from "sap/ui/base/Object";

/**
 * @namespace thalesvb.5R.util
 */
export default class MediaSession extends Object {
    static updateMetadata(station: Station): void {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: station.name
        });
    }
}