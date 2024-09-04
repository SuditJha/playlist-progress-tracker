import { google } from 'googleapis';


const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_DATA_API_KEY
})


const getPlaylistInfo = async (playlistID) => {
    try {
        const response = await youtube.playlists.list({
            part: "snippet, contentDetails",
            id: playlistID
        })
        const { title, description, thumbnails } = response.data.items[0].snippet
        return { title, description, thumbnails }
    } catch (error) {
        console.error("Error fetching playlist info", error)
    }
}

const getPlaylistVideos = async (playlistID) => {
    try {
        const videos = []
        let nextPageToken = null
        do {
            const response = await youtube.playlistItems.list({
                part: "contentDetails",
                playlistId: playlistID,
                maxResults: 50,
                pageToken: nextPageToken
            })
            nextPageToken = response.data.nextPageToken
            videos.push(...response.data.items)
        } while (nextPageToken)
        return videos
    } catch (error) {
        console.error("Error fetching playlist videos", error)
    }
}

const getVideoDetails = async (videoId) => {
    try {
        // let nextPageToken = null
        const response = await youtube.videos.list(
            {
                part: "snippet, contentDetails, statistics",
                id: videoId,
            }
        )

        const videoData = []
        response.data.items.forEach(item => {
            videoData.push({
                videoId: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails,
                duration: item.contentDetails.duration
            })
        });
        // console.log(videoData);
        return videoData
    } catch (error) {
        console.log("Video detail retrieve error \n", error);
        return ({ error: "Something went wrong while retrieving video details" })
    }
}

export {
    getPlaylistInfo,
    getPlaylistVideos,
    getVideoDetails,
}