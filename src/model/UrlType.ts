import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import SimpleType from "sap/ui/model/SimpleType"
import ValidateException from "sap/ui/model/ValidateException";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.model
 */
export default class UrlType extends SimpleType {
    private static readonly msgValidationError = "urlType_validationError";
    formatValue(vValue: any, sTargetType: string) {
        return vValue;
    }

    parseValue(vValue: any, sSourceType: string) {
        return vValue;
    }

    validateValue(vValue: any) {
        if (typeof(vValue) !== "string") {
            throw new ValidateException(this.message(UrlType.msgValidationError));
        }
        let sValue = vValue as String
        if (!sValue.startsWith("http://") && !sValue.startsWith("https://")) {
            throw new ValidateException(this.message(UrlType.msgValidationError));
        }

    }

    private message(messageKey: string, ...args: any[]): string {
        let model = sap.ui.getCore().getModel("type_val") as ResourceModel;
        let bundle = model.getResourceBundle() as ResourceBundle;
        return bundle.getText(messageKey, args);
    }
}