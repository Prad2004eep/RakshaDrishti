import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Analyze safety risk based on location, time, and context
 * @param {object} context - Context object with location, time, surroundings
 * @returns {Promise<object>} - Safety analysis with risk level and recommendations
 */
export const analyzeSafetyRisk = async (context) => {
  try {
    const { location, time, surroundings, userHistory } = context;

    const prompt = `You are a women's safety AI assistant. Analyze the following situation and provide a safety risk assessment:

Location: ${location.address || `${location.latitude}, ${location.longitude}`}
Time: ${time || new Date().toLocaleString()}
Surroundings: ${surroundings || 'Unknown'}
User History: ${userHistory || 'No previous incidents'}

Provide:
1. Risk Level (Low/Medium/High/Critical)
2. Safety Score (0-100)
3. Key Risk Factors
4. Safety Recommendations
5. Nearby Safe Locations (if applicable)

Format your response as JSON with these fields: riskLevel, safetyScore, riskFactors (array), recommendations (array), safePlaces (array).`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI safety assistant specialized in women\'s safety analysis. Provide accurate, helpful, and actionable safety advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      const analysis = JSON.parse(aiResponse);
      console.log('✅ AI Safety Analysis:', analysis);
      return analysis;
    } catch (parseError) {
      // If not JSON, return structured response
      return {
        riskLevel: 'Medium',
        safetyScore: 50,
        riskFactors: ['Unable to parse AI response'],
        recommendations: [aiResponse],
        safePlaces: []
      };
    }

  } catch (error) {
    console.error('❌ Error analyzing safety risk:', error.message);
    throw error;
  }
};

/**
 * Get AI-powered safety tips based on user profile and location
 * @param {object} userProfile - User profile with preferences
 * @param {object} location - Current location
 * @returns {Promise<Array>} - Array of personalized safety tips
 */
export const getPersonalizedSafetyTips = async (userProfile, location) => {
  try {
    const prompt = `Provide 5 personalized safety tips for a woman in the following context:

Name: ${userProfile.name}
Age: ${userProfile.age || 'Not specified'}
Location: ${location.address || 'Current location'}
Time: ${new Date().toLocaleTimeString()}

Focus on practical, actionable advice for staying safe in this specific context.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a women\'s safety expert. Provide practical, culturally sensitive safety tips for women in India.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const tips = response.data.choices[0].message.content
      .split('\n')
      .filter(tip => tip.trim().length > 0)
      .map(tip => tip.replace(/^\d+\.\s*/, '').trim());

    console.log('✅ AI Safety Tips generated:', tips.length);
    return tips;

  } catch (error) {
    console.error('❌ Error getting safety tips:', error.message);
    throw error;
  }
};

/**
 * Analyze route safety using AI
 * @param {object} route - Route object with origin, destination, waypoints
 * @returns {Promise<object>} - Route safety analysis
 */
export const analyzeRouteSafety = async (route) => {
  try {
    const { origin, destination, waypoints, timeOfDay } = route;

    const prompt = `Analyze the safety of this route for a woman traveling:

From: ${origin.address || `${origin.latitude}, ${origin.longitude}`}
To: ${destination.address || `${destination.latitude}, ${destination.longitude}`}
Time: ${timeOfDay || new Date().toLocaleTimeString()}
Waypoints: ${waypoints?.length || 0}

Provide:
1. Overall Safety Rating (1-10)
2. Safe Areas along route
3. Areas to avoid
4. Best time to travel
5. Alternative safer routes (if applicable)

Format as JSON with fields: safetyRating, safeAreas (array), areasToAvoid (array), bestTime, alternatives (array).`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a route safety analyst specializing in women\'s safety in urban areas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    try {
      const analysis = JSON.parse(aiResponse);
      console.log('✅ AI Route Safety Analysis:', analysis);
      return analysis;
    } catch (parseError) {
      return {
        safetyRating: 5,
        safeAreas: [],
        areasToAvoid: [],
        bestTime: 'Daytime (9 AM - 6 PM)',
        alternatives: []
      };
    }

  } catch (error) {
    console.error('❌ Error analyzing route safety:', error.message);
    throw error;
  }
};

/**
 * Generate emergency response suggestions using AI
 * @param {string} situation - Description of emergency situation
 * @returns {Promise<object>} - Emergency response suggestions
 */
export const getEmergencyResponseSuggestions = async (situation) => {
  try {
    const prompt = `A woman is in the following emergency situation:

${situation}

Provide immediate action steps she should take. Be specific, practical, and prioritize her safety.

Format as JSON with fields: immediateActions (array), contactsToAlert (array), safetyTips (array), emergencyNumbers (array).`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an emergency response advisor for women\'s safety. Provide clear, actionable steps for emergency situations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    try {
      const suggestions = JSON.parse(aiResponse);
      console.log('✅ AI Emergency Response Suggestions:', suggestions);
      return suggestions;
    } catch (parseError) {
      return {
        immediateActions: [aiResponse],
        contactsToAlert: ['Trusted contacts', 'Police (100)', 'Women Helpline (1091)'],
        safetyTips: ['Stay calm', 'Move to a safe location', 'Call for help'],
        emergencyNumbers: ['100', '112', '1091']
      };
    }

  } catch (error) {
    console.error('❌ Error getting emergency response suggestions:', error.message);
    throw error;
  }
};

/**
 * Check if OpenAI API is configured
 * @returns {boolean} - True if API key is configured
 */
export const isOpenAIConfigured = () => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
};

export default {
  analyzeSafetyRisk,
  getPersonalizedSafetyTips,
  analyzeRouteSafety,
  getEmergencyResponseSuggestions,
  isOpenAIConfigured
};

