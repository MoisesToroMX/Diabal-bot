FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY *.js ./

USER app

EXPOSE 3001

CMD ["node", "index.js"]
