'use strict';

const express = require('express');
const app = express();
app.use(express.json());

let categories = ['funnyJoke', 'lameJoke'];

let funnyJoke = [
  {
    'joke': 'Dlaczego komputer poszedł do lekarza?',
    'response': 'Bo złapał wirusa!'
  },
  {
    'joke': 'Dlaczego komputer nie może być głodny?',
    'response': 'Bo ma pełen dysk!'
  },
  {
    'joke': 'Co mówi jeden bit do drugiego?',
    'response': '„Trzymaj się, zaraz się przestawiamy!"'
  }
];

let lameJoke = [
  {
    'joke': 'Dlaczego programiści preferują noc?',
    'response': 'Bo w nocy jest mniej bugów do łapania!'
  },
  {
    'joke': 'Jak nazywa się bardzo szybki programista?',
    'response': 'Błyskawiczny kompilator!'
  }
];

app.get('/jokebook/categories', (req, res) => {
  res.json(categories);
});

app.get('/jokebook/joke/:category', (req, res) => {
  const category = req.params.category;
  
  if (!categories.includes(category)) {
    return res.json({ 'error': `no jokes for category ${category}` });
  }
  
  let jokes;
  if (category === 'funnyJoke') {
    jokes = funnyJoke;
  } else if (category === 'lameJoke') {
    jokes = lameJoke;
  }
  
  const randomIndex = Math.floor(Math.random() * jokes.length);
  const randomJoke = jokes[randomIndex];
  
  res.json(randomJoke);
});

app.post('/jokebook/joke/:category', (req, res) => {
  const category = req.params.category;

  if (!categories.includes(category)) {
    return res.json({ 'error': `no jokes for category ${category}` });
  }

  const { joke, response: resp } = req.body;
  if (!joke || !resp) {
    return res.status(400).json({ error: 'request must include joke and response' });
  }

  const newJoke = { joke, response: resp };

  if (category === 'funnyJoke') {
    funnyJoke.push(newJoke);
  } else if (category === 'lameJoke') {
    lameJoke.push(newJoke);
  }

  res.json({ success: `joke added to ${category}`, joke: newJoke });
});

app.get('/jokebook/stats', (req, res) => {
  const stats = {
    funnyJoke: funnyJoke.length,
    lameJoke: lameJoke.length
  };

  res.json(stats);
});

app.get('/jokebook/search', (req, res) => {
  const word = req.query.word;

  if (!word || typeof word !== 'string' || word.trim() === '') {
    return res.json([]);
  }

  const q = word.trim();
  const re = new RegExp(q, 'i');
  const results = [];

  funnyJoke.forEach(j => {
    if (re.test(j.joke) || re.test(j.response)) {
      results.push(Object.assign({ category: 'funnyJoke' }, j));
    }
  });

  lameJoke.forEach(j => {
    if (re.test(j.joke) || re.test(j.response)) {
      results.push(Object.assign({ category: 'lameJoke' }, j));
    }
  });

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});