import { LegalFlag } from '../types';

export async function analyzeWithAnthropic(text: string, apiKey: string, systemPrompt: string, model: string): Promise<LegalFlag[]> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: `Analyze this legal text: ${text.substring(0, 150000)}` }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API Error: ${error}`);
        }

        const data = await response.json();
        const content = data.content[0].text;

        // Try to parse JSON from the response
        try {
            const parsed = JSON.parse(content);
            return parsed.flags || [];
        } catch {
            // If not valid JSON, try to extract JSON-like content
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.flags || [];
            }
            return [];
        }
    } catch (error) {
        console.error('Anthropic Analysis Failed', error);
        return [];
    }
}

export async function analyzeWithGroq(text: string, apiKey: string, systemPrompt: string, model: string): Promise<LegalFlag[]> {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this legal text: ${text.substring(0, 15000)}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API Error: ${error}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return content.flags || [];
    } catch (error) {
        console.error('Groq Analysis Failed', error);
        return [];
    }
}

export async function analyzeWithGemini(text: string, apiKey: string, systemPrompt: string, model: string): Promise<LegalFlag[]> {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nAnalyze this legal text: ${text.substring(0, 150000)}`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API Error: ${error}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;

        // Parse JSON response
        try {
            const parsed = JSON.parse(content);
            return parsed.flags || [];
        } catch {
            // Try to extract JSON if wrapped in text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.flags || [];
            }
            return [];
        }
    } catch (error) {
        console.error('Gemini Analysis Failed', error);
        return [];
    }
}

export async function analyzeWithMoonshot(text: string, apiKey: string, systemPrompt: string, model: string): Promise<LegalFlag[]> {
    try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this legal text: ${text.substring(0, 15000)}` }
                ],
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Moonshot API Error: ${error}`);
        }

        const data = await response.json();

        // Try to parse JSON from the response content
        try {
            const content = JSON.parse(data.choices[0].message.content);
            return content.flags || [];
        } catch {
            // If not valid JSON, try to extract JSON-like content
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.flags || [];
            }
            return [];
        }
    } catch (error) {
        console.error('Moonshot Analysis Failed', error);
        return [];
    }
}

export async function analyzeWithOpenRouter(text: string, apiKey: string, systemPrompt: string, model: string = 'openrouter/auto'): Promise<LegalFlag[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://termcheck.com', // Required by OpenRouter
                'X-Title': 'TermCheck' // Required by OpenRouter
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this legal text: ${text.substring(0, 15000)}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter API Error: ${error}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        return content.flags || [];
    } catch (error) {
        console.error('OpenRouter Analysis Failed', error);
        return [];
    }
}
