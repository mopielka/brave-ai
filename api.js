require('dotenv').config();

const express = require('express')
const { OpenAI } = require('openai')
const { markdown } = require("markdown");
const { getJson } = require("serpapi");

const app = express();

app.use(express.json()); // Middleware do parsowania JSON

app.post('/google', async (req, res) => {
  const { question } = req.body;
  const completionPrompt = await new OpenAI().chat.completions.create({
    messages: [
      { role: "system", content: 'Convert user prompt into a fine Google search prompt' },
      { role: "user", content: question },
    ],
    model: 'gpt-4',
  })
  const googleQuestion = completionPrompt.choices[0].message.content

  const { link } = (await getJson({
    engine: "google",
    q: googleQuestion,
    api_key: process.env.SERP_API_KEY
  })).organic_results[0]

  res.json({ reply: link });
});

app.post('/md2html', async (req, res) => {
  const { question } = req.body;

  res.json({ reply: markdown.toHTML(question) });
});

app.post('/ownapi', async (req, res) => {
  const { question } = req.body;

  const completion = await new OpenAI().chat.completions.create({
    messages: [
      { role: "system", content: 'Briefly respond to general knowledge questions.' },
      { role: "user", content: question },
    ],
    model: 'gpt-4',
  })
  const reply = completion.choices[0].message.content

  res.json({ reply });
});

const history = []

app.post('/ownapipro', async (req, res) => {
  const { question } = req.body;
  history.push({ role: "user", content: question });

  const completion = await new OpenAI().chat.completions.create({
    messages: [
      { role: "system", content: 'Just talk to the user as a simple AI assistant.' },
      ...history
    ],
    model: 'gpt-4',
  })
  const reply = completion.choices[0].message.content

  history.push({ role: "assistant", content: reply })

  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
