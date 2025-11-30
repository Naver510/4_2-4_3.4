'use strict';

const express = require('express');
const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});