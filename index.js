// ***************************************************************************
// Bank API code from Web Dev For Beginners project
// https://github.com/microsoft/Web-Dev-For-Beginners/tree/main/7-bank-project/api
// ***************************************************************************

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const crypto = require('crypto');
const { AzureOpenAI } = require("openai");
const app = express();
const pkg = require('./package.json');


// App constants
const port = process.env.PORT || 3000;
const apiPrefix = '/api';

// Store data in-memory, not suited for production use!
const db = {
    test: {
      user: 'test',
      currency: '$',
      description: `Test account`,
      balance: 75,
      transactions: [
        { id: '1', date: '2020-10-01', object: 'Pocket money', amount: 50 },
        { id: '2', date: '2020-10-03', object: 'Book', amount: -10 },
        { id: '3', date: '2020-10-04', object: 'Sandwich', amount: -5 }
      ],
    },
    jondoe: {
        user: 'jondoe',
        currency: '$',
        description: `Second test account`,
        balance: 150,
        transactions: [
          { id: '1', date: '2022-10-01', object: 'Gum', amount: -2 },
          { id: '2', date: '2022-10-03', object: 'Book', amount: -10 },
          { id: '3', date: '2022-10-04', object: 'Restaurant', amount: -45 }
        ],
      }
  
  };
  
// Create the Express app & setup middlewares
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: /http:\/\/(127(\.\d){3}|localhost)/}));
app.options('*', cors());

// ***************************************************************************

// Configure routes
const router = express.Router();

// Hello World for index page
app.get('/', function (req, res) {
    return res.send("Hello World!");
})

app.get('/api', function (req, res) {
    return res.send("Fabrikam Bank API");
})
  
// ----------------------------------------------
  // Create an account
router.post('/accounts', (req, res) => {
    // Check mandatory request parameters
    if (!req.body.user || !req.body.currency) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    // Check if account already exists
    if (db[req.body.user]) {
      return res.status(409).json({ error: 'User already exists' });
    }
  
    // Convert balance to number if needed
    let balance = req.body.balance;
    if (balance && typeof balance !== 'number') {
      balance = parseFloat(balance);
      if (isNaN(balance)) {
        return res.status(400).json({ error: 'Balance must be a number' });  
      }
    }
  
    // Create account
    const account = {
      user: req.body.user,
      currency: req.body.currency,
      description: req.body.description || `${req.body.user}'s budget`,
      balance: balance || 0,
      transactions: [],
    };
    db[req.body.user] = account;
  
    return res.status(201).json(account);
  });
  
// ----------------------------------------------

// Get all data for the specified account
router.get('/accounts/:user', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    return res.json(account);
  });
  
  // ----------------------------------------------
  
// Remove specified account
router.delete('/accounts/:user', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    // Removed account
    delete db[req.params.user];
  
    res.sendStatus(204);
  });


  const { AzureOpenAI } = require("openai");

// Nastavení přístupu - v produkci doporučuji použít Environment Variables v Azure!
const endpoint = "https://koutestai.openai.azure.com/";
const apiKey = "CX2UVMCooNIkf9ujHPLqy427QC7z0C0u27kZOLBkHsNHrefDtaN4JQQJ99CBACPV0roXJ3w3AAABACOGwxWv";
const deployment = "kouTestAI"; 

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion: "2024-05-01-preview" });

async function getAIResponse(userPrompt) {
  const result = await client.chat.completions.create({
    messages: [
        { role: "system", content: "Jsi užitečný asistent běžící na Azure Web App." },
        { role: "user", content: userPrompt }
    ],
    max_tokens: 800,
  });

  return result.choices[0].message.content;
}

// 1. Endpoint, který vrací HTML stránku (to, co uvidíš v prohlížeči)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Moje Azure AI App</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; }
                input { padding: 10px; width: 300px; }
                button { padding: 10px; cursor: pointer; }
                #result { margin-top: 20px; font-weight: bold; color: #0078d4; }
            </style>
        </head>
        <body>
            <h1>Ahoj! Zeptej se mé AI:</h1>
            <input type="text" id="question" placeholder="Napiš něco...">
            <button onclick="ask()">Odeslat</button>
            <div id="result"></div>

            <script>
                async function ask() {
                    const q = document.getElementById('question').value;
                    const resDiv = document.getElementById('result');
                    resDiv.innerText = 'Přemýšlím...';
                    
                    const response = await fetch('/ask', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ prompt: q })
                    });
                    const data = await response.json();
                    resDiv.innerText = data.answer;
                }
            </script>
        </body>
        </html>
    `);
});

// 2. Endpoint, který komunikuje s Azure OpenAI
app.post('/ask', async (req, res) => {
    try {
        const result = await client.chat.completions.create({
            messages: [
                { role: "system", content: "Jsi vtipný asistent běžící na Azure." },
                { role: "user", content: req.body.prompt }
            ],
            max_tokens: 100,
        });
        res.json({ answer: result.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ answer: "Chyba: " + err.message });
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
  
  // ----------------------------------------------
  
  // Add a transaction to a specific account
  router.post('/accounts/:user/transactions', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    // Check mandatory requests parameters
    if (!req.body.date || !req.body.object || !req.body.amount) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    // Convert amount to number if needed
    let amount = req.body.amount;
    if (amount && typeof amount !== 'number') {
      amount = parseFloat(amount);
    }
  
    // Check that amount is a valid number
    if (amount && isNaN(amount)) {
      return res.status(400).json({ error: 'Amount must be a number' });
    }
  
    // Generates an ID for the transaction
    const id = crypto
      .createHash('md5')
      .update(req.body.date + req.body.object + req.body.amount)
      .digest('hex');
  
    // Check that transaction does not already exist
    if (account.transactions.some((transaction) => transaction.id === id)) {
      return res.status(409).json({ error: 'Transaction already exists' });
    }
  
    // Add transaction
    const transaction = {
      id,
      date: req.body.date,
      object: req.body.object,
      amount,
    };
    account.transactions.push(transaction);
  
    // Update balance
    account.balance += transaction.amount;
  
    return res.status(201).json(transaction);
  });
  
  // ----------------------------------------------
  
  // Remove specified transaction from account
  router.delete('/accounts/:user/transactions/:id', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    const transactionIndex = account.transactions.findIndex(
      (transaction) => transaction.id === req.params.id
    );
  
    // Check if transaction exists
    if (transactionIndex === -1) {
      return res.status(404).json({ error: 'Transaction does not exist' });
    }
  
    // Remove transaction
    account.transactions.splice(transactionIndex, 1);
  
    res.sendStatus(204);
  });
  
// ***************************************************************************

// Add 'api` prefix to all routes
app.use(apiPrefix, router);

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
  
