const { GoogleGenerativeAI } = require('@google/generative-ai');

// API key is checked lazily at call time, not at module load.
// This prevents a crash if the file is imported but GEMINI_API_KEY is not set.
let genAI = null;

function getClient() {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY must be set in environment variables');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

async function parseEmailWithGemini(emailContent) {
    try {
        const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Analyze this email and extract job application information. Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

                        {
                        "isJobRelated": true/false,
                        "companyName": "company name or null",
                        "jobRole": "job title or null",
                        "status": "Applied/Interviewing/Offered/Rejected",
                        "confidence": 1-10,
                        "reason": "brief explanation"
                        }

                        Email content:
                        ${emailContent}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.trim().replace(/```json\s*/g, '').replace(/```/g, '');

        const parsed = JSON.parse(responseText);

        return {
            isJobRelated: parsed.isJobRelated || false,
            companyName: parsed.companyName || null,
            jobRole: parsed.jobRole || null,
            status: parsed.status || 'Applied',
            confidence: parsed.confidence || 0,
        };
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return {
            isJobRelated: false,
            companyName: null,
            jobRole: null,
            status: 'Applied',
            confidence: 0,
            error: error.message,
        };
    }
}

module.exports = { parseEmailWithGemini };
