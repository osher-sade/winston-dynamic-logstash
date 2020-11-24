import * as dgram from "dgram";
import * as net from "net";
import * as Transport from "winston-transport";
import {LogstashOption} from "./logstash-option";

export class LogstashTransport extends Transport {

    protected host: string;
    protected port: number;
    protected protocol: "tcp" | "udp" | "dynamic";

    private maxUDPPacketSize: number = 65535;

    constructor(options: LogstashOption) {
        super(options);
        this.host = options.host;
        this.port = options.port;
        this.silent = options.silent;
        this.protocol = options.protocol || "udp"
    }

    public async connect(protocol: "udp" | "tcp") {
        if (protocol === "udp") {
            return this.connectUDP();
        } else if (protocol === "tcp") {
            return this.connectTCP();
        } else {
            throw new Error("Invalid protocol, only support TCP and UDP.")
        }
    }

    public log(info: any, callback: Function) {
        if (this.silent) {
            return callback(null, true);
        }
        this.send(info[Symbol.for("message")], callback)
            .then((result) => {
                this.emit("logged", result);
            })
            .catch((error) => {
                console.error("An unexpected error occured, transporting to logstash is disabled now.", error.stack);
            })
    }

    public async send(message: any, callback: any) {
        const transformed = JSON.stringify(this.format?.transform(JSON.parse(message)));
        const buf = Buffer.from(transformed);

        if (this.protocol === "udp") {
            await this.sendUDP(buf, callback);
        } else if (this.protocol === "tcp") {
            await this.sendTCP(transformed, callback);
        } else if (this.protocol === "dynamic") {
            if (Buffer.byteLength(transformed) < this.maxUDPPacketSize) {
                await this.sendUDP(buf, callback);
            } else {
                await this.sendTCP(transformed, callback);
            }
        }
    }

    private connectUDP() {
        const udpClient = dgram.createSocket("udp4");
        udpClient.unref();
        return udpClient;
    }

    private async connectTCP() {
        return new Promise<net.Socket>((resolve, reject) => {
            const tcpClient = new net.Socket();

            const errorListener = (error: any) => {
                console.error("%o", error);
                tcpClient.destroy();
                tcpClient.removeListener("error", connectListener);
                reject(error);
            }

            const connectListener = () => {
                console.info("TCP connection to %s:%d has been established.", this.host, this.port);
                tcpClient.removeListener("connect", connectListener);
                resolve(tcpClient);
            };

            tcpClient.on("error", errorListener)
            tcpClient.on("connect", connectListener);
            tcpClient.on("close", () => {
                console.info("TCP connection to %s:%d has been closed.", this.host, this.port);
            });
            tcpClient.connect(this.port, this.host);
        });
    }

    private async sendUDP(buf: Buffer, callback: any) {
        const udpClient: dgram.Socket = (await this.connect("udp")) as dgram.Socket;
        udpClient.send(buf, 0, buf.length, this.port, this.host, (error, bytes) => {
            if (callback) {
                callback(error, bytes);
            }
        });
    }

    private async sendTCP(transformed: string, callback: any) {
        try {
            const tcpClient: net.Socket = (await this.connect("tcp")) as net.Socket;
            await new Promise<void>((resolve, reject) => {
                tcpClient.write(transformed, (error) => {

                    if (callback) {
                        callback();
                    }
                    tcpClient.destroy();
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            if (callback) {
                callback();
            }
            throw error;
        }
    }
}
