import BaseController from "./BaseController";
import Wizard from "sap/m/Wizard";
import JSONModel from "sap/ui/model/json/JSONModel";
import PlaylistManagement from "../module/PlaylistManagement";
import LocalStorageModel from "../model/LocalStorageModel";
import WizardStep from "sap/m/WizardStep";
import Input from "sap/m/Input";
import { ValueState } from "sap/ui/core/library";

import { fileOpen } from "browser-fs-access";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class PlaylistImporter extends BaseController {
    private wizard: Wizard;

    onInit(): void {
        this.wizard = this.byId("importerWizard") as Wizard;
        this.setModel(new JSONModel({"remoteUrl": "http://localhost:8080/test/test.jspf"}), "importer");
        this.setModel(new JSONModel(), "importerView");
        this.getRouter().getRoute("playlistImporter").attachPatternMatched(this.onPlaylistImporterMatched, this);
        (Wizard as any).CONSTANTS.MINIMUM_STEPS = 1; // Guidelines should be on guidelines, not on error log.
    }

    onCancel(): void {
        this.onNavBack("masterEdit");
    }

    onNextStep(): void {
        this.wizard.nextStep();
    }

    onSubmit(): void {
        const entriesToAdd = this.getView().getModel("importer").getProperty("/entries") as Station[];
        let storageModel = this.getModel() as LocalStorageModel;
        entriesToAdd.forEach(e => storageModel.addStation(e));
        this.getRouter().navTo("masterEdit");
    }

    pickEntriesActivate(): void {
        const pls = new PlaylistManagement();
        const model = this.getModel("importer") as JSONModel;
        const url = model.getProperty("/remoteUrl");
        if (url) {
            pls.importFromExternalSource(url).then((importedEntries) => {
                model.setProperty("/entries", importedEntries);
            });
        }
    }

    pickLocalFile(): void {
        const pls = new PlaylistManagement();
        const model = this.getModel("importer") as JSONModel;
        fileOpen({
            description: this.getResourceBundle().getText("playlists_fileTypeDescription"),
            extensions: ['.jspf', '.xspf']
        }).then((blob) =>
            pls.importFromLocalSource(blob).then((importedEntries) => {
                model.setProperty("/entries", importedEntries);
                this.wizard.nextStep();
            })
        );
    }

    sourceStepActivate(): void {
        //this.sourceStepValidation();
    }

    sourceStepValidation(): void {
        const step = this.byId("sourceStep") as WizardStep;
        const input = this.byId("remoteSourceUrl") as Input;
        if(input.getValueState() === ValueState.None) {
            this.wizard.validateStep(step);
        } else {
            this.wizard.invalidateStep(step);
        }
    }

    private onPlaylistImporterMatched(): void {
        const w = this.wizard;
        w.discardProgress(w.getSteps()[0], false);
        (this.getModel("importer") as JSONModel).setData({});
    }
}
