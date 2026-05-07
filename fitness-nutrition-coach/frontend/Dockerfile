# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

# Set environment variables
ENV REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_ENV=production

CMD ["serve", "-s", "build", "-l", "3000"]
