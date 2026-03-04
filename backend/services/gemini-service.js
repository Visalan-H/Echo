const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY must be set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to call Gemini API to parse email content and extract job application info
async function parseEmailWithGemini(emailContent) {
    try {

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
        responseText = responseText.trim().replace(/```json\s*/g, '').replace(/```/g, ''); // Remove markdown code block if present

        // Parse the JSON response
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
