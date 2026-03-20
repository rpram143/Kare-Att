const express = require('express');
const axios   = require('axios');
const cors    = require('cors');
const fs      = require('fs');

const app = express();
const PORT = process.env.PORT || 8010;
const TARGET = 'https://sis.kalasalingam.ac.in';

app.use(cors({ 
  origin: '*', 
  credentials: true,
  exposedHeaders: ['X-Cookie-Jar']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check for Render
app.get('/', (req, res) => res.send('KARE Proxy is Live'));

// Helper to parse/stringify cookie jar from header
function getJar(req) {
  try {
    const raw = req.headers['x-cookie-jar'];
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function jarToString(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

function updateJar(jar, setCookies) {
  if (!setCookies) return;
  setCookies.forEach(raw => {
    const part = raw.split(';')[0].trim();
    const eq = part.indexOf('=');
    if (eq < 0) return;
    jar[part.substring(0, eq).trim()] = part.substring(eq + 1).trim();
  });
}

app.use(async (req, res) => {
  const path = req.url;
  if (path === '/') return; // Handled above
  const jar = getJar(req);
  
  console.log(`[PROXY] ${req.method} ${path}`);

  try {
    // 1. Special Handling for Login Dance
    if (req.method === 'POST' && path === '/login') {
      console.log('  Handling Login Dance...');
      
      // Step A: GET /login to get fresh XSRF token
      const getResp = await axios.get(`${TARGET}/login`, {
        headers: { 'User-Agent': req.headers['user-agent'] }
      });
      updateJar(jar, getResp.headers['set-cookie']);

      const xsrfToken = jar['XSRF-TOKEN'] ? decodeURIComponent(jar['XSRF-TOKEN']) : '';
      
      // Step B: Actual POST /login
      const loginResp = await axios.post(`${TARGET}/login`, req.body, {
        headers: {
          'Cookie': jarToString(jar),
          'X-XSRF-TOKEN': xsrfToken,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': req.headers['user-agent'],
          'Referer': `${TARGET}/login`
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      updateJar(jar, loginResp.headers['set-cookie']);

      // Step C: If redirect, follow it internally to get user data (name)
      let finalData = loginResp.data;
      if (loginResp.status === 302 && loginResp.headers['location']) {
        const homeResp = await axios.get(loginResp.headers['location'], {
          headers: { 'Cookie': jarToString(jar), 'User-Agent': req.headers['user-agent'] }
        });
        updateJar(jar, homeResp.headers['set-cookie']);
        finalData = homeResp.data;
      }

      res.set('X-Cookie-Jar', JSON.stringify(jar));
      return res.send(finalData);
    }

    // 2. Standard Proxy for all other requests
    const config = {
      method: req.method,
      url: `${TARGET}${path}`,
      headers: {
        'Cookie': jarToString(jar),
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': req.headers['accept'] || '*/*',
      },
      data: req.method !== 'GET' ? req.body : undefined,
      validateStatus: (status) => true
    };

    const resp = await axios(config);
    updateJar(jar, resp.headers['set-cookie']);
    
    console.log(`  Response: ${resp.status}`);
    if (typeof resp.data === 'string') {
      console.log(`  Body length: ${resp.data.length}`);
    } else {
      console.log(`  Body: JSON object with keys: ${Object.keys(resp.data || {}).join(', ')}`);
    }
    
    res.set('X-Cookie-Jar', JSON.stringify(jar));
    res.status(resp.status).send(resp.data);

  } catch (err) {
    console.error('Proxy Error:', err.message);
    res.status(500).send({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Production Proxy running on port ${PORT}`);
});
