import fetch from "node-fetch";

export const handler = async (event) => {
    try {
        const { imageBase64 } = JSON.parse(event.body);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "allenai/molmo-2-8b:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text:
                                    "Analyze the image. Identify the MAIN object and classify its material strictly as ONE of: paper, plastic, metal, glass, soil, wood. Respond ONLY in valid JSON like this: {\"object\":\"...\",\"material\":\"...\"}"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageBase64
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        const text = data.choices[0].message.content;

        // Extract JSON safely
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");

        return {
            statusCode: 200,
            body: jsonMatch[0]
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
