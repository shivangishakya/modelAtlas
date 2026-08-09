import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const catalogUrl = new URL("../app/model-atlas/catalog.ts", import.meta.url);
const sourceText = await readFile(catalogUrl, "utf8");
const sourceFile = ts.createSourceFile(
  catalogUrl.pathname,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

const allowedSourceRoots = [
  "01.ai",
  "ai21.com",
  "amazon.com",
  "anthropic.com",
  "arxiv.org",
  "artificialanalysis.ai",
  "baichuan-ai.com",
  "cohere.com",
  "deepmind.google",
  "deepseek.com",
  "github.com",
  "google.dev",
  "huggingface.co",
  "ibm.com",
  "kimi.com",
  "meta.com",
  "microsoft.com",
  "minimax.io",
  "mistral.ai",
  "modelscope.cn",
  "moonshot.ai",
  "nvidia.com",
  "ollama.com",
  "openai.com",
  "perplexity.ai",
  "qwen.ai",
  "stability.ai",
  "stepfun.com",
  "x.ai",
  "z.ai",
];

const requiredModelFields = [
  "id",
  "name",
  "maker",
  "mark",
  "tone",
  "type",
  "access",
  "context",
  "price",
  "modalities",
  "license",
  "best",
  "limits",
  "tags",
  "scores",
  "keywords",
  "link",
  "proofs",
];

function fail(node, message) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  throw new Error(
    `Catalog validation failed at ${position.line + 1}:${position.character + 1}: ${message}`,
  );
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  fail(node, "Only identifier and string-literal property names are allowed.");
}

function literalValue(node, path = "catalog") {
  if (ts.isParenthesizedExpression(node)) {
    return literalValue(node.expression, path);
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.MinusToken ||
      node.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(node.operand)
  ) {
    const number = Number(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -number : number;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element, index) => {
      if (ts.isSpreadElement(element)) {
        fail(element, `${path}[${index}] may not use spread syntax.`);
      }
      return literalValue(element, `${path}[${index}]`);
    });
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result = Object.create(null);

    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) {
        fail(
          property,
          `${path} may contain only explicit property assignments.`,
        );
      }

      const name = propertyName(property.name);
      if (Object.hasOwn(result, name)) {
        fail(property, `${path}.${name} is duplicated.`);
      }
      result[name] = literalValue(property.initializer, `${path}.${name}`);
    }

    return result;
  }

  fail(
    node,
    `${path} must remain literal data; expressions, calls, imports, spreads, and executable code are not allowed.`,
  );
}

function assertPlainObject(value, label) {
  assert.equal(typeof value, "object", `${label} must be an object.`);
  assert.notEqual(value, null, `${label} must be an object.`);
  assert.equal(Array.isArray(value), false, `${label} must be an object.`);
}

function assertString(value, label, maxLength = 500) {
  assert.equal(typeof value, "string", `${label} must be a string.`);
  assert.ok(value.trim().length > 0, `${label} may not be empty.`);
  assert.ok(value.length <= maxLength, `${label} is longer than ${maxLength}.`);
  assert.equal(
    [...value].some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint !== undefined &&
        codePoint < 32 &&
        codePoint !== 9 &&
        codePoint !== 10 &&
        codePoint !== 13
      );
    }),
    false,
    `${label} contains control characters.`,
  );
}

function assertStringArray(value, label, minimum, maximum) {
  assert.ok(Array.isArray(value), `${label} must be an array.`);
  assert.ok(
    value.length >= minimum && value.length <= maximum,
    `${label} must contain ${minimum}–${maximum} items.`,
  );
  value.forEach((item, index) => assertString(item, `${label}[${index}]`, 220));
}

function assertSourceUrl(value, label) {
  assertString(value, label, 500);
  const url = new URL(value);
  assert.equal(url.protocol, "https:", `${label} must use HTTPS.`);
  const hostname = url.hostname.toLowerCase();
  assert.ok(
    allowedSourceRoots.some(
      (root) => hostname === root || hostname.endsWith(`.${root}`),
    ),
    `${label} uses an unreviewed source hostname: ${hostname}.`,
  );
}

