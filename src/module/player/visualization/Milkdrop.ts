import Object from "sap/ui/base/Object";

import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R.module.player.visualization
 */
export default class Milkdrop extends Object {
    private static instance: any;
    static create(context: AudioContext, source: MediaElementAudioSourceNode, canvas: HTMLCanvasElement): (timestamp: number) => void {
        if (!this.instance) {
            Milkdrop.instance = butterchurn.createVisualizer(
                context,
                canvas,
                {
                    width: 300,
                    height: 150,
                    meshWidth: 24,
                    meshHeight: 18,
                    pixelRatio: window.devicePixelRatio || 1,
                }
            );
            Milkdrop.instance.connectAudio(source);

            const presets = butterchurnPresets.getPresets();
            const preset = presets['martin - disco mix 4'];
            Milkdrop.instance.loadPreset(preset, 0.0);
        }

        return (opts) => {
          Milkdrop.instance.render(opts);
        }
    }
}