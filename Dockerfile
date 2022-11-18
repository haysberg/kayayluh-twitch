FROM node:latest

RUN apt update && apt upgrade

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm update

RUN npm install
ENV NODE_ENV=production

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "index.js" ]