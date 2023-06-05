import Object from "sap/ui/base/Object";
import StationPlayerController from "../../controller/StationPlayer.controller";

export enum PlaybackEvents {
    paused = "paused",
    playing = "playing",
    stopped = "stopped"
}

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player
 */
export class MediaPlayerEvents extends Object {

    private element: StationPlayerController;

    constructor(element: StationPlayerController) {
        super();
        this.element = element;
    }

    muted = (): void => {
        this.element.dispatchEvent(new Event("muted"));
    }

    unmuted = (): void => {
        this.element.dispatchEvent(new Event("unmuted"))
    }

    paused = (): void => {
        this.element.dispatchEvent(new Event("paused"));
    }

    playing = (): void => {
        this.element.dispatchEvent(new Event("playing"));
    }

    stopped = (): void => {
        this.element.dispatchEvent(new Event("stopped"));
    }

    volume = (vol: number) => {
        this.element.dispatchEvent(new CustomEvent("volumeChanged", {detail: vol}));
    }

}