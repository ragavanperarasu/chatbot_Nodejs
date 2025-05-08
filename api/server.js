require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const stringSimilarity = require('string-similarity');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;
;
const client = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db('chatbotDB');
  console.log('✅ Connected to MongoDB');
}
connectDB();


const OPENROUTER_API_KEY = process.env.API; 

app.get('/', async (req, res) =>{
  res.send("This is Chatbot Server");
})

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  let fullResponse = '';


  const allProducts = await db.collection('products').find().toArray();
  const threshold = 0.3;

  const products = allProducts.filter(p => {
    const combined = (p.product_name + ' ' + (p.category || '')).toLowerCase();
    const score = stringSimilarity.compareTwoStrings(prompt.toLowerCase(), combined);
    return score >= threshold;
  });

  let context = '';
  if (products.length > 0) {
    context = products.map((p, i) =>
      `Product ${i + 1}:\nName: ${p.product_name}\nPrice: ₹${p.price}\nMade In: ${p.made_in}\nSpec: ${p.spec}`
    ).join('\n\n');
  } else {
    context = 'No product data matched.';
  }


  const finalPrompt = `You are a helpful shopping assistant for my shop. My shop name is Quick Mart. Use the following product data to answer the user's question. If products are available, give the product details in a simple table or list format. if user say hai, hello some other say you say welcome message that time don't say product details.\n\n${context}\n\nUser: ${prompt}\n\nAssistant:`;


  try {
    const openRouterRes = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "mistralai/mistral-7b-instruct:free",
        max_tokens: 256,
        messages: [
          { role: "user", content: finalPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yourdomain.com',    
          'X-Title': 'Quick Mart Assistant'              
        }
      }
    );


    fullResponse = openRouterRes.data.choices?.[0]?.message?.content || 'Sorry, no response received.';


    res.send(fullResponse);

 
    await db.collection('chats').insertOne({
      prompt,
      response: fullResponse,
      timestamp: new Date(),
    });

  } catch (err) {
    console.error('❌ OpenRouter API Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate response from OpenRouter.' });
  }
});

// Start the server
//app.listen(3001, () => {
//  console.log('🚀 Server Running on http://localhost:3001');
//});

module.exports = app;
