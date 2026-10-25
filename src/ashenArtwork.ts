import artwork from './ashenArtwork.json';
import type {FrameLook} from './framePersonalization';
type CardArtwork={name:string;image:string;source:string;crop:Partial<FrameLook>;alternates?:{image:string;source:string}[]};
export const ashenArtwork=artwork as Record<string,CardArtwork>;
export const defaultAshenArtwork=(id:string)=>ashenArtwork[id];
