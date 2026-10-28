import { Token, TokenType } from './tokens';
import { ASTNode } from './ast';
import { Lexer } from './lexer';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(expression: string): ASTNode {
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parseExpression();
    if (!parser.isAtEnd() && parser.peek().type !== TokenType.EOF) {
      throw new Error(`Unexpected token "${parser.peek().value}" at position ${parser.peek().position}`);
    }
    return ast;
  }

  public parseExpression(): ASTNode {
    return this.logicalOr();
  }

  private logicalOr(): ASTNode {
    let expr = this.logicalAnd();

    while (this.match(TokenType.Or)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private logicalAnd(): ASTNode {
    let expr = this.equality();

    while (this.match(TokenType.And)) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private equality(): ASTNode {
    let expr = this.relational();

    while (this.match(TokenType.Equal, TokenType.NotEqual)) {
      const operator = this.previous().value;
      const right = this.relational();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private relational(): ASTNode {
    let expr = this.additive();

    while (this.match(TokenType.LessThan, TokenType.LessEqual, TokenType.GreaterThan, TokenType.GreaterEqual)) {
      const operator = this.previous().value;
      const right = this.additive();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private additive(): ASTNode {
    let expr = this.multiplicative();

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous().value;
      const right = this.multiplicative();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private multiplicative(): ASTNode {
    let expr = this.power();

    while (this.match(TokenType.Multiply, TokenType.Divide, TokenType.Modulo)) {
      const operator = this.previous().value;
      const right = this.power();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private power(): ASTNode {
    let expr = this.unary();

    while (this.match(TokenType.Power)) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }

    return expr;
  }

  private unary(): ASTNode {
    if (this.match(TokenType.Minus, TokenType.Not)) {
      const operator = this.previous().value;
      const operand = this.unary();
      return { type: 'UnaryOp', operator, operand };
    }

    return this.primary();
  }

  private primary(): ASTNode {
    if (this.match(TokenType.Number)) {
      return { type: 'Literal', value: parseFloat(this.previous().value) };
    }

    if (this.match(TokenType.String)) {
      return { type: 'Literal', value: this.previous().value };
    }

    if (this.match(TokenType.Boolean)) {
      return { type: 'Literal', value: this.previous().value.toLowerCase() === 'true' };
    }

    if (this.match(TokenType.Null)) {
      return { type: 'Literal', value: null };
    }

    if (this.match(TokenType.FieldRef)) {
      return { type: 'FieldRef', name: this.previous().value };
    }

    if (this.match(TokenType.ParamRef)) {
      return { type: 'ParamRef', name: this.previous().value };
    }

    if (this.match(TokenType.Identifier)) {
      const name = this.previous().value;

      // Function call: Identifier ( args... )
      if (this.match(TokenType.LParen)) {
        const args: ASTNode[] = [];
        if (!this.check(TokenType.RParen)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.Comma));
        }
        this.consume(TokenType.RParen, `Expected ')' after function arguments for "${name}"`);
        return { type: 'FunctionCall', name, args };
      }

      return { type: 'Identifier', name };
    }

    if (this.match(TokenType.LParen)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RParen, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token "${this.peek().value}" at position ${this.peek().position}`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current]!;
  }

  private previous(): Token {
    return this.tokens[this.current - 1]!;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} at position ${this.peek().position}`);
  }
}
