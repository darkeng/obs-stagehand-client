FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Vite dev server with host flag for Docker port mapping
CMD ["npm", "run", "dev", "--", "--host"]
