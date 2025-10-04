import express from "express"
import {
    getUser,
    getUserFriends,
    addRemoveFriends,
    SearchUser,
    updateSocialUrls  // Add this new import
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);


router.patch("/:id/social", verifyToken, updateSocialUrls);  // NEW: Must come before /:id/:friendId
router.patch("/:id/:friendId", verifyToken, addRemoveFriends);

// SEARCH //
router.post('/search', (req, res) => {
    console.log('Received POST request to /users/search');
    SearchUser(req, res);
});

export default router;