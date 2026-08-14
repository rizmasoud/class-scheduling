import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE "proposal_unscheduled_students" ("proposal_id" text)');
db.exec("INSERT INTO \"proposal_unscheduled_students\" VALUES ('123')");
const stmt = db.prepare('delete from "proposal_unscheduled_students" where "proposal_unscheduled_students"."proposal_id" = ?');
stmt.run('123');
console.log(db.prepare('SELECT * FROM "proposal_unscheduled_students"').all());
