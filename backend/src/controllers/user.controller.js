import fs, { access } from "fs"
import jwt from "jsonwebtoken"
// Models
import { User } from "../models/user.model.js"
// Utils
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// Services
import { uploadOnCloudinary } from "../services/cloudinary.service.js";



const cookieOptions = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error generating access/refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res, next) => {

    const { fullname, email, username, password } = req.body

    if ([fullname, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({ $or: [{ email }, { username }] })

    const avatarLocalPath = req.files?.avatar[0]?.path
    if (existedUser) {
        if (avatarLocalPath) fs.unlinkSync(avatarLocalPath)
        throw new ApiError(400, "User already exists")
    }

    let avatar = ""
    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath)
    }

    const user = await User.create({
        fullname,
        email,
        username,
        password,
        avatar: avatar?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error creating user")
    }

    res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully"))
})

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password, username } = req.body
    // console.log(req.body)
    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required")
    }
    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if (!user) {
        throw new ApiError(400, "user does not Exists")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(new ApiResponse(
            200,
            { loggedInUser, accessToken, refreshToken },
            "User Logged In Successfully"
        )
        )

})

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: "" }
        },
        { new: true }
    )
    return res.status(200)
        .clearCookie("refreshToken", cookieOptions)
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully"))

})


const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized")
    }
    try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        console.log(decodedToken)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid RefreshToken")
        }

        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Expired RefreshToken")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access Token Refreshed Successfully"
            )
            )
    } catch (error) {
        throw new ApiError(401, "Invalid Token")
    }
})

const changeCurrentUserPassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Current Password")
    }
    user.password = newPassword
    await user.save()
    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User Fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res, next) => {
    const { fullname, email, username } = req.body
    if (!email || !username || !fullname) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email,
                username
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(500, "Error updating user")
    }

    return res.status(200).json(new ApiResponse(200, user, "User Account Details Updated Successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.files?.avatar[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, user, "User Avatar Updated Successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
}