const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', 'utf8');

content = content.replace("import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';",
"import { SchedulingEngineConfig } from '../config/scheduling-engine.config';");

fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', content);
