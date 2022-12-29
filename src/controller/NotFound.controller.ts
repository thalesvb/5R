import Target from "sap/ui/core/routing/Target";
import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";

/**
 * @namespace thalesvb.5R.controller
 */
export default class NotFoundController extends BaseController {
    onInit(): void {
        (this.getRouter().getTarget("notFound") as Target).attachDisplay(this.onNotFoundDisplayed, this);
    }

    private onNotFoundDisplayed(): void {
        (this.getModel("appView") as JSONModel).setProperty("/layout", "OneColumn");
    }
}