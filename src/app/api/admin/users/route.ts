import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const adminAuthClient = createAdminClient();
    const body = await request.json();
    const { email, password, name, role, outlet_id } = body;

    // Create Auth User
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, appName: role }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    // Insert into public.users
    const { error: dbError } = await adminAuthClient.from('users').insert({
      id: userId,
      email,
      name,
      role,
      outlet_id: outlet_id || '00000000-0000-0000-0000-000000000001'
    });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminAuthClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Delete Auth User (should cascade to public.users)
    const { error } = await adminAuthClient.auth.admin.deleteUser(id);

    // Abaikan error jika user memang tidak ada di sistem Auth (mungkin dibuat manual sebelum integrasi API)
    if (error && !error.message.includes("User not found")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Secara eksplisit hapus juga dari public.users (sebagai backup jika cascade gagal/user tidak ada di Auth)
    const { error: dbError } = await adminAuthClient.from('users').delete().eq('id', id);
    
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
