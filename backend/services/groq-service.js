const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY must be set in environment variables');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = {                                             // status,      speed,     TPM (Ratelimit),  Notes
    primary: 'llama-3.3-70b-versatile',                      // production,  280 t/s,   300K TPM          Most reliable JSON.
    secondary: 'meta-llama/llama-4-scout-17b-16e-instruct',  // preview,     750 t/s,   300K TPM          Preview model, might be killed without notice.
    tertiary: 'openai/gpt-oss-20b',                          // production,  1000 t/s,  250K TPM          Fastest production model.
    fallback: 'llama-3.1-8b-instant',                        // production,  560 t/s,   last resort       Cheapest, not very smart.
};

const MODEL_TIER_ORDER = ['primary', 'secondary', 'tertiary', 'fallback'];

function buildPrompt(emails) {
    const emailList = emails.map((email, i) => `
        Email ${i + 1} (id: ${email.id}):
        From: ${email.from}
        Subject: ${email.subject}
        Date: ${email.date}
Body: ${email.body}
    `.trim()).join('\n---\n');

    return `You are a job application tracker. Analyze these emails and determine which ones are about a job application the recipient has ALREADY SUBMITTED or is actively in process for.

ONLY mark isJobRelated=true if the email is evidence that the recipient has taken action on a job — applied, been contacted about their application, scheduled/completed an interview, received an offer, or been rejected.

STRICT RULES — mark isJobRelated=false for ALL of these, no exceptions:
- Job recommendation or alert emails (LinkedIn "Jobs you may like", Indeed alerts, Naukri recommendations, etc.)
- "New jobs similar to X" or "X jobs matching your profile" emails
- Newsletter or digest emails listing multiple job openings
- Job board marketing emails (LinkedIn, Indeed, Glassdoor, Naukri, Internshala, Unstop, AngelList, Wellfound promotions)
- Emails that only invite you to apply — you haven't applied yet
- "Your job alert for X" or "N new jobs for Y" style subjects
- Recruiter cold outreach where no application has been submitted yet
- Emails about someone else's job search or hiring (e.g. "hire on LinkedIn")
- Account/billing/settings notifications from job platforms
- "X people viewed your profile" or "A recruiter viewed your profile" — passive profile views are NOT applications
- "[Company] viewed your profile" or "Your profile appeared in search" — this is NOT an interview or any application stage
- "You appeared in X searches" or profile analytics emails

ONLY mark isJobRelated=true for emails like these:
- "We received your application for [role] at [company]" — application confirmation
- "Your application is under review" — ATS status update
- "We'd like to schedule an interview" — interview invite (you applied first)
- "Congratulations, we'd like to offer you" — job offer
- "After careful consideration, we will not be moving forward" — rejection after applying
- "Complete your application for [role]" — reminder after a partial application was started
- Recruiter follow-up referencing a specific application you submitted

For status, use:
- "Applied" — application submitted, awaiting response
- "Interviewing" — an interview has been explicitly scheduled or completed; do NOT use this for profile views, recruiter reach-outs, or vague "we're reviewing" messages
- "Offered" — offer received
- "Rejected" — rejected after applying

Return ONLY a valid JSON array, no markdown, no extra text. One object per email:
[
  {
    "id": "email id",
    "isJobRelated": true or false,
    "companyName": "company name or null",
    "jobRole": "job title or null",
    "status": "Applied | Interviewing | Offered | Rejected",
    "confidence": 1-10
  }
]

confidence reflects how certain you are this is a real job application event (not a recommendation or alert). Score 8-10 only for clear application confirmations, interview invites, offers, or rejections. Score 1-3 for anything ambiguous.

Emails:
${emailList}`;
}

async function callGroqModel(model, emails) {
    const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: buildPrompt(emails) }],
        temperature: 0.1,
    });

    let text = response.choices[0].message.content.trim();
    text = text.replace(/```json\s*/g, '').replace(/```/g, '');

    // Throws if malformed JSON — caller catches and retries with next tier
    return JSON.parse(text);
}

// Automatically falls through model tiers on any failure.
async function parseEmailsWithGroq(emails, startTier = 'primary') {
    const startIndex = MODEL_TIER_ORDER.indexOf(startTier);
    if (startIndex === -1) {
        throw new Error(`Invalid model tier: "${startTier}"`);
    }

    const tiersToTry = MODEL_TIER_ORDER.slice(startIndex);
    let lastError;

    for (const tier of tiersToTry) {
        const model = MODELS[tier];
        console.log(`[Groq] Trying model tier "${tier}": ${model}`);
        try {
            const result = await callGroqModel(model, emails);
            if (tier !== startTier) {
                console.log(`[Groq] Succeeded on fallback tier "${tier}"`);
            }
            return result;
        } catch (err) {
            console.warn(`[Groq] Tier "${tier}" failed: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(`All Groq model tiers failed. Last error: ${lastError?.message}`);
}

module.exports = { parseEmailsWithGroq, MODELS };
