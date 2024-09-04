import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoId: {
            type: String, // youtube video ID
            required: [true, "VideoID is required"],
        },
        thumbnails: {},
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: String, // cloudinary info

        },
        playlist: {
            type: Schema.Types.ObjectId,
            ref: "Playlist"
        },

    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema) 