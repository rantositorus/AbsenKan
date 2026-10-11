# AbsenKan backend — build & runtime (monorepo: npm ci dari root)
FROM node:20-slim

WORKDIR /app

# Salin seluruh repo (node_modules/dist di-exclude oleh .dockerignore)
# JANGAN set NODE_ENV=production di sini: npm ci akan meng-omit devDependencies (nest/typescript).
COPY . .

RUN npm ci \
  && npm run build --workspace backend \
  && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
