export enum TokenType {
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Null = 'Null',
  Identifier = 'Identifier',
  FieldRef = 'FieldRef',     // [fieldName]
  ParamRef = 'ParamRef',     // ?paramName
  Plus = 'Plus',             // +
  Minus = 'Minus',           // -
  Multiply = 'Multiply',     // *
  Divide = 'Divide',         // /
  Modulo = 'Modulo',         // %
  Power = 'Power',           // ^
  Equal = 'Equal',           // == or =
  NotEqual = 'NotEqual',     // != or <>
  LessThan = 'LessThan',     // <
  LessEqual = 'LessEqual',   // <=
  GreaterThan = 'GreaterThan',// >
  GreaterEqual = 'GreaterEqual', // >=
  And = 'And',               // && or AND
  Or = 'Or',                 // || or OR
  Not = 'Not',               // ! or NOT
  LParen = 'LParen',         // (
  RParen = 'RParen',         // )
  Comma = 'Comma',           // ,
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}
