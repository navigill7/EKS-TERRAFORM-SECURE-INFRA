import { MessageCircle, Heart, Share2 } from "lucide-react";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friends";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";
import { API_ENDPOINTS } from "config/api";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  comments,
}) => {
  const [isComments, setIsComments] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likesCount = Object.keys(likes).length;

  const patchLike = async () => {
    const response = await fetch(`${API_ENDPOINTS.POSTS}/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  // ✅ Helper function to get the correct image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    // If it's already a full URL (starts with http:// or https://), use it directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, it's an old local path, construct the localhost URL
    return `http://localhsot:3001/assets/${path}`;
  };

  return (
    <WidgetWrapper className="animate-fade-in">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      <p className="mt-4 text-grey-700 dark:text-grey-200 leading-relaxed">
        {description}
      </p>
      {picturePath && (
        <img
          className="w-full h-auto rounded-xl mt-4 shadow-sm"
          alt="post"
          src={getImageUrl(picturePath)}
          onError={(e) => {
            console.error('Failed to load image:', picturePath);
            e.target.style.display = 'none';
          }}
        />
      )}
      
      <FlexBetween className="mt-4">
        <div className="flex items-center gap-6">
          <button
            onClick={patchLike}
            className="flex items-center gap-2 group"
          >
            <div className={`p-2 rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : 'hover:bg-grey-100 dark:hover:bg-grey-700'
            }`}>
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  isLiked
                    ? 'fill-red-500 text-red-500'
                    : 'text-grey-500 dark:text-grey-400 group-hover:text-red-500'
                }`}
              />
            </div>
            <span className="text-sm text-grey-600 dark:text-grey-300">
              {likesCount}
            </span>
          </button>

          <button
            onClick={() => setIsComments(!isComments)}
            className="flex items-center gap-2 group"
          >
            <div className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-all duration-200">
              <MessageCircle className="w-5 h-5 text-grey-500 dark:text-grey-400 group-hover:text-primary-500 transition-colors duration-200" />
            </div>
            <span className="text-sm text-grey-600 dark:text-grey-300">
              {comments.length}
            </span>
          </button>
        </div>

        <button className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-all duration-200">
          <Share2 className="w-5 h-5 text-grey-500 dark:text-grey-400 hover:text-primary-500 transition-colors duration-200" />
        </button>
      </FlexBetween>

      {isComments && (
        <div className="mt-4 space-y-3">
          {comments.map((comment, i) => (
            <div key={`${name}-${i}`} className="pt-3 border-t border-grey-100 dark:border-grey-700">
              <p className="text-sm text-grey-600 dark:text-grey-300 pl-4">
                {comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;