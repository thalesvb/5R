import Event from "sap/ui/base/Event"
import JSONModel from "sap/ui/model/json/JSONModel"
import Component from "src/Component";
import BaseController from "./BaseController";
import MediaSession from "../util/MediaSession";
import Visualization from "../module/player/Visualization";
import HTML from "sap/ui/core/HTML";
import { IMediaPlayer } from "../module/player/device/IMediaPlayer";
import LocalPlayer from "../module/player/device/LocalPlayer";
import GCaster from "../module/player/device/GCaster";
import { MediaPlayerEvents } from "../module/player/MediaPlayerEvents";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class StationPlayerController extends BaseController implements EventTarget {
    private static readonly icon_pause = "sap-icon://media-pause";
    private static readonly icon_play = "sap-icon://media-play";
    private static readonly icon_sound_off = "sap-icon://sound-off";
    private static readonly icon_sound_low = "sap-icon://sound";
    private static readonly icon_sound_loud = "sap-icon://sound-loud";
    private static validKeys = ["guid"];
    private stationModel: JSONModel;
    private stationGuid: string;
    private currentStation: Station;
    private player: IMediaPlayer;
    private localPlayer: LocalPlayer;
    private mpDispatcher: MediaPlayerEvents;
    private isPlaying: boolean;

    onInit(): void {
        this.mpDispatcher = new MediaPlayerEvents(this);
        this.localPlayer = new LocalPlayer();
        this.localPlayer.bindUI(this.mpDispatcher);
        this.player = this.localPlayer;
        new GCaster(this.switchPlayer.bind(this));
        MediaSession.hookStopAction(()=>this.onStop());
        this.stationModel = new JSONModel({
            "playbackButton" : StationPlayerController.icon_play,
            "shareApiAvailable" : navigator.share ? true : false,
            "visualizationEnabled": false,
            "volume": 100,
            "volumeIcon": StationPlayerController.icon_sound_loud
        });
        this.setModel(this.stationModel, "stationView");
        this.getRouter().getRoute("stationPlayer").attachPatternMatched(this.onStationMatched, this);
    }

    handleVolumeSlider(event: Event) {
        let volume = event.getParameter("value");
        this.volumeChange(volume);
    }

    onEdit(): void {
        (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("stationEdit", {
            stationGuid: this.stationGuid
        });
    }

    onShare(): void {
        if (!navigator.share) {
            console.error("Web Share API not available");
            return;
        }
        const station = this.currentStation;
        navigator.share({
            title: station.name,
            text: station.name,
            url: station.url
        }).catch((error) => console.error("Error sharing", error));
    }

    onStop(): void {
        // TODO: A call to audio.pause and at same time changing src does not trigger paused event.
        //       Maybe there is a way to having it triggered to avoid needing to call the related code
        //       here.
        this.onAudioPause();
        this.player.stop();
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play);
    }

    private switchPlayer(player: IMediaPlayer) {
        this.player.stop();
        this.player.unbindUI(this.mpDispatcher);
        if (player) {
            this.player = player;
        } else {
            this.player = this.localPlayer;
        }
        this.player.bindUI(this.mpDispatcher);
        if (this.isPlaying) {
            this.player.togglePlay(this.currentStation);
        }
    }

    toggleFullScreen(): void {
        let appViewModel = this.getModel("appView") as JSONModel;
        let fullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        appViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !fullScreen);
        this.calculateLayout();
    }

    togglePlay(): void {
        this.player.togglePlay(this.currentStation);
    }

    toggleMute(): void {
        let volumeIcon: string;
        this.player.toggleMute();
    }

    toggleVisualization(): void {
        Visualization.linkAudioElement(this.localPlayer.audio);
        const that = this;
        let visualizationEnabled = !that.stationModel.getProperty("/visualizationEnabled");
        if (visualizationEnabled) {
            // When started hidden, HTML Canvas element is not available yet to fetch by JS,
            // UI5 only creates it when wrapper turns visible for first time.
            const visWrapper = that.byId("visualizationWrapper") as HTML;
            const afterRender = () => {
                const visCanvas = document.getElementById("visualizer") as HTMLCanvasElement;
                Visualization.display(visCanvas);
                if (!this.localPlayer.audio.paused) {
                    Visualization.start();
                }
                visWrapper.detachAfterRendering(afterRender);
            }
            visWrapper.attachAfterRendering({}, afterRender);
        }
        that.stationModel.setProperty("/visualizationEnabled", visualizationEnabled);

        if (!visualizationEnabled) {
            Visualization.stop();
        } else if (document.getElementById("visualizer") && !this.localPlayer.audio.paused) {
            Visualization.start();
        }
    }

    private bindView(bindingPath: string): void {
        this.getView().bindElement({
            path: bindingPath,
            events: {
                change: this.onBindingChange.bind(this)
            }
        });
    }

    private calculateLayout(): void {
        const appViewModel = this.getModel("appView") as JSONModel;
        const fullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        if (fullScreen) {
            // Store previous layout when enteriing fullscreen, otherwise do nothing.
            const currentLayout = appViewModel.getProperty("/layout");
            if (currentLayout !== "MidColumnFullScreen") {
                appViewModel.setProperty("/previousLayout", appViewModel.getProperty("/layout"));
                appViewModel.setProperty("/layout", "MidColumnFullScreen");
            }
        } else {
            // reset to previous layout
            appViewModel.setProperty("/layout", appViewModel.getProperty("/previousLayout"));
        }
    }

    private onAudioPause(): void {
        this.isPlaying = false;
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play);
        if (this.stationModel.getProperty("/visualizationEnabled")) {
            Visualization.stop();
        }
    }

    private onAudioMute(): void {
        this.stationModel.setProperty("/volumeIcon", StationPlayerController.icon_sound_off);
    }

    private onAudioUnmute(): void {
        const volume = this.stationModel.getProperty("/volume");
        const volumeIcon = volume < 50 ? StationPlayerController.icon_sound_low : StationPlayerController.icon_sound_loud;
        this.stationModel.setProperty("/volumeIcon", volumeIcon);
    }

    private onAudioPlay(): void {
        this.isPlaying = true;
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_pause);
        if (this.stationModel.getProperty("/visualizationEnabled")) {
            Visualization.start();
        }
    }

    private onBindingChange(): void {
        this.onStop();
        let elementBinding = this.getView().getElementBinding();
        let boundContext = elementBinding.getBoundContext();
        if (!boundContext || !boundContext.getProperty("guid")) {
            this.getRouter().getTargets().display("stationNotFound");
            (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
            return;
        }
        this.currentStation = boundContext.getObject() as Station;
        MediaSession.updateMetadata(this.currentStation);
        // FIXME: Didn't find yet a eventListener that detects either src was changed or playback was stopped due src change.
        //        That's why this icon change exists here.
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play);
        //audio.play()
    }
    private onStationMatched(event: Event): void {
        let args = event.getParameter("arguments");
        this.stationGuid = args.stationGuid;
        const appViewModel = this.getModel("appView") as JSONModel;
        const fullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        if (fullScreen) {
            this.calculateLayout()
        } else {
            if (appViewModel.getProperty("/layout") === "OneColumn") {
                appViewModel.setProperty("/layout", "TwoColumnsMidExpanded");
            }
        }
        let storedStations = ((this.getModel() as JSONModel).getData() as AppStorage).stations;
        let stationIndex = storedStations.findIndex(station => station.guid === this.stationGuid);
        this.bindView(`/stations/${ stationIndex }`);
    }

    onCloseStation(): void {
        this.onStop();

        (this.getModel("appView") as JSONModel).setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
        (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
        this.getRouter().navTo("master");
    }

    addEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        throw new Error("Method not implemented.");
    }

    dispatchEvent(event: globalThis.Event): boolean {
        switch(event.type) {
            case "paused": this.onAudioPause(); break;
            case "playing": this.onAudioPlay(); break;
            case "stopped": this.onAudioPause(); break;
            case "muted": this.onAudioMute(); break;
            case "unmuted": this.onAudioUnmute(); break;
            case "volumeChanged": this.volumeChange((event as CustomEvent).detail, true);
            default: return false;
        }
        return true;
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        throw new Error("Method not implemented.");
    }

    private volumeChange(volume: number, updateSlider?: boolean): void {
        this.player.changeVolume(volume);
        this.stationModel.setProperty("/volumeIcon", volume < 50 ? StationPlayerController.icon_sound_low : StationPlayerController.icon_sound_loud );
        if(updateSlider) {
            this.stationModel.setProperty("/volume", volume);
        }
    }

}