function validateModel(model, index, ids, names) {
  const label = `models[${index}]`;
  assertPlainObject(model, label);
  assert.deepEqual(
    Object.keys(model).sort(),
    [...requiredModelFields].sort(),
    `${label} must contain exactly the reviewed Model fields.`,
  );

  assertString(model.id, `${label}.id`, 80);
  assert.match(model.id, /^[a-z0-9][a-z0-9-]*$/u, `${label}.id is invalid.`);
  assert.equal(ids.has(model.id), false, `${label}.id is duplicated.`);
  ids.add(model.id);

  assertString(model.name, `${label}.name`, 120);
  assert.equal(names.has(model.name), false, `${label}.name is duplicated.`);
  names.add(model.name);

  for (const field of [
    "maker",
    "type",
    "context",
    "price",
    "modalities",
    "license",
    "best",
    "limits",
  ]) {
    assertString(model[field], `${label}.${field}`, 500);
  }

  assertString(model.mark, `${label}.mark`, 16);
  assert.ok(
    ["lime", "coral", "blue", "violet"].includes(model.tone),
    `${label}.tone is invalid.`,
  );
  assert.ok(
    ["API", "Open weights", "App + API"].includes(model.access),
    `${label}.access is invalid.`,
  );

  assertStringArray(model.tags, `${label}.tags`, 1, 12);
  assertStringArray(model.keywords, `${label}.keywords`, 2, 30);

  assertPlainObject(model.scores, `${label}.scores`);
  const scores = Object.entries(model.scores);
  assert.ok(
    scores.length > 0 && scores.length <= 20,
    `${label}.scores is invalid.`,
  );
  for (const [domain, score] of scores) {
    assert.match(
      domain,
      /^[a-z][a-z0-9-]*$/u,
      `${label}.scores.${domain} is invalid.`,
    );
    assert.equal(
      typeof score,
      "number",
      `${label}.scores.${domain} must be numeric.`,
    );
    assert.ok(
      Number.isFinite(score),
      `${label}.scores.${domain} must be finite.`,
    );
    assert.ok(
      score >= 0 && score <= 100,
      `${label}.scores.${domain} must be 0–100.`,
    );
  }

  assertSourceUrl(model.link, `${label}.link`);
  assert.ok(
    Array.isArray(model.proofs) &&
      model.proofs.length >= 1 &&
      model.proofs.length <= 8,
    `${label}.proofs must contain 1–8 items.`,
  );

  model.proofs.forEach((proof, proofIndex) => {
    const proofLabel = `${label}.proofs[${proofIndex}]`;
    assertPlainObject(proof, proofLabel);
    assert.deepEqual(
      Object.keys(proof).sort(),
      ["label", "note", "source", "url", "value"].sort(),
      `${proofLabel} contains unexpected fields.`,
    );
    assertString(proof.label, `${proofLabel}.label`, 100);
    assertString(proof.value, `${proofLabel}.value`, 100);
    assertString(proof.note, `${proofLabel}.note`, 300);
    assertString(proof.source, `${proofLabel}.source`, 160);
    assertSourceUrl(proof.url, `${proofLabel}.url`);
  });
}

assert.equal(
  sourceFile.parseDiagnostics.length,
  0,
  "catalog.ts contains TypeScript parse errors.",
);

const imports = sourceFile.statements.filter(ts.isImportDeclaration);
assert.equal(
  imports.length,
  1,
  "catalog.ts must contain one type-only import.",
);
assert.equal(
  imports[0].importClause?.isTypeOnly,
  true,
  "catalog.ts may import types only.",
);
assert.equal(
  imports[0].moduleSpecifier.text,
  "./types",
  "catalog.ts may import only ./types.",
);

const variableStatements = sourceFile.statements.filter(ts.isVariableStatement);
assert.equal(
  sourceFile.statements.length,
  imports.length + variableStatements.length,
  "catalog.ts may contain only its type import and exported data constants.",
);
assert.equal(
  variableStatements.length,
  2,
  "catalog.ts must export two data constants.",
);

const values = new Map();
for (const statement of variableStatements) {
  assert.ok(
    statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ),
    "Catalog constants must be exported.",
  );
  assert.ok(
    statement.declarationList.flags & ts.NodeFlags.Const,
    "Catalog data must use const declarations.",
  );
  assert.equal(
    statement.declarationList.declarations.length,
    1,
    "Each catalog constant must use a separate declaration.",
  );

  const declaration = statement.declarationList.declarations[0];
  assert.ok(
    ts.isIdentifier(declaration.name),
    "Catalog constant names must be identifiers.",
  );
  assert.ok(
    declaration.initializer,
    `${declaration.name.text} requires an initializer.`,
  );
  values.set(
    declaration.name.text,
    literalValue(declaration.initializer, declaration.name.text),
  );
}

assert.deepEqual(
  [...values.keys()].sort(),
  ["independent", "models"],
  "catalog.ts must export only independent and models.",
);
assertSourceUrl(values.get("independent"), "independent");

const models = values.get("models");
assert.ok(Array.isArray(models), "models must be an array literal.");
assert.ok(
  models.length >= 10 && models.length <= 100,
  "models must contain 10–100 entries.",
);

const ids = new Set();
const names = new Set();
models.forEach((model, index) => validateModel(model, index, ids, names));

console.log(`Validated ${models.length} literal model records.`);
