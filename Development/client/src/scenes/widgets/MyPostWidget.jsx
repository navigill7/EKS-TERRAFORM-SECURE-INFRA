// client/src/scenes/widgets/MyPostWidget.jsx (UPDATED)
import { Edit2, Image, Film, Paperclip, Mic, MoreHorizontal, X, Sparkles, Loader } from "lucide-react";
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
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [suggestedCaptions, setSuggestedCaptions] = useState([]);
  const [showCaptions, setShowCaptions] = useState(false);
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
      setSuggestedCaptions([]);
      setShowCaptions(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const generateCaptionSuggestions = async () => {
    if (!image) {
      alert("Please upload an image first!");
      return;
    }

    try {
      setGeneratingCaptions(true);
      setShowCaptions(true);
      setSuggestedCaptions([]);

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);
      
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix

        // Call backend API to generate captions
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/captions/generate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            imageType: image.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate captions");
        }

        const data = await response.json();
        setSuggestedCaptions(data.captions || []);
      };

      reader.onerror = () => {
        throw new Error("Failed to read image file");
      };
    } catch (error) {
      console.error("Error generating captions:", error);
      alert("Failed to generate captions. Please try again.");
      setSuggestedCaptions([]);
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const selectCaption = (caption) => {
    setPost(caption);
    setShowCaptions(false);
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
        <div className="mb-4 space-y-3">
          <div className="p-4 border border-grey-200 dark:border-grey-700 rounded-lg">
            <Dropzone
              acceptedFiles=".jpg,.jpeg,.png"
              multiple={false}
              onDrop={(acceptedFiles) => {
                setImage(acceptedFiles[0]);
                setSuggestedCaptions([]);
                setShowCaptions(false);
              }}
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
                      onClick={() => {
                        setImage(null);
                        setSuggestedCaptions([]);
                        setShowCaptions(false);
                      }}
                      className="ml-4 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </FlexBetween>
              )}
            </Dropzone>
          </div>

          {/* AI Caption Generator Button */}
          {image && (
            <button
              onClick={generateCaptionSuggestions}
              disabled={generatingCaptions}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-grey-400 disabled:to-grey-400 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {generatingCaptions ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating Captions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Captions
                </>
              )}
            </button>
          )}

          {/* Caption Suggestions */}
          {showCaptions && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-grey-800 dark:text-grey-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Caption Suggestions
                </h4>
                <button
                  onClick={() => setShowCaptions(false)}
                  className="p-1 rounded-full hover:bg-grey-200 dark:hover:bg-grey-700 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-grey-500" />
                </button>
              </div>

              {generatingCaptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : suggestedCaptions.length > 0 ? (
                <div className="space-y-2">
                  {suggestedCaptions.map((caption, index) => (
                    <button
                      key={index}
                      onClick={() => selectCaption(caption)}
                      className="w-full text-left px-4 py-3 bg-white dark:bg-grey-800 hover:bg-purple-50 dark:hover:bg-grey-700 rounded-lg text-sm text-grey-700 dark:text-grey-200 transition-colors duration-200 border border-grey-200 dark:border-grey-700 hover:border-purple-300 dark:hover:border-purple-600"
                    >
                      {caption}
                    </button>
                  ))}
                  <p className="text-xs text-grey-500 dark:text-grey-400 text-center mt-2">
                    Click any caption to use it, or edit it in the text box above
                  </p>
                </div>
              ) : (
                <p className="text-sm text-grey-500 dark:text-grey-400 text-center py-4">
                  No captions generated yet. Try again!
                </p>
              )}
            </div>
          )}
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