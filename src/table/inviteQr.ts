/** Uses node-qrcode (MIT); see /third-party-notices.txt. No external QR service. */
export async function inviteQrSvg(url:string){
 const {default:QRCode}=await import('qrcode');
 const code=QRCode.create(url,{errorCorrectionLevel:'M'}),size=code.modules.size,edge=size+8;
 const path:string[]=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(code.modules.get(y,x))path.push(`M${x+4} ${y+4}h1v1h-1z`);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${edge} ${edge}" width="288" height="288" shape-rendering="crispEdges"><rect width="${edge}" height="${edge}" fill="#fff"/><path d="${path.join('')}" fill="#000"/></svg>`;
}
