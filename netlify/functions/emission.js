export async function handler(event) {
    try {
        const { material, weight } = JSON.parse(event.body);

        const response = await fetch(
            "https://api.climatiq.io/data/v1/estimate",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    emission_factor: {
                        activity_id: "paper_production",
                        data_version: "^3"
                    },
                    parameters: {
                        weight: weight,
                        weight_unit: "kg"
                    }
                })
            }
        );

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify({
                co2e: data.co2e
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Calculation failed" })
        };
    }
}
