ARG APP_NAME="api"
ARG PNPM_HOME="/root/.local/share/pnpm"

FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app

ARG APP_NAME
ARG PNPM_HOME
ENV PNPM_HOME=${PNPM_HOME}
ENV PATH="${PATH}:${PNPM_HOME}"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app

ARG APP_NAME
ARG PNPM_HOME
ENV PNPM_HOME=${PNPM_HOME}
ENV PATH="${PATH}:${PNPM_HOME}"
ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["pnpm", "start"]