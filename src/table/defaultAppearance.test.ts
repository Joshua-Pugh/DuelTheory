// @vitest-environment happy-dom
import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({send:vi.fn(),upload:vi.fn()}));
vi.mock('./client',async original=>({...await original<typeof import('./client')>(),roomRequest:mocks.send}));
vi.mock('./backgrounds',async original=>({...await original<typeof import('./backgrounds')>(),setRoomBackground:mocks.upload}));
import {applySavedAppearanceToRoom} from './defaultAppearance';
import {saveAutoAppearance,saveAppearance} from './appearance';
import {rememberBackground} from './backgrounds';
import {newTableRoom} from './model';
const seat={api:'https://example.com',code:'ABCDEFGH',playerId:'a',token:'fixture-token'};
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();mocks.send.mockResolvedValue({state:newTableRoom(seat.code,'Test',2,'a')});mocks.upload.mockResolvedValue({state:{...newTableRoom(seat.code,'Test',2,'a'),revision:2}});});
it('does not send a saved image or colors without explicit automatic-appearance opt-in',async()=>{saveAppearance({theme:'ocean',accent:'#abcdef'});rememberBackground('data:image/jpeg;base64,'+btoa('\xff\xd8\xff000000000'));await applySavedAppearanceToRoom(seat,vi.fn(),()=>true);expect(mocks.send).not.toHaveBeenCalled();expect(mocks.upload).not.toHaveBeenCalled();});
it('applies bounded saved colors and an image only to the authenticated new seat',async()=>{saveAutoAppearance(true);saveAppearance({theme:'ocean',accent:'#abcdef'});rememberBackground('data:image/jpeg;base64,'+btoa('\xff\xd8\xff000000000'));const accept=vi.fn();await applySavedAppearanceToRoom(seat,accept,()=>true);expect(mocks.send).toHaveBeenCalledWith(seat.api,seat.code,seat.token,'action',{type:'appearance',theme:'ocean',accent:'#abcdef'});expect(mocks.upload).toHaveBeenCalledWith(seat,expect.any(Blob));expect(accept).toHaveBeenCalledTimes(2);});
it('stops before uploading if the active seat changes during the color request',async()=>{saveAutoAppearance(true);const current=vi.fn().mockReturnValueOnce(true).mockReturnValue(false);await applySavedAppearanceToRoom(seat,vi.fn(),current);expect(mocks.send).toHaveBeenCalledOnce();expect(mocks.upload).not.toHaveBeenCalled();});
