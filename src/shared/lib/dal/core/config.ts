import { nestJsErrorParser } from "../parsers/nestjs";
import type { ErrorParser } from "../parsers/types";

let activeParser: ErrorParser = nestJsErrorParser;

export interface DalConfig {
  errorParser?: ErrorParser;
}

export function configureDal(config: DalConfig): void {
  if (config.errorParser) {
    activeParser = config.errorParser;
  }
}

export function getErrorParser(): ErrorParser {
  return activeParser;
}
