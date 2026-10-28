export type ASTNodeType =
  | 'Literal'
  | 'FieldRef'
  | 'ParamRef'
  | 'Identifier'
  | 'UnaryOp'
  | 'BinaryOp'
  | 'FunctionCall'
  | 'Conditional';

export interface BaseASTNode {
  type: ASTNodeType;
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: number | string | boolean | null;
}

export interface FieldRefNode extends BaseASTNode {
  type: 'FieldRef';
  name: string;
}

export interface ParamRefNode extends BaseASTNode {
  type: 'ParamRef';
  name: string;
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface UnaryOpNode extends BaseASTNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

export interface BinaryOpNode extends BaseASTNode {
  type: 'BinaryOp';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface FunctionCallNode extends BaseASTNode {
  type: 'FunctionCall';
  name: string;
  args: ASTNode[];
}

export interface ConditionalNode extends BaseASTNode {
  type: 'Conditional';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export type ASTNode =
  | LiteralNode
  | FieldRefNode
  | ParamRefNode
  | IdentifierNode
  | UnaryOpNode
  | BinaryOpNode
  | FunctionCallNode
  | ConditionalNode;
