import { Token, TokenType } from './tokens';

export class Lexer {
  private input: string;
  private pos: number = 0;
  private length: number;

  constructor(input: string) {
    this.input = input.trim();
    // If expression starts with '=', strip it (common report formula syntax e.g. =SUM([Revenue]))
    if (this.input.startsWith('=')) {
      this.input = this.input.substring(1).trim();
    }
    this.length = this.input.length;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.length) {
      const char = this.input[this.pos]!;

      // Skip whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      const startPos = this.pos;

      // Field reference [fieldName]
      if (char === '[') {
        tokens.push(this.readFieldRef(startPos));
        continue;
      }

      // Parameter reference ?paramName
      if (char === '?') {
        tokens.push(this.readParamRef(startPos));
        continue;
      }

      // Strings ('...' or "...")
      if (char === '"' || char === "'") {
        tokens.push(this.readString(startPos, char));
        continue;
      }

      // Numbers (integers or floats)
      if (/\d/.test(char) || (char === '.' && /\d/.test(this.peek() || ''))) {
        tokens.push(this.readNumber(startPos));
        continue;
      }

      // Operators and punctuation
      if (char === '+') { tokens.push({ type: TokenType.Plus, value: '+', position: startPos }); this.pos++; continue; }
      if (char === '-') { tokens.push({ type: TokenType.Minus, value: '-', position: startPos }); this.pos++; continue; }
      if (char === '*') { tokens.push({ type: TokenType.Multiply, value: '*', position: startPos }); this.pos++; continue; }
      if (char === '/') { tokens.push({ type: TokenType.Divide, value: '/', position: startPos }); this.pos++; continue; }
      if (char === '%') { tokens.push({ type: TokenType.Modulo, value: '%', position: startPos }); this.pos++; continue; }
      if (char === '^') { tokens.push({ type: TokenType.Power, value: '^', position: startPos }); this.pos++; continue; }
      if (char === '(') { tokens.push({ type: TokenType.LParen, value: '(', position: startPos }); this.pos++; continue; }
      if (char === ')') { tokens.push({ type: TokenType.RParen, value: ')', position: startPos }); this.pos++; continue; }
      if (char === ',') { tokens.push({ type: TokenType.Comma, value: ',', position: startPos }); this.pos++; continue; }

      // Comparisons
      if (char === '=') {
        if (this.peek() === '=') {
          this.pos += 2;
          tokens.push({ type: TokenType.Equal, value: '==', position: startPos });
        } else {
          this.pos++;
          tokens.push({ type: TokenType.Equal, value: '=', position: startPos });
        }
        continue;
      }

      if (char === '!') {
        if (this.peek() === '=') {
          this.pos += 2;
          tokens.push({ type: TokenType.NotEqual, value: '!=', position: startPos });
        } else {
          this.pos++;
          tokens.push({ type: TokenType.Not, value: '!', position: startPos });
        }
        continue;
      }

      if (char === '<') {
        if (this.peek() === '=') {
          this.pos += 2;
          tokens.push({ type: TokenType.LessEqual, value: '<=', position: startPos });
        } else if (this.peek() === '>') {
          this.pos += 2;
          tokens.push({ type: TokenType.NotEqual, value: '<>', position: startPos });
        } else {
          this.pos++;
          tokens.push({ type: TokenType.LessThan, value: '<', position: startPos });
        }
        continue;
      }

      if (char === '>') {
        if (this.peek() === '=') {
          this.pos += 2;
          tokens.push({ type: TokenType.GreaterEqual, value: '>=', position: startPos });
        } else {
          this.pos++;
          tokens.push({ type: TokenType.GreaterThan, value: '>', position: startPos });
        }
        continue;
      }

      if (char === '&' && this.peek() === '&') {
        this.pos += 2;
        tokens.push({ type: TokenType.And, value: '&&', position: startPos });
        continue;
      }

      if (char === '|' && this.peek() === '|') {
        this.pos += 2;
        tokens.push({ type: TokenType.Or, value: '||', position: startPos });
        continue;
      }

      // Identifiers / keywords (e.g. SUM, IF, AND, OR, NOT, true, false, null)
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier(startPos));
        continue;
      }

      throw new Error(`Unexpected character '${char}' at position ${this.pos} in expression: "${this.input}"`);
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
    return tokens;
  }

  private peek(): string | null {
    if (this.pos + 1 < this.length) {
      return this.input[this.pos + 1]!;
    }
    return null;
  }

  private readFieldRef(startPos: number): Token {
    this.pos++; // skip '['
    let field = '';
    while (this.pos < this.length && this.input[this.pos] !== ']') {
      field += this.input[this.pos];
      this.pos++;
    }
    if (this.pos >= this.length || this.input[this.pos] !== ']') {
      throw new Error(`Unterminated field reference starting at position ${startPos}`);
    }
    this.pos++; // skip ']'
    return { type: TokenType.FieldRef, value: field.trim(), position: startPos };
  }

  private readParamRef(startPos: number): Token {
    this.pos++; // skip '?'
    let param = '';
    while (this.pos < this.length && /[a-zA-Z0-9_]/.test(this.input[this.pos]!)) {
      param += this.input[this.pos];
      this.pos++;
    }
    if (!param) {
      throw new Error(`Expected parameter name after '?' at position ${startPos}`);
    }
    return { type: TokenType.ParamRef, value: param, position: startPos };
  }

  private readString(startPos: number, quote: string): Token {
    this.pos++; // skip quote
    let str = '';
    while (this.pos < this.length) {
      const char = this.input[this.pos]!;
      if (char === '\\') {
        this.pos++;
        if (this.pos < this.length) {
          const next = this.input[this.pos]!;
          if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else if (next === 'r') str += '\r';
          else str += next;
        }
      } else if (char === quote) {
        this.pos++; // skip closing quote
        return { type: TokenType.String, value: str, position: startPos };
      } else {
        str += char;
      }
      this.pos++;
    }
    throw new Error(`Unterminated string literal starting at position ${startPos}`);
  }

  private readNumber(startPos: number): Token {
    let numStr = '';
    let hasDot = false;
    while (this.pos < this.length) {
      const char = this.input[this.pos]!;
      if (/\d/.test(char)) {
        numStr += char;
        this.pos++;
      } else if (char === '.' && !hasDot) {
        hasDot = true;
        numStr += char;
        this.pos++;
      } else {
        break;
      }
    }
    return { type: TokenType.Number, value: numStr, position: startPos };
  }

  private readIdentifier(startPos: number): Token {
    let id = '';
    while (this.pos < this.length && /[a-zA-Z0-9_]/.test(this.input[this.pos]!)) {
      id += this.input[this.pos];
      this.pos++;
    }

    const upper = id.toUpperCase();
    if (upper === 'AND') return { type: TokenType.And, value: id, position: startPos };
    if (upper === 'OR') return { type: TokenType.Or, value: id, position: startPos };
    if (upper === 'NOT') return { type: TokenType.Not, value: id, position: startPos };
    if (upper === 'TRUE' || upper === 'FALSE') return { type: TokenType.Boolean, value: id.toLowerCase(), position: startPos };
    if (upper === 'NULL') return { type: TokenType.Null, value: 'null', position: startPos };

    return { type: TokenType.Identifier, value: id, position: startPos };
  }
}
