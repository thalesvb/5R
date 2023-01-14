import Object from "sap/ui/base/Object";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.pwa
 */
export default class PWA extends Object {
    public static readonly scope = "/5R/";
    static register(): void {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js", {scope: PWA.scope})
                .then((registration)=>console.log('Service Worker Registered with scope:',  registration.scope));
        }
    }
    static bindConnectivityEvents(onlineHandler: any, offlineHandler: any): void {
        window.addEventListener("online", onlineHandler);
        window.addEventListener("offline", offlineHandler);
    }
}
