const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const PINATA_API = "https://api.pinata.cloud";
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        cb(null, allowed.includes(file.mimetype));
    },
});

/**
 * Upload file to IPFS via Pinata
 */
async function uploadToIPFS(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const formData = new FormData();
        formData.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const metadata = JSON.stringify({
            name: `decentrafund-${Date.now()}`,
            keyvalues: {
                platform: "DecentraFund",
                type: req.body.type || "campaign-image",
            },
        });
        formData.append("pinataMetadata", metadata);

        const response = await axios.post(
            `${PINATA_API}/pinning/pinFileToIPFS`,
            formData,
            {
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
                    pinata_api_key: process.env.PINATA_API_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
                },
                maxContentLength: Infinity,
            }
        );

        const { IpfsHash } = response.data;

        res.json({
            hash: IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
            gatewayUrl: `https://ipfs.io/ipfs/${IpfsHash}`,
        });
    } catch (error) {
        console.error("uploadToIPFS error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to upload to IPFS" });
    }
}

/**
 * Upload JSON metadata to IPFS
 */
async function uploadMetadata(req, res) {
    try {
        const { metadata } = req.body;

        if (!metadata) {
            return res.status(400).json({ error: "Metadata required" });
        }

        const response = await axios.post(
            `${PINATA_API}/pinning/pinJSONToIPFS`,
            {
                pinataContent: metadata,
                pinataMetadata: {
                    name: `decentrafund-metadata-${Date.now()}`,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    pinata_api_key: process.env.PINATA_API_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
                },
            }
        );

        const { IpfsHash } = response.data;

        res.json({
            hash: IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
        });
    } catch (error) {
        console.error("uploadMetadata error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to upload metadata" });
    }
}

module.exports = { uploadToIPFS, uploadMetadata, upload };
