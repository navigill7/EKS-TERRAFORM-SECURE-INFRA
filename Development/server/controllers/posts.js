import Post from "../models/Post.js";
import User from "../models/User.js";
import { publishNotificationEvent, NOTIFICATION_CHANNELS } from "../config/redis.js";


export const createPost = async (req, res) => {
  try {
    const { userId, description, picturePath } = req.body;
    
    const user = await User.findById(userId);
    
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath: picturePath || "",
      likes: {},
      comments: [],
    });
    
    await newPost.save();

    // 🆕 Notify all friends about the new post
    if (user.friends && user.friends.length > 0) {
      for (const friendId of user.friends) {
        await publishNotificationEvent(NOTIFICATION_CHANNELS.FRIEND_POST, {
          userId: friendId,
          actorId: userId,
          actorName: `${user.firstName} ${user.lastName}`,
          actorPicture: user.picturePath,
          relatedId: newPost._id,
          metadata: {
            postDescription: description?.substring(0, 100),
          },
        });
      }
    }

    const posts = await Post.find();
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId });
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
      
      // 🆕 Send notification to post owner (only if someone else liked it)
      if (post.userId !== userId) {
        const liker = await User.findById(userId);
        
        await publishNotificationEvent(NOTIFICATION_CHANNELS.LIKE, {
          userId: post.userId, // Post owner
          actorId: userId,      // Person who liked
          actorName: `${liker.firstName} ${liker.lastName}`,
          actorPicture: liker.picturePath,
          relatedId: post._id,
        });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};