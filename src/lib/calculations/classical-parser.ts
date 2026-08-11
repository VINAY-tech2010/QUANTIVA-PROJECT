/**
 * Safe arithmetic expression evaluator. Uses the shunting-yard algorithm.
 * NO eval / Function constructor. Supports + - * / % (percent), parentheses,
 * unary +/-, and decimals.
 */

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "percent" };

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let prev: Token | null = null;
  const s = input.replace(/\s+/g, "").replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");

  while (i < s.length) {
    const ch = s[i];
    if (ch >= "0" && ch <= "9") {
      let num = "";
      while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) {
        num += s[i];
        i++;
      }
      const value = parseFloat(num);
      if (Number.isNaN(value)) throw new Error("Invalid number");
      tokens.push({ type: "num", value });
      prev = tokens[tokens.length - 1];
      continue;
    }
    if (ch === ".") {
      // Leading decimal like ".5"
      let num = "0.";
      i++;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") {
        num += s[i];
        i++;
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      prev = tokens[tokens.length - 1];
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      prev = tokens[tokens.length - 1];
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      prev = tokens[tokens.length - 1];
      i++;
      continue;
    }
    if (ch === "%") {
      tokens.push({ type: "percent" });
      prev = tokens[tokens.length - 1];
      i++;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      // Unary +/- when at start, after an operator, or after lparen.
      const isUnary =
        prev === null || prev.type === "op" || prev.type === "lparen";
      if (isUnary && (ch === "+" || ch === "-")) {
        // Represent unary as 0 <op> for simplicity.
        tokens.push({ type: "num", value: 0 });
        tokens.push({ type: "op", value: ch });
        prev = tokens[tokens.length - 1];
        i++;
        continue;
      }
      tokens.push({ type: "op", value: ch });
      prev = tokens[tokens.length - 1];
      i++;
      continue;
    }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  for (const token of tokens) {
    if (token.type === "num") {
      output.push(token);
    } else if (token.type === "percent") {
      // Percent applies to the previous number: convert to /100.
      output.push({ type: "num", value: 100 });
      output.push({ type: "op", value: "/" });
    } else if (token.type === "op") {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].type === "op" &&
        PRECEDENCE[(stack[stack.length - 1] as { value: string }).value] >= PRECEDENCE[token.value]
      ) {
        output.push(stack.pop()!);
      }
      stack.push(token);
    } else if (token.type === "lparen") {
      stack.push(token);
    } else if (token.type === "rparen") {
      while (stack.length > 0 && stack[stack.length - 1].type !== "lparen") {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) throw new Error("Mismatched parentheses");
      stack.pop(); // remove lparen
    }
  }
  while (stack.length > 0) {
    const t = stack.pop()!;
    if (t.type === "lparen") throw new Error("Mismatched parentheses");
    output.push(t);
  }
  return output;
}

function evalRPN(rpn: Token[]): number {
  const stack: number[] = [];
  for (const token of rpn) {
    if (token.type === "num") {
      stack.push(token.value);
    } else if (token.type === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("Invalid expression");
      let result: number;
      switch (token.value) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
          result = a * b;
          break;
        case "/":
          if (b === 0) throw new Error("Division by zero");
          result = a / b;
          break;
        default:
          throw new Error("Unknown operator");
      }
      stack.push(result);
    }
  }
  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}

/**
 * Evaluate an arithmetic expression string. Returns the numeric result.
 * Throws on invalid input.
 */
export function evaluateExpression(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty expression");
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) throw new Error("Empty expression");
  const rpn = toRPN(tokens);
  const result = evalRPN(rpn);
  if (!Number.isFinite(result)) throw new Error("Result out of range");
  return result;
}
