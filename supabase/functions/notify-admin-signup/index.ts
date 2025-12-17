import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { record } = await req.json();
    
    if (!record) {
      console.log("No record provided");
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("New user signup:", record.id, record.email);

    // Get all admin users
    const { data: admins, error: adminsError } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      throw adminsError;
    }

    if (!admins || admins.length === 0) {
      console.log("No admins found");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, username")
      .eq("id", record.id)
      .single();

    const displayName = profile?.full_name || profile?.username || record.email || "Unknown user";

    // Create notifications for all admins
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      type: "new_user_signup",
      title: "New User Signup",
      message: `${displayName} has signed up and is awaiting review`,
      data: {
        user_id: record.id,
        email: record.email,
        full_name: profile?.full_name,
      },
    }));

    const { error: notifyError } = await supabaseClient
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      console.error("Error creating notifications:", notifyError);
      throw notifyError;
    }

    console.log(`Notified ${admins.length} admin(s) about new signup`);

    return new Response(
      JSON.stringify({ success: true, notified: admins.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
