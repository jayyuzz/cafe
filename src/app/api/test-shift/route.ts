import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  
  const { data, error } = await supabase.from('shifts').insert({
    outlet_id: '00000000-0000-0000-0000-000000000001',
    cashier_name: 'Test API',
    starting_cash: 50000
  });

  return NextResponse.json({ data, error });
}
