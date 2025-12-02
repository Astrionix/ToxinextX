import { groq } from '../config/groq';

interface ModerationResult {
    action: 'allow' | 'warn' | 'block' | 'shadowban';
    toxicity_score: number;
    category: string;
    explanation: string;
    safe_rewrite: string | null;
}

export async function moderateText(text: string): Promise<ModerationResult> {
    try {
        // Step 1: Fast screening with Llama 3.1 8B Instant
        const screeningCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a toxicity detector. Respond with a JSON object containing 'toxicity_score' (0.0 to 1.0) and 'is_toxic' (boolean). 
          Content is toxic if it contains hate speech, cyberbullying, harassment, threats, or severe abuse. 
          If unsure, lean towards marking as toxic for further review.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const screeningContent = screeningCompletion.choices[0].message.content;
        const screeningResult = screeningContent ? JSON.parse(screeningContent) : { toxicity_score: 0 };
        const toxicityScore = screeningResult.toxicity_score || 0;

        // If score is low, allow immediately
        if (toxicityScore < 0.20) {
            return {
                action: "allow",
                toxicity_score: toxicityScore,
                category: "safe",
                explanation: "Content is within safe limits.",
                safe_rewrite: null
            };
        }

        // Step 2: Deep classification with Llama 3.3 70B Versatile
        const classificationPrompt = `
      You are an AI content safety and moderation system.
      Analyze the following text for hate speech, cyberbullying, harassment, threats, abuse, and spam.
      
      Classify the content into one of these categories:
      - Hate Speech
      - Cyberbullying
      - Harassment
      - Threat
      - Abuse
      - Spam
      - Safe (if false positive)

      Determine the appropriate action:
      - allow (if safe or very mild)
      - warn (if borderline)
      - block (if hate speech, cyberbullying, harassment, or severe toxicity)
      - shadowban (if spam)

      Provide a safe rewrite of the content if it is toxic. The rewrite should convey the original intent (if possible) without the toxicity.

      Respond with a JSON object:
      {
        "category": "string",
        "toxicity_score": number (0.0-1.0),
        "action": "allow" | "warn" | "block" | "shadowban",
        "explanation": "string",
        "safe_rewrite": "string" | null
      }
    `;

        const deepCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: classificationPrompt
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const deepContent = deepCompletion.choices[0].message.content;
        const deepResult = deepContent ? JSON.parse(deepContent) : null;

        if (!deepResult) {
            // Fallback if parsing fails
            return {
                action: "warn",
                toxicity_score: toxicityScore,
                category: "unknown",
                explanation: "Failed to parse detailed moderation response.",
                safe_rewrite: null
            };
        }

        return deepResult;

    } catch (error) {
        console.error("Moderation error:", error);
        // Fail safe: warn if error occurs but allow if it looks like a system error? 
        // Better to warn/block if we can't be sure, but for now let's return a neutral error state.
        return {
            action: "warn",
            toxicity_score: 0.5,
            category: "error",
            explanation: "An error occurred during moderation: " + (error instanceof Error ? error.message : String(error)),
            safe_rewrite: null
        };
    }
}
