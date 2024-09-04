// utils
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// models
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

// services
import {
    getPlaylistInfo,
    getPlaylistVideos,
    getVideoDetails,
} from "../services/youtube.service.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";

// Custom functions
// Extract Id from url
function getPlaylistId(url) {
    const match = url.match(/[&?]list=([^&]+)/);
    return match ? match[1] : null;
}

// Add videos to DB
async function addVideosToDB(playlistId, playlistDBId) {
    const videos = await getPlaylistVideos(playlistId)
    function generateVideoIdString(videos, startIndex, endIndex) {
        let videoIdString = ""
        for (let i = startIndex; i < endIndex; i++) {
            videoIdString += videos[i].contentDetails.videoId + ","
        }
        videoIdString = videoIdString.substring(0, videoIdString.length - 1)
        return videoIdString
    }
    const videoIdListStringArray = []
    let start = 0;
    while ((start + 50) < videos.length) {
        videoIdListStringArray.push(generateVideoIdString(videos, start, start + 50))
        start += 50
    }
    videoIdListStringArray.push(generateVideoIdString(videos, start, videos.length))

    let videoDetailsArray = [];
    const detailsPromises = videoIdListStringArray.map(videoIdString => getVideoDetails(videoIdString));

    const detailsArray = await Promise.all(detailsPromises);

    detailsArray.forEach(details => {
        videoDetailsArray = videoDetailsArray.concat(details);
    });

    const finalVideoDetails = videoDetailsArray.map((video) => {
        video.playlist = playlistDBId
        return video
    })

    const allVideo = await Video.insertMany(finalVideoDetails)
    if (!allVideo) {
        throw new ApiError(500, "Error While creating video documents ")
    }
    return allVideo

}

// Controllers
const createNewPlaylist = asyncHandler(async (req, res, next) => {

    const { name, description } = req.body
    if (!(name || description)) {
        return next(new ApiError("Name and description are required", 400))
    }

    const thumbnailLocalPath = req.files?.thumbnails[0]?.path
    let thumbnailUrl = ""
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        thumbnailUrl = thumbnail.url
    }

    const playlist = await Playlist.create({
        name,
        description,
        thumbnails: { url: thumbnailUrl },
        owner: new mongoose.Types.ObjectId(req.user._id)
    })



    return res.status(201)
        .json(new ApiResponse(201, { playlist }, "Playlist created successfully"))


})

const createYoutubePlaylist = asyncHandler(async (req, res, next) => {
    const url = req.body?.url
    if (!url) {
        return next(new ApiError(400, "URL is required"))
    }
    const playlistId = getPlaylistId(url)
    if (!playlistId) {
        return next(new ApiError(400, "Invalid URL"))
    }
    const { title, description, thumbnails } = await getPlaylistInfo(playlistId)
    if (!title || !description || !thumbnails) {
        return next(new ApiError(400, "Error fetching playlist info"))
    }
    const playlist = await Playlist.create({
        name: title,
        description,
        owner: new mongoose.Types.ObjectId(req.user._id),
        thumbnails
    })

    if (!playlist._id) {
        throw new ApiError(500, "Error creating playlist")
    }
    const videosOfPlayList = await addVideosToDB(playlistId, playlist._id)

    return res.status(201)
        .json(new ApiResponse(201, { playlist }, "Playlist created successfully"))
})



export {
    createNewPlaylist,
    createYoutubePlaylist,

}