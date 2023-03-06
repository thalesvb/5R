import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Component from "src/Component";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import {system as DeviceSystem} from "sap/ui/Device";
import ResponsivePopover from "sap/m/ResponsivePopover";
import NotificationManager from "../util/NotificationManager";
import SearchManager from "sap/f/SearchManager";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";
import { Channel, PlayerEvent } from "./../model/EventBusEnum";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class AppController extends BaseController {
    private notificationsPopover: Promise<ResponsivePopover>;
    public onInit(): void {
        let viewModel = new JSONModel({
            busy: false,
            delay: 0,
            layout: "OneColumn",
            navButtonVisible: false,
            previousLayout: "",
            actionButtonsInfo: {
                midColumn: {
                    fullScreen: false
                }
            }
        });
        this.setModel(viewModel, "appView");
        let ownerComponent = this.getOwnerComponent() as Component;
        this.getView().addStyleClass(ownerComponent.getContentDensityClass());
        const router = ownerComponent.getRouter();
        router.attachRoutePatternMatched(this.onRoutePatternMatched, this);
    }

    handleNotificationsPress(event: Event): void {
        if (!this.notificationsPopover) {
            this.notificationsPopover = this.getFragment("NotificationPopover") as Promise<ResponsivePopover>;
        }
        const notificationsButton = event.getParameter("button") as Control;
        this.notificationsPopover.then((popover)=> popover.openBy(notificationsButton));
    }

    handleDismissNotification(event: Event): void {
        const item = event.getParameter("listItem");
        const notifManager = NotificationManager.getInstance();
        if (item) {
            const notif = item.getBinding("title").getContext().getObject();
            notifManager.dismissNotifications(notif);
        } else {
            notifManager.dismissAllNotifications();
        }
    }

    handleSearch(event: Event): void {
        const suggestionItem = event.getParameter("suggestionItem");
        if (suggestionItem) {
            const station = suggestionItem.getBindingContext().getProperty("guid");
            let replace = !DeviceSystem.phone;
            (this.getModel("appView") as JSONModel).setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("stationPlayer", {
                stationGuid: station
            }, undefined, replace);
        } else {
            const evtBus = this.getOwnerComponent().getEventBus();
            evtBus.publish(Channel.Player,PlayerEvent.Search, event);
        }
    }

    handleSearchSuggest(event: Event): void {
        const searchField = event.getSource() as SearchManager;
        const value = event.getParameter("suggestValue");
        const filters = [];

        if (value) {
            filters.push(new Filter("name",FilterOperator.Contains, value));
        }
        (searchField.getBinding("suggestionItems") as ListBinding).filter(filters);
        // TODO: Why library requires to manually call suggest to open suggestion list?
        searchField.suggest();
    }

    /**
     * Listen to router changes that may affect App-wide settings.
     * @param event
     */
    private onRoutePatternMatched(event: Event): void {
        const rName = event.getParameter("name");
        (this.getModel("appView") as JSONModel).setProperty("/navButtonVisible", rName !== "master");
    }
}