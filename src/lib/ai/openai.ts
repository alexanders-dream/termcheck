import { LegalFlag } from '../types';

export async function analyzeWithOpenAI(text: string, apiKey: string, systemPrompt: string, model: string): Promise<LegalFlag[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this legal text: ${text.substring(0, 15000)}` } // Simple truncation for MVP
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error('OpenAI API Error');

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return content.flags || [];
  } catch (error) {
    console.error('AI Analysis Failed', error);
    return [];
  }
}