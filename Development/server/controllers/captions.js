// server/controllers/captions.js (NEW @google/genai SDK)
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Debug: Check if API key is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set in .env file!");
} else {
  console.log("✅ GEMINI_API_KEY loaded:", apiKey.substring(0, 10) + "...");
}

// Initialize Gemini with NEW SDK
const ai = new GoogleGenAI({ apiKey });

export const generateCaptions = async (req, res) => {
  try {
    const { imageBase64, imageType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "Image data is required" });
    }

    console.log("🎨 Generating captions using Google Gemini (NEW SDK)...");

    // Create the prompt
    const prompt = `Analyze this image carefully and generate 5 diverse, engaging captions suitable for a university social networking post (like LinkedIn or Instagram for students/alumni).

Requirements for each caption:
1. Professional yet friendly tone (suitable for students and alumni)
2. Varied styles: mix of professional, casual, inspirational, humorous, and thoughtful
3. Between 10-25 words each
4. Include relevant emojis where appropriate
5. Capture different aspects or interpretations of what's shown in the image
6. Make them creative and engaging - not generic

Consider the context, mood, setting, activities, people, objects, and overall message of the image.

IMPORTANT: Return ONLY a valid JSON array of exactly 5 caption strings. No additional text, explanations, or markdown formatting.

Format example:
["Professional caption about the achievement shown 🎓", "Casual friendly caption about the moment 😊", "Inspirational caption about growth 🌟", "Light humorous take on the situation 😄", "Thoughtful reflective caption 💭"]`;

    // Generate content using NEW SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",  // Latest model with vision support
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageType || "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text;
    console.log("Raw Gemini response:", text);

    // Parse the response
    let captions;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^\s*\[/m, "[")
        .replace(/\]\s*$/m, "]")
        .trim();
      
      captions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      
      // Try to extract captions manually using regex
      const matches = text.match(/"([^"]{10,150})"/g);
      if (matches && matches.length >= 3) {
        captions = matches.slice(0, 5).map(m => m.slice(1, -1));
      } else {
        throw new Error("Could not parse caption suggestions from response");
      }
    }

    // Validate we got an array with at least some captions
    if (!Array.isArray(captions) || captions.length === 0) {
      throw new Error("Invalid caption format received");
    }

    // Ensure we have exactly 5 captions (pad with creative ones if needed)
    while (captions.length < 5) {
      const genericCaptions = [
        "Making memories that matter 📸",
        "Another chapter in the journey 🚀",
        "Grateful for moments like these 🙏",
        "Creating my own path forward 💫",
        "Here's to new experiences! 🎉"
      ];
      captions.push(genericCaptions[captions.length % genericCaptions.length]);
    }

    // Take only first 5
    captions = captions.slice(0, 5);

    console.log(`✅ Generated ${captions.length} captions`);

    res.status(200).json({
      captions: captions,
      count: captions.length,
    });
  } catch (error) {
    console.error("❌ Error generating captions:", error);
    
    // Provide helpful fallback captions
    const fallbackCaptions = [
      "Capturing this special moment 📸✨",
      "Making memories that last forever 🌟",
      "Here's to new adventures and experiences! 🚀",
      "Living my best life, one day at a time 💫",
      "Grateful for moments like these 🙏💛"
    ];
    
    res.status(200).json({
      captions: fallbackCaptions,
      count: fallbackCaptions.length,
      fallback: true,
      message: "Using fallback captions. Please check your API key and try again."
    });
  }
};