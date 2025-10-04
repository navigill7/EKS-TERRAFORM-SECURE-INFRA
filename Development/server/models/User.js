import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        
        firstName: {
            type: String,
            min: 2,
            max: 50,
        },
        lastName: {
            type: String,
            min: 2,
            max: 50,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            max: 50,
        },
        password: {
            type: String,
            min: 5,
        },
        
        // OAuth Fields
        discordId: {
            type: String,
            unique: true,
            sparse: true, 
        },
        provider: {
            type: String,
            enum: ['local', 'discord'],
            default: 'local',
        },
        
        // Common Fields
        picturePath: {
            type: String,
            default: "",
        },
        friends: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
            default: "",
        },
        Year: {
            type: String,
            default: "",
        },
        viewedProfile: {
            type: Number,
            default: 0,
        },
        impressions: {
            type: Number,
            default: 0,
        },
        twitterUrl: {
            type: String,
            default: "",
        },
        linkedInUrl: {
            type: String,
            default: "",
        },
        
        // Discord specific fields
        discordUsername: {
            type: String,
            default: "",
        },
        discordDiscriminator: {
            type: String,
            default: "",
        },
        discordAvatar: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;