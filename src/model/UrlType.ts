import SimpleType from "sap/ui/model/SimpleType"
import ValidateException from "sap/ui/model/ValidateException";

/**
 * @namespace thalesvb.5R.model
 */
export default class UrlType extends SimpleType {
    formatValue(vValue: any, sTargetType: string) {
        return vValue;
    }

    parseValue(vValue: any, sSourceType: string) {
        return vValue;
    }

    validateValue(vValue: any) {
        if (typeof(vValue) !== "string") {
            throw new ValidateException("FIXME URL Validation");
        }
        let sValue = vValue as String
        if (!sValue.startsWith("http://") && !sValue.startsWith("https://")) {
            throw new ValidateException("FIXME URL Validation");
        }

    }
}