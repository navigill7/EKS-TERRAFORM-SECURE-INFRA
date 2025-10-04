import { API_ENDPOINTS } from "config/api";

const UserImage = ({ image, size = "60px" }) => {
  return (
    <div 
      className="relative group"
      style={{ width: size, height: size }}
    >
      <img
        className="w-full h-full object-cover rounded-full ring-2 ring-primary-500/20 group-hover:ring-primary-500/50 transition-all duration-300"
        alt="user"
        src={API_ENDPOINTS.ASSET(image)}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/0 to-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default UserImage;