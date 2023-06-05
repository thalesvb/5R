import { MediaPlayerEvents } from "../MediaPlayerEvents";

export interface IMediaPlayer {
    changeVolume(volume: number): void;
    isMuted(): boolean;
    stop(): void;
    toggleMute(): void;
    togglePlay(station: Station): void;
    bindUI(dispatcher: MediaPlayerEvents): void;
    unbindUI(dispatcher: MediaPlayerEvents): void;
}