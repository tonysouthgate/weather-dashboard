// netlify/functions/davis-weather.js
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    console.log('Davis weather function called');
    
    // Davis API credentials
    const API_KEY = 'bvgu5bfmm99lvfrqhlffy3l8pmpbq26v';
    const API_SECRET = 'lhcttqhmgxipv3zy8xgupadhbgowwcs1';
    const STATION_ID = '92193';

    // WeatherLink v2 API uses simple authentication with API key and secret
    const apiUrl = `https://api.weatherlink.com/v2/current/${STATION_ID}?api-key=${API_KEY}`;
    console.log('Making request to:', apiUrl);
    
    const requestHeaders = {
      'X-Api-Secret': API_SECRET,
      'Accept': 'application/json',
      'User-Agent': 'Weather-Dashboard/1.0'
    };
    
    console.log('Request headers:', { ...requestHeaders, 'X-Api-Secret': '***hidden***' });
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders
    });

    console.log('WeatherLink API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WeatherLink API error response:', errorText);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: `WeatherLink API Error: ${response.status} - ${response.statusText}`,
          details: errorText,
          timestamp: new Date().toISOString()
        }),
      };
    }

    const data = await response.json();
    console.log('WeatherLink API success, data keys:', Object.keys(data));
    console.log('Number of sensors:', data.sensors ? data.sensors.length : 0);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        debug: {
          stationId: STATION_ID,
          apiKeyPrefix: API_KEY.substring(0, 8) + '...',
          sensorCount: data.sensors ? data.sensors.length : 0
        }
      }),
    };

  } catch (error) {
    console.error('Davis API Error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        debug: {
          errorType: error.constructor.name,
          errorMessage: error.message
        }
      }),
    };
  }
};
