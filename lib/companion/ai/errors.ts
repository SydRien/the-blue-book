export class CompanionAiError extends Error {
  readonly code: "missing_key" | "bad_request" | "upstream";

  constructor(code: CompanionAiError["code"], message: string) {
    super(message);
    this.name = "CompanionAiError";
    this.code = code;
  }
}
