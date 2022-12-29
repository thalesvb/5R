import Object from "sap/ui/base/Object";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.util
 */
export default class MediaSession extends Object {
    static hookStopAction(handler: MediaSessionActionHandler) {
        navigator.mediaSession.setActionHandler("stop", handler);
    }
    static updateMetadata(station: Station): void {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: station.name
        });
    }
}