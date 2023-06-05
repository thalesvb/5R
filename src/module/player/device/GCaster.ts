import Object from "sap/ui/base/Object";
import Log from "sap/base/Log";
import { IMediaPlayer } from "./IMediaPlayer";
import { MediaPlayerEvents } from "../MediaPlayerEvents";

declare var cast: any;
declare var chrome: any;

declare global {
  interface Window {
    __onGCastApiAvailable: Function;
  }
}

/**
 * When a file is casted to device, it automatically try to play it.
 * 
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player.device
 */
export default class GCaster extends Object implements IMediaPlayer {

    private player: any;
    private controller: any;
    private device: string;
    private isMediaLoaded: boolean;

    private uiDispatcher: MediaPlayerEvents;

    constructor(switcher: Function) {
        super();
        this.injectCastJs(switcher);
    }

    private initializeCastApi(switcher: Function): void {
        cast.framework.CastContext.getInstance().setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        this.player = new cast.framework.RemotePlayer();
        this.controller = new cast.framework.RemotePlayerController(this.player);
        
        this.controller.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
            (e: any) => {
                if (e.value === true) {
                    switcher(this);
                } else {
                    switcher();
                }
            }
        );
    }

    private injectCastJs(switcher: Function): void {
        const that = this;
        window.__onGCastApiAvailable = function(isAvailable: boolean) {
            if (isAvailable) {
              that.initializeCastApi(switcher);
              that.styleButton();
            }
        };
        const gcs = document.createElement("script");
        gcs.id = "gcast";
        gcs.async = true;
        gcs.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
        document.head.appendChild(gcs);
    }

    isMuted(): boolean {
        return this.player.isMuted;
    }

    private styleButton(): void {
        const button = document.getElementsByName("cast_button")[0];
        if (!button) {
            return;
        }
        ["sapMBtnBase", "sapMBtn"].forEach((c) => {
            button.classList.add(c);
        });       
    }

    bindUI(dispatcher: MediaPlayerEvents): void {
        const type = cast.framework.RemotePlayerEventType;
        this.uiDispatcher = dispatcher;
        this.controller.addEventListener(type.IS_MUTED_CHANGED, this.onMuteChanged);
        this.controller.addEventListener(type.PLAYER_STATE_CHANGED, this.onPlayerStateChanged);
        this.controller.addEventListener(type.VOLUME_LEVEL_CHANGED, this.onVolumeLevelChanged);
    }

    unbindUI(dispatcher: MediaPlayerEvents): void {
        const type = cast.framework.RemotePlayerEventType;
        this.controller.removeEventListener(type.IS_MUTED_CHANGED, this.onMuteChanged);
        this.controller.removeEventListener(type.PLAYER_STATE_CHANGED, this.onPlayerStateChanged);
        this.controller.removeEventListener(type.VOLUME_LEVEL_CHANGED, this.onVolumeLevelChanged);
        this.uiDispatcher = null;
    }

    cast(station: Station): void {
        const instance = cast.framework.CastContext.getInstance();
        const session = instance.getCurrentSession();
        if (!session) {
            instance.requestSession().then(() => {
                if (instance.getCurrentSession()) {
                    cast(station);
                } else {
                    Log.error("Failed to cast");
                }
            });
            return;
        }
        const metadata = new chrome.cast.media.MusicTrackMediaMetadata();
        metadata.title = station.name;
        const image = station.cover ? station.cover : "https://i.imgur.com/ZC8No4V.png";
        metadata.images = [new chrome.cast.Image(image)];
        const mediaInfo = new chrome.cast.media.MediaInfo(station.url);
        mediaInfo.metadata = metadata;
        const mediaRequest = new chrome.cast.media.LoadRequest(mediaInfo);
        session.loadMedia(mediaRequest).then(() => {
            this.device = session.getCastDevice().friendlyName || this.device;
            this.isMediaLoaded = true;
        });
    }

    changeVolume(volume: number): void {
        /* Deactivating until a better, wider (circular) volume ranger is implemented.
           Some devices escalates dB output quickly.
        */
        return;
        const vol = volume / 100;
        this.player.volumeLevel = vol;
        this.controller.setVolumeLevel();
    }

    private onMuteChanged = (e: any): void => {
        if (e.value) {
            this.uiDispatcher.muted();
        } else {
            this.uiDispatcher.unmuted();
        }
    }

    private onPlayerStateChanged = (e: any): void => {
        const state = chrome.cast.media.PlayerState;
        switch(e.value) {
            case state.PLAYING: this.uiDispatcher.playing(); break;
            case state.IDLE:
            case state.PAUSED: this.uiDispatcher.paused(); break;
            
        }
    }

    private onVolumeLevelChanged = (e: any): void => {
        this.uiDispatcher.volume(e.value * 100);
    }

    stop(): void {
        this.controller.stop();
        this.isMediaLoaded = false;
    }

    toggleMute(): void {
        this.controller.muteOrUnmute();
    }

    togglePlay(station: Station): void {
        if(!this.isMediaLoaded) {
            this.cast(station);
        } else {
            this.controller.playOrPause();
        }
    }
}