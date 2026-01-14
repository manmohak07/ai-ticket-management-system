import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

const analyzeTicket = async (ticket) => {
  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const systemPrompt = `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Analyze the issue thoroughly
2. Provide comprehensive, actionable solutions
3. Include step-by-step instructions with examples
4. Create ASCII workflow diagrams when helpful
5. Suggest preventive measures

IMPORTANT:
- Respond ONLY with valid JSON.
- The format must be a raw JSON object.
- DO NOT wrap the response in markdown code blocks or any other characters.
- Make helpfulNotes extremely detailed and actionable (300-500 words).`;

  const userPrompt = `You are a ticket triage agent. Only return a strict JSON object.
        
Analyze the following support ticket and provide a JSON object with:
- summary: A short 1-2 sentence summary.
- priority: One of "low", "medium", or "high".
- helpfulNotes: A COMPREHENSIVE technical guide (markdown formatted) with Root cause, Step-by-step resolution, ASCII diagrams, and testing steps.
- relatedSkills: An array of technical skills required.

{
"summary": "...",
"priority": "...",
"helpfulNotes": "...",
"relatedSkills": ["..."]
}

Ticket:
Title: ${ticket.title}
Description: ${ticket.description}`;

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // More deterministic for JSON
      model: modelName
    });

    const raw = response.choices[0].message.content;

    // Improved JSON Extraction
    let jsonString = raw.trim();

    // Remove potential markdown code blocks
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Find the first '{' and the last '}'
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');

    if (start !== -1 && end !== -1) {
      jsonString = jsonString.substring(start, end + 1);
    }

    const parsed = JSON.parse(jsonString);

    let notes = parsed.helpfulNotes;
    if (typeof notes === 'object' && notes !== null) {
      notes = JSON.stringify(notes, null, 2);
    }

    return {
      priority: parsed.priority?.toLowerCase() || "medium",
      relatedSkills: Array.isArray(parsed.relatedSkills) ? parsed.relatedSkills : [],
      helpfulNotes: notes || "No notes generated.",
      summary: parsed.summary || ticket.title
    };
  } catch (e) {
    console.error("AI Analysis Error:", e.message);
    return {
      priority: "medium",
      relatedSkills: [],
      helpfulNotes: "AI analysis failed. Reviewing manually.",
      summary: ticket.title
    };
  }
};

export default analyzeTicket;
