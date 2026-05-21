# Stage 1: Build the Angular app
FROM node:20-alpine AS build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application in production mode
RUN npm run build -- --configuration production

# ADD THIS LINE TEMPORARILY TO SEE THE FOLDERS
# RUN ls -R dist/

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# 1. Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy your custom configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy the build output to Nginx's default public folder
COPY --from=build-stage /app/dist/fuse/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
