/**
 * Tiny logger. In production builds, info/debug are suppressed.
 *
 * Replaces ad-hoc `console.log` calls so we can flip verbosity centrally.
 */

const isProd = process.env.NODE_ENV === "production";

type LogArg = unknown;

function out(level: "debug" | "info" | "warn" | "error", args: LogArg[]): void {
  if (isProd && (level === "debug" || level === "info")) return;
  const tag = `[octype:${level}]`;
  switch (level) {
    case "debug":
    case "info":
      // eslint-disable-next-line no-console
      console.log(tag, ...args);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(tag, ...args);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(tag, ...args);
      break;
  }
}

export const logger = {
  debug: (...args: LogArg[]): void => out("debug", args),
  info: (...args: LogArg[]): void => out("info", args),
  warn: (...args: LogArg[]): void => out("warn", args),
  error: (...args: LogArg[]): void => out("error", args),
};
