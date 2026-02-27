const express = require("express");
const router = express.Router();
const { uploadToIPFS, uploadMetadata, upload } = require("../controllers/ipfsController");

// POST /api/ipfs/upload — Upload file to IPFS
router.post("/upload", upload.single("file"), uploadToIPFS);

// POST /api/ipfs/metadata — Upload JSON metadata to IPFS
router.post("/metadata", uploadMetadata);

module.exports = router;
