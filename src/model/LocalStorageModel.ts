/* https://sdk.openui5.org/test-resources/sap/m/demokit/cart/webapp/model/LocalStorageModel.js */

import JSONModel from "sap/ui/model/json/JSONModel"
import Storage from "sap/ui/util/Storage"
import {Type as StorageType} from "sap/ui/util/Storage"

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.model
 */
 export default class LocalStorageModel extends JSONModel {
    private key = "LOCALSTORAGE_MODEL";
    private storage = new Storage(StorageType.local);

    constructor(storageKey: string, settings: object) {
        super([].slice.call(arguments, 1));
        this.setSizeLimit(1000000);
        if (storageKey) {
            this.key= storageKey;
        }
        this.load();
    }

    private load(): void {
        let storedData: AppStorage;
        let serializedData = this.storage.get(this.key);
        if (serializedData) {
            storedData = JSON.parse(serializedData);
        } else {
            storedData = {
                stations: []
            };
        }
        this.setData(storedData);
    }

    private static findStationIndex(stations: Station[], stationGuid: string) {
        return stations.findIndex(station => station.guid === stationGuid);
    }

    save(): void {
        let data = this.getData();
        let serializedData = JSON.stringify(data);
        this.storage.put(this.key, serializedData);
    }

    moveStation(guid: string, index: number) {
        const storage = this.getData() as AppStorage;
        let idx = LocalStorageModel.findStationIndex(storage.stations, guid);
        const station = storage.stations[idx];
        storage.stations.splice(index, 0, station);

        storage.stations.splice(idx < index ? idx : idx+1, 1);
        this.save();
        this.setData(storage);
        this.refresh(true);
    }

    removeStation(guid: string): void {
        let storage = this.getData() as AppStorage;
        let idx = LocalStorageModel.findStationIndex(storage.stations, guid);
        storage.stations.splice(idx,1);
        this.save();
        this.setData(storage);
        this.refresh(true);
    }

    saveStation(station: Station): void {
        let storage = this.getData() as AppStorage;
        if (station.guid === undefined) {
            station.guid = crypto.randomUUID();
            storage.stations.push(station);
        } else {
            let stationIndex = LocalStorageModel.findStationIndex(storage.stations, station.guid);
            storage.stations[stationIndex] = station;
        }
        this.save();
        this.setData(storage);
        this.refresh(true);
    }
 }
