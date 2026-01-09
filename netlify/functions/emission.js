// Carbon emission factors (kg CO2e per kg of material)
const EMISSION_FACTORS = {
    paper: 1.2,      // Paper production: ~1.2 kg CO2e per kg
    plastic: 3.5,   // Plastic production: ~3.5 kg CO2e per kg
    metal: 2.5,     // Metal production: ~2.5 kg CO2e per kg
    glass: 0.9,     // Glass production: ~0.9 kg CO2e per kg
    default: 2.0    // Default fallback
};

// 3-R Recommendations for each material
const RECOMMENDATIONS = {
    paper: {
        reduce: "Use digital alternatives, print double-sided, reduce paper usage",
        reuse: "Use both sides of paper, create notepads from scrap paper",
        recycle: "Recycle paper products - saves 60% energy compared to new paper"
    },
    plastic: {
        reduce: "Avoid single-use plastics, use reusable containers and bags",
        reuse: "Repurpose plastic containers, use refillable bottles",
        recycle: "Recycle plastic properly - reduces emissions by 50%"
    },
    metal: {
        reduce: "Choose products with less packaging, buy durable items",
        reuse: "Repair metal items, donate or sell instead of discarding",
        recycle: "Recycle metal - saves 95% energy compared to new production"
    },
    glass: {
        reduce: "Buy products in bulk to reduce packaging, choose lighter containers",
        reuse: "Use glass jars for storage, repurpose bottles as containers",
        recycle: "Recycle glass - saves 30% energy and reduces landfill waste"
    }
};

export async function handler(event) {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { material, weight } = body;

        if (!material || !weight) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "Material and weight are required",
                    co2e: 0
                })
            };
        }

        // Calculate emissions using emission factors
        const factor = EMISSION_FACTORS[material.toLowerCase()] || EMISSION_FACTORS.default;
        const co2e = (factor * parseFloat(weight)).toFixed(4);
        const recommendations = RECOMMENDATIONS[material.toLowerCase()] || RECOMMENDATIONS.paper;

        // Try Climatiq API if API key is available (optional)
        let apiCo2e = null;
        if (process.env.CLIMATIQ_API_KEY) {
            try {
                const activityMap = {
                    paper: "paper-production",
                    plastic: "plastic-production",
                    metal: "steel-production",
                    glass: "glass-production"
                };

                const response = await fetch(
                    "https://api.climatiq.io/estimate",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            emission_factor: {
                                activity_id: activityMap[material.toLowerCase()] || "paper-production"
                            },
                            parameters: {
                                weight: parseFloat(weight),
                                weight_unit: "kg"
                            }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    apiCo2e = data.co2e ? parseFloat(data.co2e).toFixed(4) : null;
                }
            } catch (apiError) {
                // Fall back to emission factors
                console.log("API call failed, using emission factors");
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                co2e: apiCo2e || co2e,
                material: material,
                weight: weight,
                recommendations: recommendations
            })
        };

    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Calculation failed",
                message: err.message,
                co2e: 0
            })
        };
    }
}
