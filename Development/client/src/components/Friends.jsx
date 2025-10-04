import { UserPlus, UserMinus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "config/api";

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);

  const isFriend = friends.find((friend) => friend._id === friendId);

  const patchFriend = async () => {
    const response = await fetch(`http://localhost:3001/users/${_id}/${friendId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    });
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  return (
    <FlexBetween className="group">
      <FlexBetween gap="gap-4">
        <UserImage image={userPicturePath} size="55px" />
        <div
          onClick={() => {
            navigate(`/profile/${friendId}`);
            navigate(0);
          }}
          className="cursor-pointer"
        >
          <h5 className="font-medium text-grey-700 dark:text-grey-100 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-200">
            {name}
          </h5>
          <p className="text-sm text-grey-400 dark:text-grey-500">{subtitle}</p>
        </div>
      </FlexBetween>
      <button
        onClick={() => patchFriend()}
        className="p-2.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        {isFriend ? (
          <UserMinus className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </button>
    </FlexBetween>
  );
};

export default Friend;