import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Component from "src/Component";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class AppController extends BaseController {
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
}