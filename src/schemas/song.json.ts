/* eslint-disable @typescript-eslint/no-namespace */

export type Song = ComAcmeMyapp.Song;

export namespace ComAcmeMyapp {
    export const SongName = "com.acme.myapp.Song";
    export interface Song {
        name: string;
        artist: string;
    }
}
