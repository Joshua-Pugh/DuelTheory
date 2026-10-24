import {expect,it} from 'vitest';
import jsQR from 'jsqr';
import {inviteQrSvg} from './inviteQr';
it('generates a real, decodable QR invite locally with a quiet border and no credentials',async()=>{
 const url='https://joshua-pugh.github.io/DuelTheory/?table=ABCDEFGH',svg=await inviteQrSvg(url);
 const edge=Number(svg.match(/viewBox="0 0 (\d+) /)![1]),scale=6,width=edge*scale,data=new Uint8ClampedArray(width*width*4).fill(255);
 for(const match of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)){const x=Number(match[1]),y=Number(match[2]);expect(x).toBeGreaterThanOrEqual(4);expect(y).toBeGreaterThanOrEqual(4);for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const i=((y*scale+dy)*width+x*scale+dx)*4;data[i]=data[i+1]=data[i+2]=0;}}
 expect(jsQR(data,width,width)?.data).toBe(url);expect(svg).not.toContain('token');expect(svg).not.toContain('script');
});
