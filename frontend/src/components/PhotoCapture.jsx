const dataURLtoBlob = (dataUrl) => {
  const [metadata, base64Data] = dataUrl.split(",");
  const mime = metadata.match(/:(.*?);/)[1];
  const binaryString = atob(base64Data);
  const length = binaryString.length;
  const u8arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    u8arr[i] = binaryString.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
};
