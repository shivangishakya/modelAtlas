import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const domainsUrl = new URL("../app/model-atlas/domains.ts", import.meta.url);
const catalogUrl = new URL("../app/model-atlas/catalog.ts", import.meta.url);
const [domainsSource, catalogSource] = await Promise.all([
  readFile(domainsUrl, "utf8"),
  readFile(catalogUrl, "utf8"),
]);

function parseSource(url, sourceText) {
  const sourceFile = ts.createSourceFile(
    url.pathname,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert.equal(
    sourceFile.parseDiagnostics.length,
    0,
    `${url.pathname} contains TypeScript parse errors.`,
  );
  return sourceFile;
}

const domainsFile = parseSource(domainsUrl, domainsSource);
const catalogFile = parseSource(catalogUrl, catalogSource);

function fail(sourceFile, node, message) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  throw new Error(
    `Domain Map validation failed at ${position.line + 1}:${position.character + 1}: ${message}`,
  );
}

function propertyName(sourceFile, node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  fail(
    sourceFile,
    node,
    "Only identifier and string-literal property names are allowed.",
  );
}

function literalValue(sourceFile, node, path) {
  if (ts.isParenthesizedExpression(node)) {
    return literalValue(sourceFile, node.expression, path);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element, index) => {
      if (ts.isSpreadElement(element)) {
        fail(
          sourceFile,
          element,
          `${path}[${index}] may not use spread syntax.`,
        );
      }
      return literalValue(sourceFile, element, `${path}[${index}]`);
    });
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result = Object.create(null);
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) {
        fail(
          sourceFile,
          property,
          `${path} may contain only explicit property assignments.`,
        );
      }
      const name = propertyName(sourceFile, property.name);
      if (Object.hasOwn(result, name)) {
        fail(sourceFile, property, `${path}.${name} is duplicated.`);
      }
      result[name] = literalValue(
        sourceFile,
        property.initializer,
        `${path}.${name}`,
      );
    }
    return result;
  }

  fail(
    sourceFile,
    node,
    `${path} must remain literal data; expressions, calls, imports, spreads, and executable code are not allowed.`,
  );
}

function exportedLiteralValues(sourceFile) {
  const values = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }
      values.set(
        declaration.name.text,
        literalValue(
          sourceFile,
          declaration.initializer,
          declaration.name.text,
        ),
      );
    }
  }
  return values;
}

function assertPlainObject(value, label) {
  assert.equal(typeof value, "object", `${label} must be an object.`);
  assert.notEqual(value, null, `${label} must be an object.`);
  assert.equal(Array.isArray(value), false, `${label} must be an object.`);
}

function assertString(value, label, maximum = 500) {
  assert.equal(typeof value, "string", `${label} must be a string.`);
  assert.ok(value.trim().length > 0, `${label} may not be empty.`);
  assert.ok(value.length <= maximum, `${label} is longer than ${maximum}.`);
}

function assertUniqueStringArray(value, label, minimum, maximum) {
  assert.ok(Array.isArray(value), `${label} must be an array.`);
  assert.ok(
    value.length >= minimum && value.length <= maximum,
    `${label} must contain ${minimum}–${maximum} items.`,
  );
  const uniqueValues = new Set();
  value.forEach((item, index) => {
    assertString(item, `${label}[${index}]`, 220);
    assert.equal(
      uniqueValues.has(item),
      false,
      `${label} contains duplicates.`,
    );
    uniqueValues.add(item);
  });
}

const imports = domainsFile.statements.filter(ts.isImportDeclaration);
assert.equal(
  imports.length,
  1,
  "domains.ts must contain one type-only import.",
);
assert.equal(
  imports[0].importClause?.isTypeOnly,
  true,
  "domains.ts may import types only.",
);
assert.equal(
  imports[0].moduleSpecifier.text,
  "./types",
  "domains.ts may import only ./types.",
);

const domainStatements = domainsFile.statements.filter(ts.isVariableStatement);
assert.equal(
  domainsFile.statements.length,
  imports.length + domainStatements.length,
  "domains.ts may contain only its type import and exported data constants.",
);
assert.equal(
  domainStatements.length,
  6,
  "domains.ts must export six data constants.",
);
for (const statement of domainStatements) {
  assert.ok(
    statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ),
    "Domain Map constants must be exported.",
  );
  assert.ok(
    statement.declarationList.flags & ts.NodeFlags.Const,
    "Domain Map data must use const declarations.",
  );
  assert.equal(
    statement.declarationList.declarations.length,
    1,
    "Each Domain Map constant must use a separate declaration.",
  );
}

