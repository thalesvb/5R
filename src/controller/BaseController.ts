import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Controller from "sap/ui/core/mvc/Controller";
import View from "sap/ui/core/mvc/View";
import History from "sap/ui/core/routing/History";
import Router from "sap/ui/core/routing/Router";
import UIComponent from "sap/ui/core/UIComponent";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller
 */
export default class BaseController extends Controller {
    private fragments: Map<string, Promise<Control>>;

    protected getRouter(): Router {
        return (this.getOwnerComponent() as UIComponent).getRouter();
    }
    protected getModel(name?: string): Model {
        return this.getView().getModel(name);
    }
    protected setModel(model: Model, name?: string): View {
        return this.getView().setModel(model, name);
    }
    protected getResourceBundle(): ResourceBundle {
        return (this.getOwnerComponent().getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;
    }
    public onNavBack(target: string = "master"): void {
        var previousHash = History.getInstance().getPreviousHash();
        if (previousHash !== undefined) {
            history.go(-1);
        } else {
            this.getRouter().navTo(target, undefined, undefined, true);
        }
    }

    protected getFragment(name: string): Promise<Control> {
        if (this.fragments === undefined) {
            this.fragments = new Map();
        }
        let fragment = this.fragments.get(name);
        if (!fragment) {
            const view = this.getView();
            const controller = view.getController();
            fragment = Fragment.load({
                id: view.getId(),
                name: `thalesvb.5R.view.${name}`,
                controller: controller
            }) as Promise<Control>;
            this.fragments.set(name, fragment);
            fragment.then((frag) => view.addDependent(frag));
        }
        return fragment;
    }
}
