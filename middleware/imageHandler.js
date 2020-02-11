const {
  Aborter,
  BlobURL,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  StorageURL,
  SharedKeyCredential,
  uploadStreamToBlockBlob
} = require("@azure/storage-blob");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const path = require("path");
const getStream = require("into-stream"); // change buffer to stream
const containerName = "res";
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
// const aborter = Aborter.timeout(30 * 1000);
const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const ACCOUNT_ACCESS_KEY = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const credentials = new SharedKeyCredential(
  STORAGE_ACCOUNT_NAME,
  ACCOUNT_ACCESS_KEY
);
const pipeline = StorageURL.newPipeline(credentials);
// const pipeline = newPipeline(credentials);
const serviceURL = new ServiceURL(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  pipeline
);

exports.imageUpload = async function(file) {

  // 원본 파일명 : file.originalname
  let extentios = path.extname(file.originalname);
  let originName = file.originalname.split(".");
  let filename = `${originName[0]}_${Date.now()}${extentios}`;

  const blobName = filename;
  const stream = getStream(file.buffer);
  const containerURL = ContainerURL.fromServiceURL(
    serviceURL,
    containerName
  );
  const blobURL = BlobURL.fromContainerURL(containerURL, blobName);
  const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);

  await uploadStreamToBlockBlob(
    Aborter.none,
    stream,
    blockBlobURL,
    uploadOptions.bufferSize,
    uploadOptions.maxBuffers
  );

  let imageSrc = `https://jumsimiowner.pickapick.io/${containerName}/${filename}`;

  return { src : imageSrc, URL: blobURL, name: blobName }
}

exports.deleteImages = function ( blockBlobURL, blobName, where) {

  try {

    blockBlobURL.delete(Aborter.none);
    console.error(`Block blob "${blobName}" is deleted at ${where}`);

  } catch (err) {

    throw new Error(err)

  }
};