/* =====================================================================
   Netlify Function: generate-insight
   ---------------------------------------------------------------------
   Serverless replacement for the old local Flask server (backend/app.py).
   Takes the selected CRM metrics, asks Gemini to analyse them, and returns
   STRICT JSON in the exact shape reports.js expects:

       { executive_summary: string,
         important_findings: string[],
         recommended_actions: string[] }

   The Gemini API key is read from the GEMINI_API_KEY environment variable
   (set in the Netlify dashboard under Site settings -> Environment
   variables). It is NEVER shipped to the browser or committed to git.

   Endpoint once deployed:  /.netlify/functions/generate-insight
   ===================================================================== */


// The JSON schema we force Gemini to fill. Using responseSchema guarantees
// the model returns valid, parseable JSON in this exact structure — which is
// what fixes the old bug where app.py returned free-form prose and the
// browser's JSON.parse() threw on every single report.
const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        executive_summary: { type: "STRING" },
        important_findings: { type: "ARRAY", items: { type: "STRING" } },
        recommended_actions: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["executive_summary", "important_findings", "recommended_actions"]
};


const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};


exports.handler = async function (event) {

    // Browsers send a CORS preflight before the POST.
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return json(405, { error: "Method not allowed. Use POST." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return json(500, {
            error: "GEMINI_API_KEY is not configured on the server."
        });
    }

    // The model is overridable via an env var so it can be updated without a
    // code change if Google renames/retires the default.
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";


    // ---- Parse the incoming metrics -------------------------------------

    let metrics = [];

    try {
        const body = JSON.parse(event.body || "{}");
        metrics = Array.isArray(body.metrics) ? body.metrics : [];
    } catch (err) {
        return json(400, { error: "Invalid request body." });
    }

    if (metrics.length === 0) {
        return json(400, { error: "No metrics provided." });
    }

    const metricText = metrics
        .map(function (m) { return m.name + ": " + m.value; })
        .join("\n");


    // ---- Build the prompt -----------------------------------------------

    const prompt =
`You are an AI business analyst for a real estate CRM dashboard.

Analyze ONLY the following CRM metrics:

${metricText}

Rules:
- Do not invent statistics.
- Do not compare against industry averages.
- Do not assume missing information.
- Base all conclusions only on the provided metrics.
- Write professionally for company management.

Respond using the required JSON structure:
- executive_summary: one concise narrative paragraph summarising performance.
- important_findings: 3-5 short, specific findings drawn from the metrics.
- recommended_actions: 3-5 short, concrete actions management should take.`;


    // ---- Call Gemini -----------------------------------------------------

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) +
        ":generateContent?key=" + encodeURIComponent(apiKey);

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.4
        }
    };

    try {

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const message =
                (data && data.error && data.error.message) ||
                "Gemini request failed.";
            return json(response.status, { error: message });
        }

        const text =
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text;

        if (!text) {
            return json(502, { error: "Empty response from Gemini." });
        }

        // reports.js does JSON.parse(result.insight), so we hand back the
        // schema-validated JSON string exactly as Gemini produced it.
        return json(200, { insight: text });

    } catch (err) {
        return json(500, { error: "Server error: " + String(err) });
    }
};


// Small helper so every response carries the CORS headers + JSON content type.
function json(statusCode, obj) {
    return {
        statusCode: statusCode,
        headers: Object.assign(
            { "Content-Type": "application/json" },
            CORS_HEADERS
        ),
        body: JSON.stringify(obj)
    };
}
