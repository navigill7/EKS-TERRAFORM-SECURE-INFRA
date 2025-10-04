import Friend from "components/Friends";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";
import { API_ENDPOINTS } from "config/api";

const ConnectionListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);
  const [loading, setLoading] = useState(true);

  const getFriends = async () => {
    setLoading(true);
    const response = await fetch(API_ENDPOINTS.USER_FRIENDS(userId), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
    setLoading(false);
  };

  useEffect(() => {
    getFriends();
  }, []);

  if (loading) {
    return (
      <WidgetWrapper>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <h3 className="text-lg font-semibold text-grey-700 dark:text-grey-200 mb-6">
        Connections
      </h3>
      <div className="space-y-4">
        {Array.isArray(friends) &&
          friends.map((friend) => (
            <Friend
              key={friend._id}
              friendId={friend._id}
              name={`${friend.firstName} ${friend.lastName}`}
              subtitle={friend.occupation}
              userPicturePath={friend.picturePath}
            />
          ))}
      </div>
    </WidgetWrapper>
  );
};

export default ConnectionListWidget;