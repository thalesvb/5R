import Object from "sap/ui/base/Object";
import Milkdrop from "./visualization/Milkdrop";

enum VisualizationState {
    Stopped,
    Paused,
    Running,
}
/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player
 */
export default class Visualization extends Object {
    private static context: AudioContext;
    private static mediaSource: MediaElementAudioSourceNode;
    private static visRenderCallback: Function;
    private static state: VisualizationState;
    private static canvas: HTMLCanvasElement;
    static linkAudioElement(audio: HTMLAudioElement): void {
        if (Visualization.context) {
            return;
        }
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(audio);
        source.connect(ctx.destination);
        Visualization.context = ctx;
        Visualization.mediaSource = source;
    }

    static display(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        //FIXME: Altough this works as expected in a CSS class, the build process fails to
        //       move CSS file to correct Cachebuster folder.
        canvas.style.width = canvas.style.height = "100%";
        //FIXME: Tried to set parent div to 100% by CSS rules, the calculated
        //       size is different from inline style (the one that have desired size).
        canvas.parentElement.style.width = "100%";
        this.visRenderCallback = Milkdrop.create(Visualization.context, Visualization.mediaSource, canvas);
    }

    static start(): void {
        this.state = VisualizationState.Running;
        window.requestAnimationFrame(Visualization.renderCallback);
    }
    static stop(): void {
        this.state = VisualizationState.Stopped;
    }

    /**
     * The render callback ().
     * Here we can't shortcut using `this` keyword because that refers to window.
     * @param timestamp
     */
    private static async renderCallback(timestamp: DOMHighResTimeStamp): Promise<void> {
        Visualization.visRenderCallback(timestamp);
        if (Visualization.state === VisualizationState.Running) {
            window.requestAnimationFrame(Visualization.renderCallback);
        }
    }
}