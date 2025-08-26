FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./

RUN npm install
RUN npm install redis
COPY ./.env.development ./dist/.env.delelopment

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]