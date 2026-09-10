import { createClient } from "./supabase/client";

export async function logActivity(
  action: string,
  description: string,
  outletId: string = "00000000-0000-0000-0000-000000000001",
  userName: string = "Kasir / Admin"
) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.from("activity_logs").insert({
      action,
      description,
      outlet_id: outletId,
      user_name: userName,
    });
    
    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
