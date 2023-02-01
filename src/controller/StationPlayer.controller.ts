import Event from "sap/ui/base/Event"
import UI5Element from "sap/ui/core/Element"
import {system as DeviceSystem} from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel"
import Component from "src/Component";
import BaseController from "./BaseController";
import MediaSession from "../util/MediaSession";

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
            "volumeIcon": StationPlayerController.icon_sound_loud
        });
        this.setModel(this.stationModel, "stationView");
        this.getRouter().getRoute("stationPlayer").attachPatternMatched(this.onStationMatched, this);
        this.whenAudioElementAvailable = new Promise((resolve) => this.fnAudioElementAvailable = resolve);
        this.whenAudioElementAvailable = this.whenAudioElementAvailable.then((audio) => {
            audio.addEventListener('play',() => this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_pause));
            audio.addEventListener('pause',() => this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play));
            audio.addEventListener('suspend',() => this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play));
            audio.addEventListener('ended',() => this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play));
            audio.addEventListener('volumechange',() => {
                if (audio.muted) {
                    this.stationModel.setProperty("/volumeIcon", StationPlayerController.icon_sound_off);
                } else {
                    this.stationModel.setProperty("/volumeIcon", audio.volume < 0.5 ? StationPlayerController.icon_sound_low : StationPlayerController.icon_sound_loud );
                }
            });
            MediaSession.hookStopAction(()=>this.onStop());
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
        this.whenAudioElementAvailable.then((audio) => {
            audio.src = '';
            audio.removeAttribute('src');
            this.stationModel.setProperty("/playbackButton", StationPlayerController.icon_play)
        })
    }

    toggleFullScreen(): void {
        let appViewModel = this.getModel("appView") as JSONModel;
        let fullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
        appViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !fullScreen);
        if (!fullScreen) {
            // store current layout and go full screen
            appViewModel.setProperty("/previousLayout", appViewModel.getProperty("/layout"));
            appViewModel.setProperty("/layout", "MidColumnFullScreen");
        } else {
            // reset to previous layout
            appViewModel.setProperty("/layout", appViewModel.getProperty("/previousLayout"));
        }
    }

    togglePlay(): void {
        this.whenAudioElementAvailable.then((audio) => {
            if (!audio.src) {
                audio.src = this.currentStation.url;
            }
            if (audio.paused)
                audio.play();
            else {
                audio.pause();
            }
        });
    }
    toggleMute(): void {
        this.whenAudioElementAvailable.then((audio) => { audio.muted = !audio.muted });
    }

    private bindView(bindingPath: string): void {
        this.getView().bindElement({
            path: bindingPath,
            events: {
                change: this.onBindingChange.bind(this)
            }
        });
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
        if (this.getModel("appView").getProperty("/layout") !== "MidColumnFullScreen") {
            (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        }
        let storedStations = ((this.getModel() as JSONModel).getData() as AppStorage).stations;
        let stationIndex = storedStations.findIndex(station => station.guid === this.stationGuid);
        this.bindView(`/stations/${ stationIndex }`);
    }

    onCloseStation(): void {
        let audio = this.audioControl.getDomRef() as HTMLAudioElement;
        audio.pause();
        audio.src = "";

        (this.getModel("appView") as JSONModel).setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
        (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
        this.getRouter().navTo("master");
    }
}