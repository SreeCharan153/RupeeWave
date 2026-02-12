from app.core.supabase_client import supabase

def get_account_no(holder_name: str):
    res = (
        supabase.table("accounts")
        .select("account_no")
        .eq("name", holder_name)
        .execute()
    )
    
    if not res.data:
        return None
    
    # Return the most recently created account
    return res.data[-1]["account_no"]
