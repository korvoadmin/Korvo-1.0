// magick-wasm is pinned in index.ts; adapter is exercised against the identical WASM locally.
export function makeEvidenceDecoder({ImageMagick,MagickFormat,ResourceLimits}) {
 ResourceLimits.memory=96n*1024n*1024n;ResourceLimits.disk=0n;ResourceLimits.time=3n;
 ResourceLimits.width=12000n;ResourceLimits.height=12000n;ResourceLimits.listLength=2n;
 ResourceLimits.maxProfileSize=1024n*1024n;ResourceLimits.maxMemoryRequest=96n*1024n*1024n;
 return async(bytes,{maximum_pixels,maximum_frames})=>{
  const format=bytes[0]===137?MagickFormat.Png:bytes[0]===255?MagickFormat.Jpeg:MagickFormat.WebP;
  return ImageMagick.readCollection(bytes,format,images=>{
   if(images.length!==1||maximum_frames!==1)throw Error('Animated image rejected');
   const image=images[0];
   if(image.width*image.height>maximum_pixels)throw Error('Excessive image dimensions');
   // Reading the collection decodes pixels; hashing each pixel stream forces cache access.
   image.signature;
   return {fully_decoded:true,mime:format===MagickFormat.Png?'image/png':format===MagickFormat.Jpeg?'image/jpeg':'image/webp',frames:1,width:image.width,height:image.height};
  });
 };
}
