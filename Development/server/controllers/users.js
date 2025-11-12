// server/controllers/users.js (UPDATED - Add profile view tracking)
import User from "../models/User.js";
import { publishNotificationEvent, NOTIFICATION_CHANNELS } from "../config/redis.js";

// READ 
export const getUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // 🆕 Track profile view (if not viewing own profile)
        const viewerId = req.user?.id;
        if (viewerId && viewerId !== id) {
          const viewer = await User.findById(viewerId);
          
          if (viewer) {
            await publishNotificationEvent(NOTIFICATION_CHANNELS.PROFILE_VIEW, {
              userId: id,           // Profile owner
              actorId: viewerId,    // Viewer
              actorName: `${viewer.firstName} ${viewer.lastName}`,
              actorPicture: viewer.picturePath,
            });
          }
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getUserFriends = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );
        
        const formattedFriends = friends.map(
            ({_id, firstName, lastName, occupation, location, picturePath, twitterUrl, linkedInUrl}) => {
                return {
                    _id, 
                    firstName, 
                    lastName, 
                    occupation, 
                    location, 
                    picturePath,
                    twitterUrl: twitterUrl || "",
                    linkedInUrl: linkedInUrl || ""
                };
            }
        );
        res.status(200).json(formattedFriends);
    } catch (error) {
        res.status(404).json({message: error.message})
    }
}

// UPDATE 
export const addRemoveFriends = async (req, res) => {
    try {
        const { id, friendId } = req.params;
        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        if (user.friends.includes(friendId)) {
            // Remove friend
            user.friends = user.friends.filter((id) => id !== friendId);
            friend.friends = friend.friends.filter((id) => id !== id);
        } else {
            // Add friend
            user.friends.push(friendId);
            friend.friends.push(id);
            
            // 🆕 Send friend request notification
            await publishNotificationEvent(NOTIFICATION_CHANNELS.FRIEND_REQUEST, {
              userId: friendId,     // Recipient
              actorId: id,          // Sender
              actorName: `${user.firstName} ${user.lastName}`,
              actorPicture: user.picturePath,
            });
        }

        await user.save();
        await friend.save();

        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );
        
        const formattedFriends = friends.map(
            ({_id, firstName, lastName, occupation, location, picturePath, twitterUrl, linkedInUrl}) => {
                return {
                    _id, 
                    firstName, 
                    lastName, 
                    occupation, 
                    location, 
                    picturePath,
                    twitterUrl: twitterUrl || "",
                    linkedInUrl: linkedInUrl || ""
                };
            }
        );

        res.status(200).json(formattedFriends);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/* UPDATE SOCIAL MEDIA URLS */
export const updateSocialUrls = async (req, res) => {
    try {
        const { id } = req.params;
        const { twitterUrl, linkedInUrl } = req.body;
        
        const user = await User.findByIdAndUpdate(
            id,
            { 
                twitterUrl: twitterUrl || "",
                linkedInUrl: linkedInUrl || ""
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// SEARCH
export const SearchUser = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ message: "Invalid or missing search query" });
        }

        const users = await User.find({
            $or: [
                { firstName: { $regex: query, $options: "i" } },
                { lastName: { $regex: query, $options: "i" } },
            ],
        });

        const formattedUsers = users.map(({ 
            _id, 
            firstName, 
            lastName, 
            Year, 
            location, 
            picturePath,
            twitterUrl,
            linkedInUrl 
        }) => {
            return { 
                _id, 
                firstName, 
                lastName, 
                Year, 
                location, 
                picturePath,
                twitterUrl: twitterUrl || "",
                linkedInUrl: linkedInUrl || ""
            };
        });

        res.status(200).json(formattedUsers);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};