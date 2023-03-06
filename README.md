# Cryptofolio

![Cryptofolio Screenshot](https://raw.githubusercontent.com/wolfderechter/cryptofolio/vanilla-ts/Screenshot.png)

[Cryptofolio](github.com/wolfderechter/cryptofolio) is a self-hosted crypto portfolio tracker. It allows you to manually manage and keep track of transactions and averages.

Cryptofolio is written in Typescript, the charts are built with ChartJS and it uses the Coingecko API to get crypto data.

## Features

The following features are supported:

- Buy/Sell transactions
- Line chart with all asset values and net invested
- Pie charts based on **total invested** and **current value**
- Tracking ethereum staking rewards of LSDs like rETH/wstETH
    - Displays an estimated **total rewards** and **daily rewards**
    - If you hover on **total rewards**, the value will increment a tiny bit every second with estimated rewards
- Import/export your data

## Getting started

To get started you can clone the repository and run:

- `pnpm run build`
- navigate to the `dist` folder and run `pnpm run preview` to try out the application.
- The dist folder contains a static site of the project and can be deployed wherever the user wants to.

### Development

To develop further or customise the application you can clone the repository and run:

- `pnpm run dev` for development

## Version 1

Version 1 of Cryptofolio was built with vanilla typescript. The version can be found in the [vanilla-ts](https://github.com/wolfderechter/cryptofolio/tree/vanilla-ts) branch. The application is served in the browser and uses localstorage to store data.
This version is deployed using github pages and can be found [here](https://wolfderechter.github.io/cryptofolio/), you can use utilise the hosted version or you can self-host the application.

## Version 2

Version 2 of Cryptofolio is a desktop app. It can be found in the [desktop-app](https://github.com/wolfderechter/cryptofolio/tree/desktop-app) branch. It uses [wails](wails.io) under the hood. To build the app, simply clone the repository, make sure you have Go and Wails installed and finally execute `wails build`. The executable will be generated in the `build/bin/` folder.

## Limitations

Because it uses the free plan of the Coingecko API, it can exceed the API rate limiting per minute quite easily. In this case you'll have to wait a few minutes and resume. You can ofcourse opt for their paid subscriptions.

## Licensing

The project is licensed under the MIT license, feel free to do with it what you want. If you enjoyed and/or are reusing my work I would like to know!
