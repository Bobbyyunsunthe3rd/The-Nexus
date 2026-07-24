from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
import os


load_dotenv()


app = Flask(__name__)

CORS(app)


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


@app.route("/")
def home():

    return jsonify(
        {
            "message": "CRM AI Backend is running!"
        }
    )


@app.route("/generate-insight", methods=["POST"])
def generate_insight():

    data = request.json


    metrics = data.get("metrics", [])


    metric_text = "\n".join(
    [
    f"{item['name']}: {item['value']}"
    for item in metrics
    ]
    )


    prompt = f"""
    You are an AI business analyst
    for a real estate CRM dashboard.


    Analyze ONLY the following CRM metrics:

    {metric_text}


    Rules:
    - Do not invent statistics.
    - Do not compare against industry averages.
    - Do not assume missing information.
    - Base all conclusions only on the provided metrics.


    Provide:

    1. Executive Summary
    2. Important Findings
    3. Problems Detected
    4. Recommended Actions


    Write professionally for company management.
    """


    try:

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        return jsonify(
            {
                "insight": response.text
            }
        )

    except Exception as e:

        print("Gemini Error:", e)

        return jsonify(
            {
                "error": str(e)
            }
        ), 500


if __name__ == "__main__":

    app.run(
        port=5000,
        debug=True
    )