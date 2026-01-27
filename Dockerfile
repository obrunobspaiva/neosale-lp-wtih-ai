# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build args for environment variables (passed at build time)
ARG VITE_OPENAI_API_KEY
ARG VITE_OPENAI_MODEL
ARG VITE_API_ENDPOINT
ARG VITE_CLIENTE_ID

# Set environment variables for build
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_OPENAI_MODEL=$VITE_OPENAI_MODEL
ENV VITE_API_ENDPOINT=$VITE_API_ENDPOINT
ENV VITE_CLIENTE_ID=$VITE_CLIENTE_ID

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
