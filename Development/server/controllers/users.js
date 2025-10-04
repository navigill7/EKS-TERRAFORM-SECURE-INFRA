import User from "../models/User.js"

// READ 

export const getUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return all user data including social URLs
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
        
        // Include social URLs in friends list
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
            user.friends = user.friends.filter((id) => id !== friendId);
            friend.friends = friend.friends.filter((id) => id !== id);
        } else {
            user.friends.push(friendId);
            friend.friends.push(id);
        }

        await user.save();
        await friend.save();

        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );
        
        // Include social URLs in friends list
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
        
        console.log(`Updating social URLs for user ${id}:`, { twitterUrl, linkedInUrl });
        
        const user = await User.findByIdAndUpdate(
            id,
            { 
                twitterUrl: twitterUrl || "",
                linkedInUrl: linkedInUrl || ""
            },
            { new: true } // Return updated user
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log("User updated successfully:", user);
        res.status(200).json(user);
    } catch (err) {
        console.error("Error updating social URLs:", err);
        res.status(500).json({ message: err.message });
    }
};

// SEARCH

export const SearchUser = async (req, res) => {
    try {
        console.log('Search request received:', req.body);
        
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

        // Include social URLs in search results
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
        console.error('Error in searchUsers:', err);
        res.status(500).json({ message: "Internal server error" });
    }
};