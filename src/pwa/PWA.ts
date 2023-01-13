import Object from "sap/ui/base/Object";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.pwa
 */
export default class PWA extends Object {
    static bindConnectivityEvents(onlineHandler: any, offlineHandler: any): void {
        window.addEventListener("online", onlineHandler);
        window.addEventListener("offline", offlineHandler);
    }
}
