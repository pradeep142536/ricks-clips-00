import fs from 'node:fs';
const plan = JSON.parse(fs.readFileSync(new URL('../08_preview/world_inspection_plan.json', import.meta.url), 'utf8'));
if (plan.camera_tests.length !== 5) throw new Error('Expected five inspection cameras');
if (plan.pass_conditions.length < 5) throw new Error('Missing inspection pass conditions');
console.log(`INSPECTION_PLAN_PASS cameras=${plan.camera_tests.length} conditions=${plan.pass_conditions.length}`);
