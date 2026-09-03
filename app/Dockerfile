# FamilyOS web app — Vite build + zero-dependency Node proxy.
# Fulfils the property-walker chart contract: PORT/UPSTREAM_URL env,
# GET / -> 200, container port 5055.

FROM node:24-alpine AS build
WORKDIR /build
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY server/ ./server/
COPY --from=build /build/dist ./client/
ENV PORT=5055
EXPOSE 5055
CMD ["node", "server/server.js"]
