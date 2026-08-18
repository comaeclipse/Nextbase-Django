const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const cities = [
  ["Camden","AR"],["Colorado Springs","CO"],["Pueblo","CO"],["Atlanta","GA"],["Wichita","KS"],
  ["Forest","MS"],["Raleigh","NC"],["Manchester","NH"],["Albuquerque","NM"],["Binghamton","NY"],
  ["Ashville","OH"],["Oklahoma City","OK"],["Memphis","TN"],["Nashville","TN"],["Dallas","TX"],
  ["El Paso","TX"],["Houston","TX"],["Spokane","WA"],
  ["Florence","AL"],["Mobile","AL"],["Gilbert","AZ"],["Fresno","CA"],["Boulder","CO"],
  ["Broomfield","CO"],["Fort Collins","CO"],["Grand Junction","CO"],["Wilmington","DE"],
  ["Des Moines","IA"],["Indianapolis","IN"],["Indian Trail","NC"],["Fargo","ND"],
  ["North Platte","NE"],["Watertown","NY"],["Bend","OR"],["Pittsburgh","PA"],["Warren","PA"],
  ["Greenville","SC"],["Pierre","SD"],["Sioux Falls","SD"],["Odessa","TX"],["Bellevue","WA"],
  ["Milwaukee","WI"]
];

(async () => {
  const rows = await sql`
    SELECT id, name, state, defense_hub, defense_hub_manual
    FROM locations_location
    WHERE defense_hub_manual IS NULL
    ORDER BY state, name`;
  console.log("Total defense_hub_manual IS NULL:", rows.length);
  for (const r of rows) {
    console.log(`${r.id}\t${r.name}, ${r.state}\thub=${r.defense_hub}`);
  }

  // Check employer presence for each of the 42
  console.log("\n--- Employer presence check ---");
  for (const [name, state] of cities) {
    const loc = await sql`SELECT id, defense_hub, defense_hub_manual FROM locations_location WHERE lower(name)=lower(${name}) AND upper(state)=upper(${state})`;
    if (loc.length === 0) {
      console.log(`${name}, ${state}\tNOT FOUND IN DB`);
      continue;
    }
    const l = loc[0];
    const emp = await sql`
      SELECT de.display_name, de.parent_company, de.counts_as_defense, del.onsite_count, del.hybrid_count, del.remote_count, del.active
      FROM defense_employer_locations del
      JOIN defense_employers de ON de.id = del.employer_id
      WHERE del.location_id = ${l.id}`;
    console.log(`${name}, ${state}\tid=${l.id}\thub=${l.defense_hub}\tmanual=${l.defense_hub_manual}\temployers=${JSON.stringify(emp)}`);
  }
})().catch((error) => { console.error(error); process.exit(1); });
