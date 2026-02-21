const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY must be set in environment variables');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = {
    primary: process.env.GROQ_MODEL_PRIMARY || 'meta-llama/llama-4-scout-17b-16e-instruct',
    secondary: process.env.GROQ_MODEL_SECONDARY || 'groq/compound-mini',
    tertiary: process.env.GROQ_MODEL_TERTIARY || 'moonshotai/kimi-k2-instruct',
};

// Helper function to build the prompt for Groq API
function buildPrompt(emails) {
    const emailList = emails.map((email, i) => `
Email ${i + 1} (id: ${email.id}):
Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body: ${email.body}
`).join('\n---\n');

    return `Analyze these emails and extract job application information. Return ONLY a valid JSON array, no markdown, no extra text.

For each email return an object with this exact structure:
{
  "id": "email id",
  "isJobRelated": true/false,
  "companyName": "company name or null",
  "jobRole": "job title or null",
  "status": "Applied/Interviewing/Offered/Rejected",
  "confidence": 1-10
}

Emails:
${emailList}`;
}
 
// Function to call Groq API to parse email content and extract job application info
async function parseEmailsWithGroq(emails, modelTier = 'primary') {
    const model = MODELS[modelTier];

    if (!model) {
        throw new Error(`Invalid model tier: "${modelTier}". Must be primary, secondary, or tertiary.`);
    }
 
    // Log the model being used for debugging purposes
    console.log(`[Groq] Using model: ${model}`);

    const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: buildPrompt(emails) }],
        temperature: 0.1,
    });

    let text = response.choices[0].message.content.trim();
    text = text.replace(/```json\s*/g, '').replace(/```/g, '');
    return JSON.parse(text);
}

module.exports = { parseEmailsWithGroq, MODELS };