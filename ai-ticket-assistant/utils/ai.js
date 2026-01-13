import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets. 

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
- Make helpfulNotes extremely detailed and actionable (300-500 words).`,
  });

  const response =
    await supportAgent.run(`You are a ticket triage agent. Only return a strict JSON object.
        
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
Description: ${ticket.description}`);

  try {
    let raw = "";
    if (response.output) {
      raw = typeof response.output === 'string' ? response.output : JSON.stringify(response.output);
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      raw = response.candidates[0].content.parts[0].text;
    } else {
      raw = typeof response === 'string' ? response : JSON.stringify(response);
    }

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

    return {
      priority: parsed.priority?.toLowerCase() || "medium",
      relatedSkills: Array.isArray(parsed.relatedSkills) ? parsed.relatedSkills : [],
      helpfulNotes: parsed.helpfulNotes || "No notes generated.",
      summary: parsed.summary || ticket.title
    };
  } catch (e) {
    console.error("AI Parsing Error:", e.message, "Raw:", response);
    return {
      priority: "medium",
      relatedSkills: [],
      helpfulNotes: "AI analysis failed to parse. Reviewing manually.",
      summary: ticket.title
    };
  }
};

export default analyzeTicket;
