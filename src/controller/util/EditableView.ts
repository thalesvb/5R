import Object from "sap/ui/base/Object";

enum DisplayMode {
    Display,
    Edit
}

/**
 *
 * Due nature of current TypeScript Transpiler/Builder, `extends Object`
 * was required to it correctly transpile into JS counterpart.
 * Also, due that `extends`, `formatter` structure was only binding
 * correctly to static methods once its declaration was put after
 * methods declaration.
 * 
 * @copyright ${copyright}
 * @namespace thalesvb.5R.controller.util
 */
export default class EditableView extends Object {
    public static readonly mode = DisplayMode;
    static isDisplay(mode: DisplayMode): boolean {
        return mode === DisplayMode.Display;
    }

    static isEdit(mode: DisplayMode): boolean {
        return mode === DisplayMode.Edit;
    }

    public static readonly formatter = {
        display: EditableView.isDisplay,
        edit: EditableView.isEdit
    };

}
