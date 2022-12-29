import Log from "sap/base/Log"
import List from "sap/m/List"
import Object from "sap/ui/base/Object"

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.util
 */
export default class ListSelector extends Object {
    private whenListHasBeenSet: Promise<any>;
    private whenListLoadingIsDone: Promise<any>;
    private resolveListHasBeenSet: Function;
    private list: List;
    constructor() {
        super();
        this.whenListHasBeenSet = new Promise((resolveListHasBeenSet) => {this.resolveListHasBeenSet = resolveListHasBeenSet});
        this.whenListLoadingIsDone = new Promise((resolve, reject) => {
            this.whenListHasBeenSet.then((list: List) => {
                list.getBinding("items").attachEventOnce("dataReceived",() => {
                    if (this.list.getItems().length) {
                        resolve({list: list});
                    } else {
                        reject({list: list});
                    }
                })
            })
        })
    }

    setBoundMasterList(list: List): void {
        this.list = list;
        this.resolveListHasBeenSet(list);
    }

    selectListItem(bindingPath: string) {
        this.whenListLoadingIsDone.then(() => {
            let list = this.list;
            if (list.getMode() === "None") {
                return;
            }
            let selectedItem = list.getSelectedItem();
            if (selectedItem && selectedItem.getBindingContext().getPath() === bindingPath) {
                return;
            }
            list.getItems().some((item) => {
                if (item.getBindingContext() && item.getBindingContext().getPath() === bindingPath) {
                    list.setSelectedItem(item);
                    return true;
                }
            })
        }, () => {
            Log.warning(`Could not select the list item with the path ${bindingPath} because the list encountered an error or had no items`);
        })
    }

    clearMasterListSelection(): void {
        this.whenListHasBeenSet.then(()=>this.list.removeSelections(true));
    }
}