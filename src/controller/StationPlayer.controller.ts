import Event from "sap/ui/base/Event"
import UI5Element from "sap/ui/core/Element"
import {system as DeviceSystem} from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel"
import Component from "src/Component";
import BaseController from "./BaseController";
import MediaSession from "../util/MediaSession";
import Visualization from "../module/player/Visualization";
import HTML from "sap/ui/core/HTML";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class StationPlayerController extends BaseController {
    private static readonly icon_pause = "sap-icon://media-pause";
    private static readonly icon_play = "sap-icon://media-play";
    private static readonly icon_sound_off = "sap-icon://sound-off";
    private static readonly icon_sound_low = "sap-icon://sound";
    private static readonly icon_sound_loud = "sap-icon://sound-loud";
    private static validKeys = ["guid"];
    private stationModel: JSONModel;
    private stationGuid: string;
    private currentStation: Station;
    private audioControl: UI5Element;
    private whenAudioElementAvailable: Promise<HTMLAudioElement>;
    private fnAudioElementAvailable: Function;
     onInit(): void {
        this.audioControl = this.byId("audioPlayer");
        this.stationModel = new JSONModel({
            "playbackButton" : StationPlayerController.icon_play,
            "visualizationEnabled": false,
            "volumeIcon": StationPlayerController.icon_sound_loud
        });
        this.setModel(this.stationModel, "stationView");
        this.getRouter().getRoute("stationPlayer").attachPatternMatched(this.onStationMatched, this);
        this.whenAudioElementAvailable = new Promise((resolve) => this.fnAudioElementAvailable = resolve);
        this.whenAudioElementAvailable = this.whenAudioElementAvailable.then((audio) => {
            audio.addEventListener('play', this.onAudioPlay.bind(this), { passive: true });
            audio.addEventListener('pause', this.onAudioPause.bind(this), { passive: true });
            audio.addEventListener('suspend', this.onAudioPause.bind(this), { passive: true });
            audio.addEventListener('ended', this.onAudioPause.bind(this), { passive: true });
            audio.addEventListener('volumechange',() => {
                if (audio.muted) {
                    this.stationModel.setProperty("/volumeIcon", StationPlayerController.icon_sound_off);
                } else {
                    this.stationModel.setProperty("/volumeIcon", audio.volume < 0.5 ? StationPlayerController.icon_sound_low : StationPlayerController.icon_sound_loud );
                }
            });
            MediaSession.hookStopAction(()=>this.onStop());
            Visualization.linkAudioElement(audio);
            return audio;
        });
    }

    handleVolumeSlider(event: Event) {
        let volume = event.getParameter("value");
        this.whenAudioElementAvailable.then((audio) => {
            audio.volume = volume/100;
            if (audio.muted) {
                audio.muted = false;
            }
        });
    }

    onEdit(): void {
        (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("stationEdit", {
            stationGuid: this.stationGuid
        });
    }

    onStop(): void {
        // TODO: A call to audio.pause and at same time changing src does not trigger paused event.
        //       Maybe there is a way to having it triggered to avoid needing to call the related code
        //       here.
        const audioPauseCode = this.onAudioPause.bind(this);

        this.whenAudioElementAvailable.then((audio) => {
            audioPauseCode();
            audio.src = '';
            audio.removeAttribute('src');
            this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play);
        });
    }

    toggleFullScreen(): void {
        let appViewModel = this.getModel("appView") as JSONModel;
        let fullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        appViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !fullScreen);
        this.calculateLayout();
    }

    togglePlay(): void {
        const that = this;
        this.whenAudioElementAvailable.then((audio) => {
            if (!audio.src) {
                audio.src = this.currentStation.url;
            }
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        });
    }
    toggleMute(): void {
        this.whenAudioElementAvailable.then((audio) => { audio.muted = !audio.muted });
    }

    toggleVisualization(): void {
        const that = this;
        this.whenAudioElementAvailable.then((audio) => {
            let visualizationEnabled = !that.stationModel.getProperty("/visualizationEnabled");
            if (visualizationEnabled) {
                // When started hidden, HTML Canvas element is not available yet to fetch by JS,
                // UI5 only creates it when wrapper turns visible for first time.
                const visWrapper = that.byId("visualizationWrapper") as HTML;
                const afterRender = () => {
                    const visCanvas = document.getElementById("visualizer") as HTMLCanvasElement;
                    Visualization.display(visCanvas);
                    if (!audio.paused) {
                        Visualization.start();
                    }
                    visWrapper.detachAfterRendering(afterRender);
                }
                visWrapper.attachAfterRendering({}, afterRender);
            }
            that.stationModel.setProperty("/visualizationEnabled", visualizationEnabled);

            if (!visualizationEnabled) {
                Visualization.stop();
            } else if (document.getElementById("visualizer") && !audio.paused) {
                Visualization.start();
            }
        });
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
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play);
        if (this.stationModel.getProperty("/visualizationEnabled")) {
            Visualization.stop();
        }
    }

    private onAudioPlay(): void {
        this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_pause);
        if (this.stationModel.getProperty("/visualizationEnabled")) {
            Visualization.start();
        }
    }

    private onBindingChange(): void {
        let elementBinding = this.getView().getElementBinding();
        let boundContext = elementBinding.getBoundContext();
        if (!boundContext || !boundContext.getProperty("guid")) {
            this.getRouter().getTargets().display("stationNotFound");
            (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
            return;
        }
        this.currentStation = boundContext.getObject() as Station;
        let audio = this.audioControl.getDomRef() as HTMLAudioElement;
        if (audio === null) {
            return;
        }
        this.fnAudioElementAvailable(audio);
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
}