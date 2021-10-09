FROM node:lts

WORKDIR /action

RUN npm i -g npm

COPY ./ .

RUN npm i

ENTRYPOINT [ "node", "/action/main.js" ]
