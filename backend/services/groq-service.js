const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY must be set in environment variables');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = {                                             // status,      speed,     TPM (Ratelimit),  Notes
    primary: 'llama-3.3-70b-versatile',                      // production,  280 t/s,   300K TPM          Most reliable JSON.
    secondary: 'meta-llama/llama-4-scout-17b-16e-instruct',  // preview,     750 t/s,   300K TPM          Preview model, might be killed without notice.
    tertiary: 'openai/gpt-oss-20b',                          // production,  1000 t/s,  250K TPM          Fastest production model.
    fallback: 'llama-3.1-8b-instant',                        // production,  560 t/s,   last resort       Cheapest, Not very smart.
};

// Helper function to build the prompt for Groq API
function buildPrompt(emails) {
    const emailList = emails.map((email, i) => `
        Email ${i + 1} (id: ${email.id}):
        From: ${email.from}
        Subject: ${email.subject}
        Date: ${email.date}
Body: ${email.body}
    `.trim()).join('\n---\n');

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
    console.log("______: emails", emails);
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