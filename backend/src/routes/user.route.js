import { Router } from "express";
// Middleware
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
// Controllers
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,

} from "../controllers/user.controller.js";


const router = Router();

router.route('/register').post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
    ])
    , registerUser
)

router.route('/login').post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(verifyJWT, refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)
router.route("/me").get(verifyJWT, getCurrentUser)
router.route("/update-account").put(verifyJWT, updateAccountDetails)
router.route("/update-avatar").put(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateUserAvatar
)

export default router;