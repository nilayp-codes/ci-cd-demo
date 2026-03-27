const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CI/CD Demo App', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/info', (req, res) => {
  res.status(200).json({ app: 'ci-cd-demo', node: process.version, uptime: process.uptime() });
});

module.exports = app;
