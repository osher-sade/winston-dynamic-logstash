# winston-dynamic-logstash-transport
Winston's logstash transport with dynamic protocol support, written in Typescript.

You can use both `udp` and `tcp` as protocols, or you can use `dynamic` protocol, 
so the library will decide what protocol it should use, based on the message size.

Rewrite from https://github.com/HuskyMoonMoon/winston-logstash-ts

## Dependencies
- winston: "^3.3.3",
- winston-transport: "^4.4.0"

## Installation
- Install to your project using `npm install winston-dynamic-logstash-transport` or `yarn add winston-dynamic-logstash-transport`

## Usage

```typescript
import {LogstashTransport} from "winston-dynamic-logstash-transport";

const logstashTransport = new LogstashTransport({
    host: "8.8.8.8",
    port: 3000,
    protocol: "dynamic"
});
```
