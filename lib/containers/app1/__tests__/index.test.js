const request = require('supertest')
const app = require('../index')

describe('Express App', () => {
  let server

  beforeAll(() => {
    server = app.listen()
  })

  afterAll((done) => {
    server.close(done)
  })

  it('GET / should return "Hello from Service 1!"', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello from Service 1!')
  })

  it('GET /health should return a healthy status', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'healthy' })
  })
})
