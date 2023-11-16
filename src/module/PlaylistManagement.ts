import Object from "sap/ui/base/Object";
import { JspfParser, XspfParser } from "./playlist/XspfParser";

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player
 */
export default class PlaylistManagement extends Object {
    async importFromLocalSource(data: File): Promise<Station[]> {
        const textData = await data.text();
        switch(data.type) {
            case "": return this.parseByExtension(textData, this.getExtension(data.name))
        }
        const text = await data.text();
        return;
    }
    async importFromExternalSource(url: string): Promise<Station[]> {
        const response = await fetch(url);
        const contentType = response.headers.get("content-type");
        const data = await response.text();
        switch(contentType) {
            case "audio/x-mpegurl": return this.parseM3U(data);
            case "application/octet-stream": return this.parseByExtension(data, this.getExtension(url));
        }
    }

    private parseByExtension(data: string, extension: string): Station[] {
        if (!extension) {
            return;
        }
        switch(extension.toLowerCase()) {
            case "jspf": return this.parseJspf(data);
            case "xspf": return this.parseXspf(data);
        }
    }

    private parseM3U(data: string): Station[] {
        return;
    }

    private parseJspf(data: string): Station[] {
        return new JspfParser().parse(data);
    }

    private parseXspf(data: string): Station[] {
        return new XspfParser().parse(data);
    }

    private getExtension(url: string) {
        return url.split(/[#?]/)[0].split('.').pop().trim();
    }
}
