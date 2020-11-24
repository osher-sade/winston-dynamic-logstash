import {LoggerOptions} from "winston";

export interface LogstashOption extends LoggerOptions {
    host: string;
    port: number;
    protocol?: "tcp" | "udp" | "dynamic";
}
