const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const { AzureOpenAI } = require("openai");

// App constants
const port = process.env.PORT || 8080;
const apiPrefix = '/api';

// Store data in-memory
const db = {
    test: {
        user: 'test',
        currency: '$',
        description: `Test account`,
        balance: 75,
        transactions: [
            { id: '1', date: '2020-10-01', object: 'Pocket money', amount: 50 },
        ],
    }
};

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// --- KONFIGURACE AI ---
const endpoint = "https://koutestai.openai.azure.com/";
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = "koutestai"; 

const client = new AzureOpenAI({ 
    endpoint, 
    apiKey, 
    deployment, 
    apiVersion: "2024-05-01-preview" 
});

// --- ROUTES ---

// 1. HLAVNÍ STRÁNKA (Chatovací rozhraní)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fabrikam Bank AI</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 50px; background: #f4f4f9; }
                .container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: inline-block; }
                input { padding: 12px; width: 300px; border: 1px solid #ccc; border-radius: 5px; }
                button { padding: 12px 20px; cursor: pointer; background: #0078d4; color: white; border: none; border-radius: 5px; font-weight: bold; }
                button:hover { background: #005a9e; }
                #result { margin-top: 25px; padding: 15px; border-top: 1px solid #eee; min-width: 300px; color: #333; line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏦 Fabrikam Bank AI</h1>
                <p>Zeptej se našeho bankovního asistenta:</p>
                <input type="text" id="question" placeholder="Jaký mám zůstatek?">
                <button onclick="ask()">Odeslat</button>
                <div id="result">Zde se objeví odpověď...</div>
            </div>

            <script>
                async function ask() {
                    const q = document.getElementById('question').value;
                    const resDiv = document.getElementById('result');
                    if(!q) return;
                    
                    resDiv.innerText = '🤖 Přemýšlím...';
                    
                    try {
                        const response = await fetch('/ask', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ prompt: q })
                        });
                        const data = await response.json();
                        resDiv.innerText = data.answer;
                    } catch (e) {
                        resDiv.innerText = '❌ Chyba při spojení s AI.';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 2. AI ENDPOINT
app.post('/ask', async (req, res) => {
    try {
        const result = await client.chat.completions.create({
            messages: [
                { role: "system", content: "Jsi přátelský asistent banky Fabrikam. Odpovídej stručně a jasně." },
                { role: "user", content: req.body.prompt }
            ],
            max_tokens: 150,
        });
        res.json({ answer: result.choices[0].message.content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ answer: "Chyba AI: " + err.message });
    }
});

// 3. BANKOVNÍ API (přes router)
const router = express.Router();

router.get('/', (req, res) => res.send("Fabrikam Bank API v1.0"));

router.get('/accounts/:user', (req, res) => {
    const account = db[req.params.user];
    if (!account) return res.status(404).json({ error: 'User does not exist' });
    return res.json(account);
});

// Přidání prefixu /api pro všechny router cesty
app.use(apiPrefix, router);

// START SERVERU
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
