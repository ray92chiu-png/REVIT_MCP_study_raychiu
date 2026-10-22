// Static contract regression only; does not replace a live Revit geometry/door-host test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wallTools } from '../build/tools/wall-tools.js';

const schema = wallTools.find(t => t.name === 'create_wall').inputSchema;
assert.deepEqual(schema.required, ['startX', 'startY', 'endX', 'endY']);
for (const key of ['levelId', 'wallTypeId']) {
  assert.equal(schema.properties[key].type, 'integer');
  assert.equal(schema.properties[key].minimum, 1);
}
for (const key of ['levelName', 'wallType']) {
  assert.equal(schema.properties[key].type, 'string');
  assert.equal(schema.properties[key].minLength, 1);
}
assert.equal(schema.properties.height.exclusiveMinimum, 0);
const source = readFileSync(new URL('../../MCP/Core/CommandExecutor.cs', import.meta.url), 'utf8');
const method = source.split('private object CreateWall(JObject parameters)')[1].split('private object GetProjectInfo()')[0];
assert.ok(!method.includes('FirstOrDefault()'), 'Must not select arbitrary level/type');
assert.ok(method.includes('(doc.ActiveView as ViewPlan)?.GenLevel'));
assert.ok(method.includes('level.Name != levelName'));
assert.ok(method.includes('wallType.Name != wallTypeName'));
assert.ok(method.includes('wallType.Kind != WallKind.Basic'));
assert.ok(method.includes('double.IsNaN(v) || double.IsInfinity(v)'));
assert.ok(method.includes('height <= 0'));
assert.ok(method.includes('ShortCurveTolerance'));
assert.ok(method.includes('Wall.Create(doc, line, wallType.Id, level.Id, height / 304.8, 0, false, false)'));
assert.ok(method.includes('TransactionStatus.Committed'));
console.log('PASS: create_wall schema and static guard regression (live Revit verification pending).');
