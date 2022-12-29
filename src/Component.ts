import UIComponent from "sap/ui/core/UIComponent";
import Device, {support as DeviceSupport} from "sap/ui/Device"
import JSONModel from "sap/ui/model/json/JSONModel";
import ListSelector from "./util/ListSelector";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R
 */
export default class Component extends UIComponent {

    public static metadata = {
		"manifest": "json"
	}

    private contentDensityClass: string;
    public listSelector: ListSelector

    init(): void {
        this.listSelector = new ListSelector()
        let deviceModel = new JSONModel(Device)
        deviceModel.setDefaultBindingMode("OneWay")
        this.setModel(deviceModel, "device")
        super.init()
        this.getRouter().initialize()

        sap.ui.getCore().getMessageManager().registerObject(this, true)

        // Register Type validation model on global context, because... well,
        // there is no documentation about how to access it from a custom
        // data type, everyone deserves translated validation messages.
        let typeValidationModel = this.getModel("typeValidation");
        sap.ui.getCore().setModel(typeValidationModel, "type_val");
    }

    public getContentDensityClass(): string {
        if (this.contentDensityClass === undefined) {
            if(document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                this.contentDensityClass = ""
            } else if (!DeviceSupport.touch) {
                this.contentDensityClass = "sapUiSizeCompact"
            } else {
                this.contentDensityClass = "sapUiSizeCozy"
            }
        }
        return this.contentDensityClass
    }
}