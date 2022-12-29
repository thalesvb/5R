import Page from "sap/m/Page";
import Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import Component from "src/Component";
import LocalStorageModel from "src/model/LocalStorageModel";
import BaseController from "./BaseController";
import EditableView from "./util/EditableView";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class StationDetailController extends BaseController {
    private detailModel: JSONModel;
    private page: Page;

    public readonly editableFormatter = EditableView.formatter;
    
    onInit(): void {
        this.detailModel = new JSONModel({
            "mode": EditableView.mode.Display
        });
        this.setModel(this.detailModel, "detailView");
        this.page = this.byId("stationDetailPage") as Page;
        let router = this.getRouter();
        router.getRoute("stationCreate").attachPatternMatched(this.onCreateMatched, this);
        router.getRoute("stationEdit").attachPatternMatched(this.onEditMatched, this);

        this.showFormFragment("StationChange");
    }

    onCreateMatched(event: Event): void {
        this.detailModel.setProperty("/mode", EditableView.mode.Edit);
        let temporaryModel = new JSONModel({} as Station);
        this.page.setModel(temporaryModel);
        this.page.bindElement(`/`)
        this.showFormFragment("StationChange");

        if (this.getModel("appView").getProperty("/layout") !== "MidColumnFullScreen") {
            (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        }
    }

    onEditMatched(event: Event): void {
        let args = event.getParameter("arguments");
        let stationGuid = args.stationGuid;
        this.detailModel.setProperty("/mode", EditableView.mode.Edit);
        this.showFormFragment("StationChange");

        let storedStations = ((this.getModel() as JSONModel).getData() as AppStorage).stations;
        let stationIndex = storedStations.findIndex(station => station.guid === stationGuid);
        if (stationIndex < 0) {
            this.getRouter().getTargets().display("stationNotFound");
            return;
        }

        let temporaryModel = new JSONModel({} as Station);
        temporaryModel.setData(storedStations[stationIndex]);
        this.page.setModel(temporaryModel);
        this.page.bindElement(`/`)
        this.showFormFragment("StationChange");

        if (this.getModel("appView").getProperty("/layout") !== "MidColumnFullScreen") {
            (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        }
    }

    onClose(): void {
        // (this.getModel("appView") as JSONModel).setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
        // (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
        // this.getRouter().navTo("master");
        this.onNavBack();
    }

    onSave(): void {
        let stationData = (this.page.getModel() as JSONModel).getData() as Station;
        let storageModel = this.getModel() as LocalStorageModel;
        storageModel.saveStation(stationData);

        (this.getModel("appView") as JSONModel).setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
        (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
        this.getRouter().navTo("master");
    }

    private showFormFragment(operation: string): void {
        this.page.removeAllContent();
        this.getFragment(operation).then((fragmentContent)=>this.page.addContent(fragmentContent));
    }
}