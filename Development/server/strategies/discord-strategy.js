import passport from "passport";
import pkg from "passport-discord";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const { Strategy } = pkg;

passport.use(
  new Strategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify", "email", "guilds"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Discord profile received:", profile);

        // Check if user already exists
        let user = await User.findOne({ discordId: profile.id });

        if (user) {
          // User exists, update their info
          console.log("Existing user found:", user.email);
          
          // Update avatar and username in case they changed
          user.discordUsername = profile.username;
          user.discordDiscriminator = profile.discriminator;
          user.discordAvatar = profile.avatar;
          
          await user.save();
          return done(null, user);
        }

        // Check if email already exists (user might have registered traditionally)
        if (profile.email) {
          user = await User.findOne({ email: profile.email });
          
          if (user) {
            // Link Discord account to existing user
            console.log("Linking Discord to existing account:", user.email);
            
            user.discordId = profile.id;
            user.provider = 'discord';
            user.discordUsername = profile.username;
            user.discordDiscriminator = profile.discriminator;
            user.discordAvatar = profile.avatar;
            
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        console.log("Creating new user from Discord profile");
        
        // Extract name from Discord username or use username as firstName
        const nameParts = profile.username.split(' ');
        const firstName = nameParts[0] || profile.username;
        const lastName = nameParts.slice(1).join(' ') || profile.username;

        const newUser = new User({
          discordId: profile.id,
          provider: 'discord',
          email: profile.email || `${profile.id}@discord.temp`, // Fallback if no email
          firstName: firstName,
          lastName: lastName,
          discordUsername: profile.username,
          discordDiscriminator: profile.discriminator,
          discordAvatar: profile.avatar,
          picturePath: profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : "",
          viewedProfile: 0,
          impressions: 0,
        });

        await newUser.save();
        console.log("New user created successfully:", newUser.email);
        
        return done(null, newUser);
      } catch (error) {
        console.error("Error in Discord strategy:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user:", id);
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

export default passport;