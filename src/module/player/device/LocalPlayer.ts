import Object from "sap/ui/base/Object";
import Log from "sap/base/Log";
import { IMediaPlayer } from "./IMediaPlayer";
import Message from "sap/ui/core/message/Message";
import NotificationManager from "../../../util/NotificationManager";
import { MediaPlayerEvents } from "../MediaPlayerEvents";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player.device
 */
export default class LocalPlayer extends Object implements IMediaPlayer {
    readonly audio: HTMLAudioElement;
    private muteState: boolean;
    private dispatcher: MediaPlayerEvents;
    constructor() {
        super();
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "none";
        this.muteState = this.audio.muted;
    }

    bindUI(dispatcher: MediaPlayerEvents): void {
        (a => {
            a.addEventListener('play', dispatcher.playing, { passive: true });
            a.addEventListener('pause', dispatcher.paused, { passive: true });
            a.addEventListener('ended', dispatcher.stopped, { passive: true });
            a.addEventListener('volumechange', this.onVolumeChanged, { passive: true});
        })(this.audio);
        this.dispatcher = dispatcher;
    }

    unbindUI(dispatcher: MediaPlayerEvents): void {
        (a => {
            a.removeEventListener('play', dispatcher.playing);
            a.removeEventListener('pause', dispatcher.paused);
            a.removeEventListener('ended', dispatcher.stopped);
            a.removeEventListener('volumechange', this.onVolumeChanged);
        })(this.audio);
        this.dispatcher = null;
    }

    changeVolume(volume: number) {
        ((a: HTMLAudioElement) => {
            a.volume = volume / 100;
            if (a.muted) {
                a.muted = false;
            }
        })(this.audio);
    }

    private onVolumeChanged = (e: any): void => {
        if (this.muteState !== this.audio.muted) {
            this.muteState ? this.dispatcher.unmuted() : this.dispatcher.muted();
            this.muteState = this.audio.muted;
        }
    }

    isMuted(): boolean {
        return this.audio.muted;
    }

    stop(): void {
        this.audio.src = '';
        this.audio.removeAttribute("src");
    }

    toggleMute(): void {
        this.audio.muted = !this.audio.muted;
    }

    togglePlay(s: Station): void {
        ((a: HTMLAudioElement) => {
            if (!a.src) {
                a.src = s.url;
            }
            if (a.paused) {
                a.play().catch((reason) => {
                    const notif = NotificationManager.getInstance();
                    notif.addNotifications(new Message({ message: reason }));
                    a.pause();
                });
            } else {
                a.pause();
            }
        })(this.audio);
    }
}