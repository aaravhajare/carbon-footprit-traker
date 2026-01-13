import { OpenRouter } from "@openrouter/sdk";

export const handler = async (event) => {
    try {
        const { imageBase64 } = JSON.parse(event.body || "{}");

        if (!imageBase64) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No image provided" })
            };
        }

        // Ensure image is in proper data URL format
        const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

        const openrouter = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        const stream = await openrouter.chat.completions.create({
            model: "allenai/molmo-2-8b:free",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Identify the main object in the image and classify its material strictly as one of: paper, plastic, metal, glass, soil, wood. Respond ONLY in JSON like: {\"object\":\"...\",\"material\":\"...\"}"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            stream: false
        });

        const content = stream.choices[0]?.message?.content || "";
        const json = content.match(/\{[\s\S]*\}/);

        if (!json) throw new Error("Invalid AI response format");

        const parsed = JSON.parse(json[0]);

        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
        };

    } catch (err) {
        console.error("Error in analyze function:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message || "Analysis failed" })
        };
    }
};
