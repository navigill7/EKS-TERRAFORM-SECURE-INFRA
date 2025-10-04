import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const discordCallback = async (req, res) => {
  try {
    // User is authenticated by passport
    const user = req.user;

    if (!user) {
      console.log("❌ No user found in request");
      return res.redirect(`${process.env.CLIENT_URL}/?error=authentication_failed`);
    }

    console.log("✅ Generating JWT for user:", user.email);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Remove sensitive data from user object
    const userWithoutPassword = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      picturePath: user.picturePath,
      friends: user.friends,
      location: user.location,
      Year: user.Year,
      viewedProfile: user.viewedProfile,
      impressions: user.impressions,
      twitterUrl: user.twitterUrl,
      linkedInUrl: user.linkedInUrl,
      provider: user.provider,
      discordUsername: user.discordUsername,
    };

    // Encode user data
    const userData = encodeURIComponent(JSON.stringify(userWithoutPassword));
    
    // Build redirect URL
    const clientURL = process.env.CLIENT_URL || "http://localhost:3000";
    const redirectURL = `${clientURL}/auth/callback?token=${token}&user=${userData}`;
    
    console.log("🔄 Redirecting to:", redirectURL);
    
    // Redirect to frontend
    res.redirect(redirectURL);
  } catch (error) {
    console.error("❌ Error in Discord callback:", error);
    const clientURL = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${clientURL}/?error=server_error`);
  }
};