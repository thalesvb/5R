export default interface IPlaylistParser {
    /**
     * Extension(s), in lower case, associated to Playlist format.
     */
    readonly extensions: string | string[];
    /**
     * Content type(s), in lower case, associated to Playlist format.
     */
    readonly contentTypes?: string | string[];
    readonly name: string;
    parse(data: string): Station[];
}