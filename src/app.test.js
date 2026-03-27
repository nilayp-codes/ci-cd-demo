const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
  it('returns 200 and correct message and version', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'CI/CD Demo App', version: '1.0.0' });
  });
});

describe('GET /health', () => {
  it('returns 200 and status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('GET /info', () => {
  it('returns 200 and has app, node, uptime fields', async () => {
    const res = await request(app).get('/info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app');
    expect(res.body).toHaveProperty('node');
    expect(res.body).toHaveProperty('uptime');
  });
});
