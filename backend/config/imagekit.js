const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: "public_bKGM/5VyGTB5esXkOSuYK2zThjw=",
  privateKey: "private_2d1DPyqyR10zhX9nxoaLcCUaArQ=",
  urlEndpoint: "https://ik.imagekit.io/nectarInfotel25"
});

// Test the connection (optional)
imagekit.listFiles({}, (error, result) => {
  if (error) {
    console.log("❌ ImageKit error:", error);
  } else {
    console.log("✅ ImageKit connected. Files:", result);
  }
});

// Export imagekit at the top level
module.exports = imagekit;
