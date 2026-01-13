import fetch from "node-fetch";

export const handler = async (event) => {
    try {
        const { imageBase64 } = JSON.parse(event.body || "{}");

        if (!imageBase64) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No image provided" })
            };
        }

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "allenai/molmo-2-8b:free",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                "Identify the main object in the image and classify its material strictly as one of: paper, plastic, metal, glass, soil, wood. Respond ONLY in JSON like: {\"object\":\"...\",\"material\":\"...\"}"
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageBase64 }
                        }
                    ]
                }]
            })
        });

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || "";

        const json = content.match(/\{[\s\S]*\}/);
        if (!json) throw new Error("Invalid AI response");

        return {
            statusCode: 200,
            body: json[0]
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
