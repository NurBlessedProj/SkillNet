FROM node:20.11-alpine3.18 AS builder

# Set the working directory
WORKDIR /app

COPY package*.json ./

# Install all the dependencies
RUN npm install --force

COPY . .
# copy environment file
#COPY .env.build .env
# Generate the build of the application
RUN npm run build

FROM node:20.11-alpine3.18  AS production
WORKDIR /app
COPY --from=builder /app ./
#COPY .env.build .env
ENV NODE_ENV=production
CMD ["npm" ,"start"]
EXPOSE 3000