const values = exportedLiteralValues(domainsFile);
assert.deepEqual(
  [...values.keys()].sort(),
  [
    "caution",
    "domainLeaders",
    "domainSignals",
    "domains",
    "presets",
    "priorityDefs",
  ],
  "domains.ts exports an unexpected data constant.",
);

const domains = values.get("domains");
assert.ok(Array.isArray(domains), "domains must be an array literal.");
assert.ok(
  domains.length >= 8 && domains.length <= 30,
  "domains must contain 8–30 entries.",
);

const domainIds = new Set();
domains.forEach((domain, index) => {
  const label = `domains[${index}]`;
  assertPlainObject(domain, label);
  assert.deepEqual(
    Object.keys(domain).sort(),
    ["areas", "desc", "example", "icon", "id", "name"],
    `${label} must contain exactly the reviewed Domain fields.`,
  );
  assertString(domain.id, `${label}.id`, 60);
  assert.match(domain.id, /^[a-z][a-z0-9-]*$/u, `${label}.id is invalid.`);
  assert.equal(domainIds.has(domain.id), false, `${label}.id is duplicated.`);
  domainIds.add(domain.id);
  assertString(domain.icon, `${label}.icon`, 16);
  assertString(domain.name, `${label}.name`, 100);
  assertString(domain.desc, `${label}.desc`, 180);
  assertUniqueStringArray(domain.areas, `${label}.areas`, 3, 8);
  assertString(domain.example, `${label}.example`, 500);
});

const caution = values.get("caution");
const domainLeaders = values.get("domainLeaders");
const domainSignals = values.get("domainSignals");
for (const [value, label] of [
  [caution, "caution"],
  [domainLeaders, "domainLeaders"],
  [domainSignals, "domainSignals"],
]) {
  assertPlainObject(value, label);
  assert.deepEqual(
    Object.keys(value).sort(),
    [...domainIds].sort(),
    `${label} must contain exactly one entry for every domain.`,
  );
}

for (const id of domainIds) {
  assertString(caution[id], `caution.${id}`, 500);
  assertUniqueStringArray(domainSignals[id], `domainSignals.${id}`, 2, 8);
}

const catalogValues = exportedLiteralValues(catalogFile);
const models = catalogValues.get("models");
assert.ok(Array.isArray(models), "catalog models must be an array literal.");
const modelIds = new Set(models.map((model) => model.id));

for (const id of domainIds) {
  assertUniqueStringArray(domainLeaders[id], `domainLeaders.${id}`, 3, 8);
  domainLeaders[id].forEach((modelId) => {
    assert.ok(
      modelIds.has(modelId),
      `domainLeaders.${id} references unknown model ID ${modelId}.`,
    );
  });
}

models.forEach((model, modelIndex) => {
  for (const scoreDomain of Object.keys(model.scores)) {
    assert.ok(
      domainIds.has(scoreDomain),
      `models[${modelIndex}].scores references unknown domain ${scoreDomain}.`,
    );
  }
});

const presets = values.get("presets");
assertUniqueStringArray(presets, "presets", 3, 12);

const priorityDefs = values.get("priorityDefs");
assert.ok(
  Array.isArray(priorityDefs),
  "priorityDefs must be an array literal.",
);
assert.ok(
  priorityDefs.length >= 3 && priorityDefs.length <= 10,
  "priorityDefs must contain 3–10 entries.",
);
const priorityIds = new Set();
priorityDefs.forEach((priority, index) => {
  const label = `priorityDefs[${index}]`;
  assertPlainObject(priority, label);
  assert.deepEqual(
    Object.keys(priority).sort(),
    ["id", "label"],
    `${label} must contain exactly id and label.`,
  );
  assertString(priority.id, `${label}.id`, 60);
  assert.match(priority.id, /^[a-z][a-z0-9-]*$/u, `${label}.id is invalid.`);
  assert.equal(
    priorityIds.has(priority.id),
    false,
    `${label}.id is duplicated.`,
  );
  priorityIds.add(priority.id);
  assertString(priority.label, `${label}.label`, 100);
});

console.log(
  `Validated ${domains.length} domains, ${modelIds.size} model references and ${priorityDefs.length} priorities.`,
);
