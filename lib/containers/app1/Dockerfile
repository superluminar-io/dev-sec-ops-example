# Use the official Node.js 20 image based on Alpine Linux for a lightweight base
FROM node:20-alpine

# Update and upgrade the Alpine packages to ensure all dependencies are up-to-date
RUN apk update && apk upgrade

# Set the working directory inside the container to /usr/src/app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies using npm; `ci` ensures the exact versions from package-lock.json
RUN npm ci --only=production

# Copy the rest of the application files to the working directory
COPY . .

# Expose port 3000 to allow access to the application
EXPOSE 3000

# Switch to a non-root user for better security; the 'node' user is predefined in the Node.js base image
USER node

# Command to run the application; uses 'node' to start the main file (index.js)
CMD [ "node", "index.js" ]