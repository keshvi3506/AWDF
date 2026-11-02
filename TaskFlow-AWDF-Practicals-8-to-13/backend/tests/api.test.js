import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('TaskFlow API', () => {
  it('GET /api/health returns status 200 and service details', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('TaskFlow AI API');
  });

  it('GET /api/tasks returns status 200 and an array', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(['HIT', 'MISS']).toContain(response.headers['x-cache']);
  });

  it('exposes cache statistics for Practical 9', async () => {
    const response = await request(app).get('/api/debug/cache');
    expect(response.status).toBe(200);
    expect(typeof response.body.hits).toBe('number');
    expect(typeof response.body.misses).toBe('number');
    expect(response.body.ttlSeconds).toBe(60);
  });
});
