import { ListMode, ListType } from "sap/m/library";
import List from "sap/m/List";
import ObjectListItem from "sap/m/ObjectListItem";
import Event from "sap/ui/base/Event";
import {system as DeviceSystem} from "sap/ui/Device";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import Component from "src/Component";
import LocalStorageModel from "src/model/LocalStorageModel";
import BaseController from "./BaseController";
import EditableView from "./util/EditableView";

type FilterState = {
    search: Filter[]
}
enum ViewMode {
    Display,
    Edit
}

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class MasterController extends BaseController {
    private masterModel: JSONModel;
    private list: List;
    private filterState: FilterState;

    public readonly editableFormatter = EditableView.formatter;
    onInit(): void {
        this.list = this.byId("list") as List;
        this.getView().addEventDelegate({
            onBeforeFirstShow: () => {
                (this.getOwnerComponent() as Component).listSelector.setBoundMasterList(this.list);
            }
        });
        let router = this.getRouter();
        router.getRoute("master").attachPatternMatched(this.onMasterMatched, this);
        router.getRoute("masterEdit").attachPatternMatched(this.onMasterEditMatched, this);
        router.attachBypassed(this.onBypassed, this);

        this.masterModel = new JSONModel({
            "mode": EditableView.mode.Display,
            "listItemType": ListType.Active,
            "listMode": ListMode.SingleSelectMaster,
        });
        this.setModel(this.masterModel, "masterView");

        this.filterState = {
            search: []
        };
    }

    onMasterMatched(): void {
        (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
        (this.getModel("appView")as JSONModel).setProperty("/layout", "OneColumn");
        this.masterModel.setProperty("/mode", EditableView.mode.Display);
        this.masterModel.setProperty("/listItemType", ListType.Active);
        this.masterModel.setProperty("/listMode", ListMode.SingleSelectMaster);
    }
    onMasterEditMatched(): void {
        (this.getModel("appView")as JSONModel).setProperty("/layout", "OneColumn");
        this.masterModel.setProperty("/mode", EditableView.mode.Edit);
        this.masterModel.setProperty("/listItemType", ListType.Detail);
        this.masterModel.setProperty("/listMode", ListMode.Delete);
        (this.getOwnerComponent() as Component).listSelector.clearMasterListSelection();
    }

    onAddStation(): void {
        let replace = !DeviceSystem.phone;
        (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("stationCreate", undefined, undefined, replace);
    }
    
    onBypassed(): void {
        this.list.removeSelections(true);
    }

    onEditStationList(): void {
        this.getRouter().navTo("masterEdit", undefined, undefined, true);
    }

    onDelete(event: Event) {
        let item = event.getParameter("listItem")
        let stationGuid = item.getBindingContext().getProperty("guid") as string;
        let model = this.getModel() as LocalStorageModel;
        model.removeStation(stationGuid);
    }

    onDoneEditStationList(): void {
        this.getRouter().navTo("master", undefined, undefined, true);
    }

    onSearch(event: Event) {
        let query = event.getParameter("newValue");
        if (!query) {
            query = event.getParameter("query");
        }
        if (query) {
            this.filterState.search = [new Filter("name", FilterOperator.Contains, query)];
        } else {
            this.filterState.search = [];
        }
        this.applyFilterSearch();

    }
    onSelectionChange(event: Event) {
        let list = event.getSource() as List;
        let selected = event.getParameter("selected");
        const listItem = event.getParameter("listItem") || event.getSource();
        if (!(list.getMode() === "MultiSelect" && !selected)) {
            this.showDetail(listItem);
        }
    }

    onStationEdit(event: Event) {
        const stationItem = event.getSource() as ObjectListItem;
        this.getRouter().navTo("stationEdit", {
            stationGuid: stationItem.getBindingContext().getProperty("guid")
        });
    }

    private applyFilterSearch(): void {
        (this.list.getBinding("items") as ListBinding).filter(this.filterState.search, FilterType.Application)
    }

    private showDetail(item: any): void {
        let replace = !DeviceSystem.phone;
        (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("stationPlayer", {
            stationGuid: (item as ObjectListItem).getBindingContext().getProperty("guid")
        }, undefined, replace);
    }
}