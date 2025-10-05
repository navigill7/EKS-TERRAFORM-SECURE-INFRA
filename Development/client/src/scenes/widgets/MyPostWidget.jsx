import { Edit2, Image, Film, Paperclip, Mic, MoreHorizontal, X } from "lucide-react";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import { API_ENDPOINTS } from "config/api";
import { uploadToS3 } from "utils/s3Upload";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [image, setImage] = useState(null);
  const [post, setPost] = useState("");
  const [uploading, setUploading] = useState(false);
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const handlePost = async () => {
    try {
      setUploading(true);

      let picturePath = "";

      // Upload image to S3 if provided
      if (image) {
        picturePath = await uploadToS3(image, "post", token);
      }

      // Create post with S3 URL
      const response = await fetch(API_ENDPOINTS.POSTS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: _id,
          description: post,
          picturePath: picturePath,
        }),
      });

      const posts = await response.json();
      dispatch(setPosts({ posts }));
      setImage(null);
      setPost("");
      setIsImage(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="gap-4" className="mb-4">
        <UserImage image={picturePath} />
        <input
          placeholder="What's on your mind..."
          onChange={(e) => setPost(e.target.value)}
          value={post}
          className="flex-1 px-4 py-3 bg-grey-50 dark:bg-grey-700 rounded-full text-grey-700 dark:text-grey-100 placeholder-grey-400 dark:placeholder-grey-500 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200"
        />
      </FlexBetween>

      {isImage && (
        <div className="mb-4 p-4 border border-grey-200 dark:border-grey-700 rounded-lg">
          <Dropzone
            acceptedFiles=".jpg,.jpeg,.png"
            multiple={false}
            onDrop={(acceptedFiles) => setImage(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <div
                  {...getRootProps()}
                  className="flex-1 p-4 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-200"
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <p className="text-grey-500 dark:text-grey-400 text-center">
                      Add Your Latest Project Image Here...
                    </p>
                  ) : (
                    <FlexBetween>
                      <p className="text-grey-700 dark:text-grey-100">{image.name}</p>
                      <Edit2 className="w-5 h-5 text-primary-500" />
                    </FlexBetween>
                  )}
                </div>
                {image && (
                  <button
                    onClick={() => setImage(null)}
                    className="ml-4 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </div>
      )}

      <div className="border-t border-grey-100 dark:border-grey-700 my-4" />

      <FlexBetween>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setIsImage(!isImage)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group"
          >
            <Image className="w-5 h-5 text-grey-500 dark:text-grey-400 group-hover:text-primary-500 transition-colors duration-200" />
            <span className="text-sm text-grey-600 dark:text-grey-300 group-hover:text-primary-500 transition-colors duration-200 hidden sm:inline">
              Image
            </span>
          </button>

          <div className="hidden md:flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group">
              <Film className="w-5 h-5 text-grey-500 dark:text-grey-400 group-hover:text-primary-500 transition-colors duration-200" />
              <span className="text-sm text-grey-600 dark:text-grey-300 group-hover:text-primary-500 transition-colors duration-200">
                Clip
              </span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group">
              <Paperclip className="w-5 h-5 text-grey-500 dark:text-grey-400 group-hover:text-primary-500 transition-colors duration-200" />
              <span className="text-sm text-grey-600 dark:text-grey-300 group-hover:text-primary-500 transition-colors duration-200">
                Attachment
              </span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group">
              <Mic className="w-5 h-5 text-grey-500 dark:text-grey-400 group-hover:text-primary-500 transition-colors duration-200" />
              <span className="text-sm text-grey-600 dark:text-grey-300 group-hover:text-primary-500 transition-colors duration-200">
                Audio
              </span>
            </button>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200">
            <MoreHorizontal className="w-5 h-5 text-grey-500 dark:text-grey-400" />
          </button>
        </div>

        <button
          disabled={!post || uploading}
          onClick={handlePost}
          className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-grey-300 disabled:to-grey-300 dark:disabled:from-grey-700 dark:disabled:to-grey-700 text-white rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {uploading ? "UPLOADING..." : "POST"}
        </button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;