const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: out, error: err1 } = await supabase.from('outlets').select('*');
  console.log('Outlets:', out, err1);
  const { data: sh, error: err2 } = await supabase.from('shifts').insert({ outlet_id: '00000000-0000-0000-0000-000000000001', cashier_name: 'Test', starting_cash: 1000 }).select();
  console.log('Shifts Insert:', sh, err2);
}
run();
