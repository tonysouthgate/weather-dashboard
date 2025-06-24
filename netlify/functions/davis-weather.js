// netlify/functions/davis-weather.js
const crypto = require('crypto');

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

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    console.log('Generated timestamp:', timestamp);
    
    // Create signature
    const url = `/v2/current/${STATION_ID}`;
    const method = 'GET';
    const data = method + url + timestamp;
    
    console.log('Signature data string:', data);
    
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(data)
      .digest('hex');
    
    console.log('Generated signature:', signature);

    // Make API call to WeatherLink
    const apiUrl = `https://api.weatherlink.com/v2/current/${STATION_ID}`;
    console.log('Making request to:', apiUrl);
    
    const requestHeaders = {
      'X-Api-Key': API_KEY,
      'X-Timestamp': timestamp.toString(),
      'X-Api-Signature': signature,
      'Accept': 'application/json',
      'User-Agent': 'Weather-Dashboard/1.0'
    };
    
    console.log('Request headers:', requestHeaders);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders
    });

    console.log('WeatherLink API response status:', response.status);
    console.log('WeatherLink API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WeatherLink API error response:', errorText);
      throw new Error(`WeatherLink API Error: ${response.status} - ${response.statusText}. Response: ${errorText}`);
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
          timestampUsed: timestamp,
          signatureGenerated: signature
        }
      }),
    };

  } catch (error) {
    console.error('Davis API Error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 200, // Return 200 to avoid gateway errors
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
          errorStack: error.stack
        }
      }),
    };
  }
};
