FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Собираем приложение
RUN npm run build

# Устанавливаем serve для статических файлов
RUN npm install -g serve

EXPOSE 3000

# Запускаем приложение
CMD ["serve", "-s", "build", "-l", "3000"]