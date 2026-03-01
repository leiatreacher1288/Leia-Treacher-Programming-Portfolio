FROM node:24-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy entire frontend codebase
COPY . ./

# Expose Vite dev port
EXPOSE 5173

CMD ["npm", "run", "dev"]