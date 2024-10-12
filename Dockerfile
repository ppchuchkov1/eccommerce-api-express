# Използване на Alpine версия на Node.js
FROM node:20.17.0-alpine

# Настройване на работната директория
WORKDIR /usr/src/app

# Копиране на package.json и package-lock.json
COPY package*.json ./

# Инсталиране на зависимостите, включително devDependencies
RUN npm install

# Копиране на останалата част от приложението
COPY . .

# Излагане на порта, на който работи приложението
EXPOSE 5001

# Команда за стартиране на приложението
CMD ["npm", "run", "start"] 