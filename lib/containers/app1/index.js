const express = require('express') // Import the Express framework for building web servers
const app = express() // Initialize an Express application instance
const port = process.env.PORT || 3000 // Define the port number the server will listen on

// Define the root route that responds with a simple message
app.get('/', (req, res) => {
  res.send('Hello from Service 1!') // Sends a basic response to requests at the root URL
})

// Define a health check endpoint commonly used for monitoring and load balancer checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' }) // Responds with a 200 status code indicating the service is healthy
})

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Service 1 listening at http://localhost:${port}`) // Log the service URL for easy access during development
  })
}

// Example of code that would trigger the ESLint rule "security/detect-object-injection"
// This rule flags potential vulnerabilities when object properties are set using user input, which could be exploited for injection attacks
// const userInput = 'key' // Simulated user input; using dynamic keys on objects can be risky
// const obj = {} // Initialize an empty object
// obj[userInput] = 'value' // Dynamic property assignment, triggers "detect-object-injection" warning in ESLint

module.exports = app
