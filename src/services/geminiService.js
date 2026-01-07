/**
 * AI Service for Admin Features (Using Groq API)
 * Provides AI analytics, predictions, assistant chat, and auto-generated reports
 * Migrated from Gemini → OpenAI → Groq API
 * Groq provides fast inference with open-source models
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate AI analytics from SOS data
 */
export const generateSOSAnalytics = async (sosAlerts) => {
  try {
    const prompt = `Analyze the following SOS alert data and provide insights:

SOS Alerts Data:
${JSON.stringify(sosAlerts, null, 2)}

Please provide a comprehensive analysis with:
1. Total number of alerts
2. Most common trigger methods
3. Time patterns (peak hours/days)
4. Geographic patterns if location data available
5. Response time analysis
6. Key insights and recommendations

Format the response as clear, well-structured text with proper headings and bullet points. Make it easy to read and understand. DO NOT use JSON format - use plain text with proper formatting.`;

    const systemMessage = 'You are an AI data analyst specializing in safety analytics for women\'s safety applications. Provide detailed, actionable insights from SOS alert data in clear, readable text format with proper headings and bullet points.';
    const response = await callGroqAPI(prompt, systemMessage);
    return { summary: response, text: response };
  } catch (error) {
    console.error('❌ Error generating SOS analytics:', error);
    throw error;
  }
};

/**
 * Generate incident predictions based on historical data
 */
export const generateIncidentPredictions = async (historicalData) => {
  try {
    const prompt = `Based on the following historical SOS incident data, predict potential future incidents:

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Please provide:
1. Risk assessment for different time periods
2. High-risk locations
3. Predicted incident patterns
4. Preventive recommendations
5. Resource allocation suggestions

Format the response as a structured JSON object with fields: riskAssessment, highRiskLocations, patterns, recommendations, resourceAllocation.`;

    const systemMessage = 'You are a predictive analytics expert specializing in safety and security. Analyze historical incident data to predict future risks and provide actionable recommendations.';
    const response = await callGroqAPI(prompt, systemMessage);
    return parseAIResponse(response);
  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    throw error;
  }
};

/**
 * AI Assistant Chat for Admins
 */
export const chatWithAIAssistant = async (userMessage, conversationHistory = []) => {
  try {
    const contextPrompt = `Conversation History:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User: ${userMessage}

Provide a helpful, concise response focused on safety management and admin tasks.`;

    const systemMessage = 'You are an AI assistant for RakshaDrishti, a women\'s safety application. You help administrators manage SOS alerts, analyze safety data, and provide insights. Be helpful, professional, and focused on safety management.';
    const response = await callGroqAPI(contextPrompt, systemMessage);
    return response;
  } catch (error) {
    console.error('❌ Error in AI chat:', error);
    throw error;
  }
};

/**
 * Auto-generate incident report
 */
export const generateIncidentReport = async (sosAlert) => {
  try {
    const prompt = `Generate a detailed incident report for the following SOS alert:

Alert Data:
${JSON.stringify(sosAlert, null, 2)}

Please include:
1. Incident Summary
2. Timeline of Events
3. Location Details
4. User Information
5. Response Actions Taken
6. Current Status
7. Recommendations

Format as a professional incident report with clear sections and actionable recommendations.`;

    const systemMessage = 'You are a professional incident report writer for emergency services. Create detailed, accurate, and well-structured incident reports based on SOS alert data.';
    const response = await callGroqAPI(prompt, systemMessage);
    return response;
  } catch (error) {
    console.error('❌ Error generating incident report:', error);
    throw error;
  }
};

/**
 * Generate safety recommendations for users
 */
export const generateSafetyRecommendations = async (userProfile, locationData) => {
  try {
    const prompt = `Based on the following user profile and location data, provide personalized safety recommendations:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Location Data:
${JSON.stringify(locationData, null, 2)}

Provide:
1. Personalized safety tips
2. Location-specific recommendations
3. Emergency preparedness advice
4. App feature suggestions

Keep recommendations practical, actionable, and culturally sensitive for women in India.`;

    const systemMessage = 'You are a women\'s safety expert providing personalized safety recommendations. Focus on practical, culturally sensitive advice for women in India.';
    const response = await callGroqAPI(prompt, systemMessage);
    return response;
  } catch (error) {
    console.error('❌ Error generating safety recommendations:', error);
    throw error;
  }
};

/**
 * Call Groq API
 * Groq uses OpenAI-compatible API format with fast inference
 */
const callGroqAPI = async (prompt, systemMessage = 'You are an AI assistant for RakshaDrishti, a women\'s safety application.') => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key is not configured. Please add GROQ_API_KEY to your .env file.');
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Groq's fast Llama 3.3 70B model
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return text;
  } catch (error) {
    console.error('❌ Groq API call failed:', error);
    throw error;
  }
};

/**
 * Parse AI response (try to extract JSON if present)
 */
const parseAIResponse = (response) => {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { text: response };
  } catch (error) {
    return { text: response };
  }
};

