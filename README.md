# Cryptofolio

![Cryptofolio Screenshot](https://raw.githubusercontent.com/wolfderechter/cryptofolio/main/Screenshot.png)

[Cryptofolio](github.com/wolfderechter/cryptofolio) is a local-first crypto portfolio tracker, that can be easily self-hosted. It allows you to manually manage and keep track of transactions and averages.

Cryptofolio is written in Typescript, the charts are built with ChartJS and it uses the Coingecko API to get crypto data.

## Features

The following features are supported:

- Buy/Sell transactions
- Line chart with a `total value`, `net invested` and `all the individual asset values`
- Pie charts based on **total invested** and **current value**
- Import/export your data
    - Supports [delta.app](https://delta.app/) csv imports
- Local-first: meaning the data lives in your browser, instead of in someone elses database.

## Getting started (docker)

- `git clone https://github.com/wolfderechter/cryptofolio && cd cryptofolio` to clone the repository
- `docker compose up -d` to setup the docker stack
- visit [localhost:4450](http://localhost:4450) to access the app

### Development

To develop further or customize the application you can clone the repository and run:

- `bun run dev` for development

## Hosted vs self-hosted

You can use the application either hosted with [cryptofolio.wolfez.dev](https://cryptofolio.wolfez.dev/) or you can self-host it using docker-compose.

## Limitations

Because it uses the free plan of the Coingecko API, it can exceed the API rate limiting per minute quite easily. In this case you'll have to wait a few minutes and resume. You can of course opt for their paid subscriptions.

## Licensing

The project is licensed under the MIT license, feel free to do with it what you want. If you enjoyed and/or are reusing my work I would like to know!
