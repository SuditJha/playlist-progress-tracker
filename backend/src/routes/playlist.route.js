import { Router } from "express";
// Middleware
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

// Controllers
import {
    createNewPlaylist,
    createYoutubePlaylist,
} from "../controllers/playlist.controller.js";


const router = Router();

router.route("/create/new").post(
    verifyJWT,
    upload.fields([
        { name: "thumbnails", maxCount: 1 }
    ]),
    createNewPlaylist
)
router.route("/create/youtube").post(verifyJWT, createYoutubePlaylist)


export default router;