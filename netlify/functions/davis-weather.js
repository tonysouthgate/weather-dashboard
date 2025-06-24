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
    // Davis API credentials
    const API_KEY = 'bvgu5bfmm99lvfrqhlffy3l8pmpbq26v';
    const API_SECRET = 'lhcttqhmgxipv3zy8xgupadhbgowwcs1';
    const STATION_ID = '92193';

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create signature
    const url = `/v2/current/${STATION_ID}`;
    const method = 'GET';
    const data = method + url + timestamp;
    
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(data)
      .digest('hex');

    // Make API call to WeatherLink
    const apiUrl = `https://api.weatherlink.com/v2/current/${STATION_ID}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Timestamp': timestamp.toString(),
        'X-Api-Signature': signature,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WeatherLink API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Davis API Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};