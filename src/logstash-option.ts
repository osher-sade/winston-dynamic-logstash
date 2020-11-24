import {LoggerOptions} from "winston";

export interface LogstashOption extends LoggerOptions {
    host: string;
    port: number;
    application?: string;
    hostname?: string;
    protocol?: "tcp" | "udp" | "dynamic";
    tcpKeepAliveInitialDelay?: number;
}
