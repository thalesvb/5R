import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Component from "src/Component";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import ResponsivePopover from "sap/m/ResponsivePopover";
import NotificationManager from "../util/NotificationManager";

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
}